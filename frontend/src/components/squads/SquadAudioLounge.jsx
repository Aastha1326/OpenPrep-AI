import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic, MicOff, Volume2, VolumeX, Monitor, MonitorOff,
  Maximize2, Minimize2, Users, Radio, Zap, BookOpen,
  X, ShieldAlert, Sparkles, Activity
} from 'lucide-react';
import { io } from 'socket.io-client';

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ]
};

export default function SquadAudioLounge({ squadId, squadName = 'Study Squad', currentUser, onClose }) {
  // Connection State
  const [isConnected, setIsConnected] = useState(false);
  const [peers, setPeers] = useState({}); // socketId -> participant object
  const [errorMessage, setErrorMessage] = useState(null);

  // Audio & Media State
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isPttMode, setIsPttMode] = useState(false);
  const [isPttActive, setIsPttActive] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [volumes, setVolumes] = useState({}); // socketId -> volume (0 to 100)

  // Speaking Waveform State
  const [speakingPeers, setSpeakingPeers] = useState({}); // socketId -> volume level 0-100
  const [localVolumeLevel, setLocalVolumeLevel] = useState(0);

  // Focus Mode PiP & Quiz/Flashcard Overlay State
  const [isPipMode, setIsPipMode] = useState(false);
  const [activeStudyTab, setActiveStudyTab] = useState('none'); // 'none', 'flashcards', 'quizzes'

  // Refs for WebRTC & Audio Context
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const peerConnections = useRef({}); // socketId -> RTCPeerConnection
  const audioElements = useRef({}); // socketId -> HTMLAudioElement
  const audioContextRef = useRef(null);
  const analysersRef = useRef({}); // socketId -> AnalyserNode
  const localAnalyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const screenVideoRef = useRef(null);
  const remoteScreenVideoRefs = useRef({});

  // Initialize Socket.io connection and WebAudio Context
  useEffect(() => {
    const token = localStorage.getItem('token');
    const socket = io(process.env.REACT_APP_API_URL || 'http://localhost:5001', {
      auth: { token }
    });
    socketRef.current = socket;

    // Web Audio Context initialization
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (AudioCtx) {
      audioContextRef.current = new AudioCtx();
    }

    socket.on('connect', () => {
      setIsConnected(true);
      setErrorMessage(null);
      // Request local media stream and join room
      startLocalAudioStream().then((stream) => {
        socket.emit('squad:join_audio_lounge', {
          squadId,
          user: currentUser
        });
      }).catch((err) => {
        console.error('Audio stream permission error:', err);
        setErrorMessage('Microphone access denied or unavailable.');
      });
    });

    socket.on('squad:audio_lounge_error', ({ message }) => {
      setErrorMessage(message);
    });

    // Handle existing peers when joining
    socket.on('squad:existing_peers', ({ peers: existingPeers }) => {
      const peerMap = {};
      existingPeers.forEach(peer => {
        if (peer.socketId !== socket.id) {
          peerMap[peer.socketId] = peer;
          createPeerConnection(peer.socketId, true); // Caller side creates offer
        }
      });
      setPeers(peerMap);
    });

    // Handle new peer joining
    socket.on('squad:peer_joined', ({ peer }) => {
      if (peer.socketId === socket.id) return;
      setPeers(prev => ({ ...prev, [peer.socketId]: peer }));
      // Answer side will wait for offer from new peer
    });

    // Handle WebRTC Offer
    socket.on('squad:webrtc_offer', async ({ callerSocketId, offer }) => {
      const pc = createPeerConnection(callerSocketId, false);
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit('squad:webrtc_answer', {
          targetSocketId: callerSocketId,
          answer
        });
      } catch (err) {
        console.error('Error handling WebRTC offer:', err);
      }
    });

    // Handle WebRTC Answer
    socket.on('squad:webrtc_answer', async ({ responderSocketId, answer }) => {
      const pc = peerConnections.current[responderSocketId];
      if (pc) {
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (err) {
          console.error('Error setting remote description answer:', err);
        }
      }
    });

    // Handle ICE Candidate
    socket.on('squad:webrtc_ice_candidate', async ({ senderSocketId, candidate }) => {
      const pc = peerConnections.current[senderSocketId];
      if (pc && candidate) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (err) {
          console.error('Error adding ICE candidate:', err);
        }
      }
    });

    // Handle peer state changes (mute, deafen, screen share, speaking)
    socket.on('squad:peer_state_changed', ({ socketId, isMuted, isDeafened, isScreenSharing, isSpeaking }) => {
      setPeers(prev => {
        if (!prev[socketId]) return prev;
        return {
          ...prev,
          [socketId]: {
            ...prev[socketId],
            isMuted: isMuted ?? prev[socketId].isMuted,
            isDeafened: isDeafened ?? prev[socketId].isDeafened,
            isScreenSharing: isScreenSharing ?? prev[socketId].isScreenSharing,
            isSpeaking: isSpeaking ?? prev[socketId].isSpeaking
          }
        };
      });
    });

    // Handle peer leaving
    socket.on('squad:peer_left', ({ socketId }) => {
      removePeerConnection(socketId);
      setPeers(prev => {
        const updated = { ...prev };
        delete updated[socketId];
        return updated;
      });
    });

    return () => {
      cleanupLounge();
    };
  }, [squadId]);

  // Request user's mic stream
  const startLocalAudioStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      // Connect to Web Audio API for local waveform monitoring
      if (audioContextRef.current) {
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }
        const source = audioContextRef.current.createMediaStreamSource(stream);
        const analyser = audioContextRef.current.createAnalyser();
        analyser.fftSize = 64;
        source.connect(analyser);
        localAnalyserRef.current = analyser;
        startAudioWaveformAnalysis();
      }
      return stream;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      throw err;
    }
  };

  // WebRTC Peer Connection Factory
  const createPeerConnection = (targetSocketId, isCaller) => {
    if (peerConnections.current[targetSocketId]) {
      return peerConnections.current[targetSocketId];
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnections.current[targetSocketId] = pc;

    // Add local tracks to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current);
      });
    }

    // ICE Candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        socketRef.current.emit('squad:webrtc_ice_candidate', {
          targetSocketId,
          candidate: event.candidate
        });
      }
    };

    // Remote Track Handling
    pc.ontrack = (event) => {
      const remoteStream = event.streams[0];
      setupRemoteAudioTrack(targetSocketId, remoteStream);
    };

    // Negotiation needed for caller
    if (isCaller) {
      pc.onnegotiationneeded = async () => {
        try {
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          if (socketRef.current) {
            socketRef.current.emit('squad:webrtc_offer', {
              targetSocketId,
              offer
            });
          }
        } catch (err) {
          console.error('Error during negotiation offer creation:', err);
        }
      };
    }

    return pc;
  };

  // Setup Remote Audio Element & Analyser for peer
  const setupRemoteAudioTrack = (targetSocketId, stream) => {
    if (!audioElements.current[targetSocketId]) {
      const audioEl = new Audio();
      audioEl.srcObject = stream;
      audioEl.autoplay = true;
      audioElements.current[targetSocketId] = audioEl;

      // Connect to Audio Context for level monitoring & individual volume control
      if (audioContextRef.current) {
        try {
          const source = audioContextRef.current.createMediaStreamSource(stream);
          const analyser = audioContextRef.current.createAnalyser();
          analyser.fftSize = 64;
          source.connect(analyser);
          analysersRef.current[targetSocketId] = analyser;
        } catch (e) {
          console.warn('Could not bind remote audio context stream:', e);
        }
      }
    } else {
      audioElements.current[targetSocketId].srcObject = stream;
    }
  };

  // Remove peer connection and cleanup audio
  const removePeerConnection = (targetSocketId) => {
    if (peerConnections.current[targetSocketId]) {
      peerConnections.current[targetSocketId].close();
      delete peerConnections.current[targetSocketId];
    }
    if (audioElements.current[targetSocketId]) {
      audioElements.current[targetSocketId].srcObject = null;
      delete audioElements.current[targetSocketId];
    }
    if (analysersRef.current[targetSocketId]) {
      delete analysersRef.current[targetSocketId];
    }
  };

  // Audio Waveform Real-Time Analysis Loop
  const startAudioWaveformAnalysis = () => {
    const dataArray = new Uint8Array(32);

    const updateWaveforms = () => {
      // Local Waveform Analysis
      if (localAnalyserRef.current) {
        localAnalyserRef.current.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
        const average = sum / dataArray.length;
        const volumePct = Math.min(100, Math.round((average / 255) * 200));
        setLocalVolumeLevel(volumePct);

        const isSpeaking = volumePct > 15 && !isMuted;
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('squad:peer_state_update', {
            squadId,
            isMuted,
            isDeafened,
            isScreenSharing,
            isSpeaking
          });
        }
      }

      // Remote Peers Waveform Analysis
      const updatedSpeaking = {};
      Object.keys(analysersRef.current).forEach(socketId => {
        const analyser = analysersRef.current[socketId];
        if (analyser) {
          analyser.getByteFrequencyData(dataArray);
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
          const average = sum / dataArray.length;
          updatedSpeaking[socketId] = Math.min(100, Math.round((average / 255) * 200));
        }
      });
      setSpeakingPeers(updatedSpeaking);

      animationFrameRef.current = requestAnimationFrame(updateWaveforms);
    };

    updateWaveforms();
  };

  // Cleanup on unmount or manual leave
  const cleanupLounge = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    Object.keys(peerConnections.current).forEach(removePeerConnection);
    if (socketRef.current) {
      socketRef.current.emit('squad:leave_audio_lounge', { squadId });
      socketRef.current.disconnect();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
  };

  // Controls Handlers
  const toggleMute = () => {
    const newMuteState = !isMuted;
    setIsMuted(newMuteState);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !newMuteState;
      });
    }
    socketRef.current?.emit('squad:peer_state_update', {
      squadId,
      isMuted: newMuteState,
      isDeafened,
      isScreenSharing,
      isSpeaking: false
    });
  };

  const toggleDeafen = () => {
    const newDeafenState = !isDeafened;
    setIsDeafened(newDeafenState);
    Object.values(audioElements.current).forEach(audio => {
      audio.muted = newDeafenState;
    });
    socketRef.current?.emit('squad:peer_state_update', {
      squadId,
      isMuted,
      isDeafened: newDeafenState,
      isScreenSharing,
      isSpeaking
    });
  };

  const handleVolumeSlider = (peerSocketId, val) => {
    setVolumes(prev => ({ ...prev, [peerSocketId]: val }));
    if (audioElements.current[peerSocketId]) {
      audioElements.current[peerSocketId].volume = val / 100;
    }
  };

  // Push-To-Talk Keyboard Listener
  useEffect(() => {
    if (!isPttMode) return;

    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !isPttActive && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        setIsPttActive(true);
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = true));
        }
      }
    };

    const handleKeyUp = (e) => {
      if (e.code === 'Space' && isPttActive) {
        e.preventDefault();
        setIsPttActive(false);
        if (localStreamRef.current) {
          localStreamRef.current.getAudioTracks().forEach(t => (t.enabled = false));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isPttMode, isPttActive]);

  // Screen Sharing Handler
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach(t => t.stop());
        screenStreamRef.current = null;
      }
      setIsScreenSharing(false);
      socketRef.current?.emit('squad:peer_state_update', {
        squadId,
        isMuted,
        isDeafened,
        isScreenSharing: false,
        isSpeaking: false
      });
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: true });
        screenStreamRef.current = stream;
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = stream;
        }

        // Broadcast screen share video track to mesh peers
        const videoTrack = stream.getVideoTracks()[0];
        Object.values(peerConnections.current).forEach(pc => {
          pc.addTrack(videoTrack, stream);
        });

        videoTrack.onended = () => {
          setIsScreenSharing(false);
          socketRef.current?.emit('squad:peer_state_update', {
            squadId,
            isMuted,
            isDeafened,
            isScreenSharing: false,
            isSpeaking: false
          });
        };

        setIsScreenSharing(true);
        socketRef.current?.emit('squad:peer_state_update', {
          squadId,
          isMuted,
          isDeafened,
          isScreenSharing: true,
          isSpeaking: false
        });
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  };

  const activePeerList = Object.values(peers);

  // Render PiP Minimalist Widget (Floating Bottom-Right Mode)
  if (isPipMode) {
    return (
      <div className="fixed bottom-6 right-6 z-50 bg-slate-900/95 backdrop-blur-md border border-indigo-500/40 text-slate-100 rounded-2xl shadow-2xl p-4 w-80 transition-all duration-300">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="font-bold text-sm text-slate-200 truncate">{squadName} Lounge</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsPipMode(false)}
              className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition"
              title="Expand Lounge"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-red-500/20 rounded-lg text-red-400 transition"
              title="Leave Lounge"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PiP Active Speaker / Participant Indicator */}
        <div className="flex items-center justify-between mb-3 bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              localVolumeLevel > 15 ? 'ring-2 ring-emerald-400 bg-emerald-600' : 'bg-indigo-600'
            }`}>
              {currentUser?.name ? currentUser.name[0].toUpperCase() : 'ME'}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-200">You (Host)</p>
              <p className="text-[10px] text-slate-400">
                {isMuted ? 'Muted' : localVolumeLevel > 15 ? 'Speaking...' : 'Listening'}
              </p>
            </div>
          </div>

          {/* Mini Waveform Display */}
          <div className="flex items-end gap-0.5 h-4">
            {[0.4, 0.8, 0.5, 0.9, 0.3].map((h, i) => (
              <div
                key={i}
                className="w-1 bg-emerald-400 rounded-full transition-all duration-75"
                style={{
                  height: localVolumeLevel > 15 ? `${Math.max(20, localVolumeLevel * h)}%` : '20%',
                  opacity: localVolumeLevel > 15 ? 1 : 0.3
                }}
              />
            ))}
          </div>
        </div>

        {/* Quick Controls in PiP */}
        <div className="flex items-center justify-around bg-slate-950/60 p-2 rounded-xl border border-slate-800">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-lg transition ${
              isMuted ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleDeafen}
            className={`p-2 rounded-lg transition ${
              isDeafened ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title={isDeafened ? 'Undeafen' : 'Deafen'}
          >
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-2 rounded-lg transition ${
              isScreenSharing ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
            title="Screen Share"
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
          </button>

          <div className="flex items-center gap-1 text-slate-400 text-xs px-2 py-1 bg-slate-900 rounded-md">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>{activePeerList.length + 1}/8</span>
          </div>
        </div>
      </div>
    );
  }

  // Full Expanded Lounge Mode
  return (
    <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 text-slate-100 shadow-2xl">
      {/* Top Bar Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 mb-6 border-b border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl">
            <Radio className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold bg-gradient-to-r from-indigo-300 to-purple-300 bg-clip-text text-transparent">
                {squadName} Live Audio Lounge
              </h2>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Mesh WebRTC Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Low latency voice peer mesh ({activePeerList.length + 1} / 8 active participants)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Focus Mode PiP Toggle Button */}
          <button
            onClick={() => setIsPipMode(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-sm font-medium transition"
          >
            <Minimize2 className="w-4 h-4 text-indigo-400" />
            <span>Focus Mode PiP</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/10 text-red-400 hover:text-red-300 border border-transparent hover:border-red-500/30 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Error Alert if room capacity reached or mic permission denied */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-sm">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Screen Share Viewport (if sharing screen) */}
      {isScreenSharing && (
        <div className="mb-6 bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden relative group">
          <video
            ref={screenVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-80 object-contain bg-black"
          />
          <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs text-purple-300 font-medium">
            <Monitor className="w-4 h-4 text-purple-400" />
            <span>You are sharing your screen</span>
          </div>
        </div>
      )}

      {/* Grid of Voice Participants (Mesh Peer Tiles) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {/* Host / Self Tile */}
        <div className={`p-4 rounded-2xl border transition-all duration-300 relative ${
          localVolumeLevel > 15 && !isMuted
            ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
            : 'bg-slate-800/50 border-slate-700/60'
        }`}>
          <div className="flex flex-col items-center text-center">
            <div className="relative mb-3">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white transition-all duration-200 ${
                localVolumeLevel > 15 && !isMuted
                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 ring-4 ring-emerald-500/40 scale-105'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600'
              }`}>
                {currentUser?.name ? currentUser.name[0].toUpperCase() : 'ME'}
              </div>
              {isMuted && (
                <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-1 rounded-full border-2 border-slate-900">
                  <MicOff className="w-3.5 h-3.5" />
                </div>
              )}
            </div>

            <p className="font-semibold text-sm text-slate-200 truncate w-full">
              {currentUser?.name || 'You (Host)'}
            </p>

            {/* Live Audio Waveform Indicator */}
            <div className="flex items-end justify-center gap-1 h-5 mt-2">
              {[0.3, 0.7, 1.0, 0.6, 0.4].map((scale, idx) => (
                <div
                  key={idx}
                  className={`w-1 rounded-full transition-all duration-75 ${
                    isMuted ? 'bg-slate-600 h-1.5' : 'bg-emerald-400'
                  }`}
                  style={{
                    height: !isMuted && localVolumeLevel > 10 ? `${Math.max(15, localVolumeLevel * scale)}%` : '15%'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Remote Peers Tiles */}
        {activePeerList.map(peer => {
          const peerVolume = speakingPeers[peer.socketId] || 0;
          const isPeerSpeaking = peerVolume > 15 && !peer.isMuted;
          const sliderVol = volumes[peer.socketId] ?? 100;

          return (
            <div
              key={peer.socketId}
              className={`p-4 rounded-2xl border transition-all duration-300 relative ${
                isPeerSpeaking
                  ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/10'
                  : 'bg-slate-800/50 border-slate-700/60'
              }`}
            >
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-3">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold text-white transition-all duration-200 ${
                    isPeerSpeaking
                      ? 'bg-gradient-to-tr from-emerald-500 to-teal-400 ring-4 ring-emerald-500/40 scale-105'
                      : 'bg-gradient-to-tr from-purple-600 to-blue-600'
                  }`}>
                    {peer.name ? peer.name[0].toUpperCase() : 'S'}
                  </div>
                  {peer.isMuted && (
                    <div className="absolute -bottom-1 -right-1 bg-red-500 text-white p-1 rounded-full border-2 border-slate-900">
                      <MicOff className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                <p className="font-semibold text-sm text-slate-200 truncate w-full">
                  {peer.name}
                </p>

                {/* Peer Waveform */}
                <div className="flex items-end justify-center gap-1 h-5 mt-2">
                  {[0.4, 0.8, 1.0, 0.5, 0.3].map((scale, idx) => (
                    <div
                      key={idx}
                      className={`w-1 rounded-full transition-all duration-75 ${
                        peer.isMuted ? 'bg-slate-600 h-1.5' : 'bg-emerald-400'
                      }`}
                      style={{
                        height: !peer.isMuted && isPeerSpeaking ? `${Math.max(15, peerVolume * scale)}%` : '15%'
                      }}
                    />
                  ))}
                </div>

                {/* Individual Volume Slider */}
                <div className="w-full mt-3 flex items-center gap-2 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800">
                  <Volume2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={sliderVol}
                    onChange={(e) => handleVolumeSlider(peer.socketId, Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 w-6 text-right">{sliderVol}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Audio Lounge Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-3">
          {/* Mic Mute Toggle */}
          <button
            onClick={toggleMute}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30'
            }`}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span>{isMuted ? 'Unmute Mic' : 'Mute Mic'}</span>
          </button>

          {/* Deafen Toggle */}
          <button
            onClick={toggleDeafen}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
              isDeafened
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isDeafened ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            <span>{isDeafened ? 'Undeafen' : 'Deafen'}</span>
          </button>

          {/* Screen Share Toggle */}
          <button
            onClick={toggleScreenShare}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition ${
              isScreenSharing
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/40 hover:bg-purple-500/30'
                : 'bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700'
            }`}
          >
            {isScreenSharing ? <MonitorOff className="w-4 h-4" /> : <Monitor className="w-4 h-4" />}
            <span>{isScreenSharing ? 'Stop Screen' : 'Share Screen'}</span>
          </button>
        </div>

        {/* Push to talk & study widgets shortcuts */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPttMode(!isPttMode)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
              isPttMode
                ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>PTT Mode (Hold Space)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
