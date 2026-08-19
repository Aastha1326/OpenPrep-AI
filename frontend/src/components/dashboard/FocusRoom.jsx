import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Headphones, Mic, MicOff, Video, VideoOff, Users, X, Music, Play, Pause } from 'lucide-react';
import { io } from 'socket.io-client';

/**
 * MVP Lofi Focus Room (Issue #1295)
 * WebRTC Simulation UI with Socket.io signaling structure.
 */
const FocusRoom = ({ onClose }) => {
  const [inRoom, setInRoom] = useState(false);
  const [peers, setPeers] = useState([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [timer, setTimer] = useState(25 * 60); // 25 min Pomodoro
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  
  const socketRef = useRef(null);
  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);

  useEffect(() => {
    // Setup Socket connection for signaling
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    socketRef.current.on('peer-joined', (peerId) => {
      setPeers(prev => [...prev, peerId]);
      // In production, we'd start WebRTC handshakes (createOffer) here
    });

    socketRef.current.on('peer-left', (peerId) => {
      setPeers(prev => prev.filter(p => p !== peerId));
    });
    
    // Global timer sync listener
    socketRef.current.on('timer-sync', (serverTimeRemaining) => {
      setTimer(serverTimeRemaining);
    });

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      socketRef.current.disconnect();
    };
  }, []);

  const handleJoin = async () => {
    try {
      // MVP: Request local media
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      socketRef.current.emit('join-focus-room', 'lofi-lobby');
      setInRoom(true);
      setIsMusicPlaying(true);
    } catch (err) {
      console.error("Camera access denied or failed.", err);
      // Let them join without camera for MVP demo
      setInRoom(true);
      setIsMusicPlaying(true);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => t.enabled = isMuted);
    }
    setIsMuted(!isMuted);
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => t.enabled = isVideoOff);
    }
    setIsVideoOff(!isVideoOff);
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl"
    >
      <div className="bg-stone-950 border border-stone-800 w-full max-w-7xl h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
        
        {/* Lofi Background Vibe */}
        <div className="absolute inset-0 opacity-20 bg-gradient-to-br from-indigo-900 via-purple-900 to-black pointer-events-none mix-blend-screen" />
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none" />
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex justify-between items-center relative z-10 bg-black/40">
          <div className="flex items-center gap-3">
            <Headphones className="w-6 h-6 text-indigo-400" />
            <h2 className="text-xl font-bold text-stone-200">Global Focus Room</h2>
            {inRoom && <span className="flex h-3 w-3 relative ml-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
            </span>}
          </div>
          <div className="flex items-center gap-6">
            
            {/* Global Timer */}
            {inRoom && (
              <div className="text-3xl font-mono font-bold text-white tracking-widest bg-white/10 px-4 py-1 rounded-lg">
                {formatTime(timer)}
              </div>
            )}

            <button onClick={onClose} className="text-stone-400 hover:text-white p-2">
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Workspace */}
        <div className="flex-1 relative z-10 flex">
          
          {!inRoom ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Headphones className="w-24 h-24 text-indigo-500/50 mb-6" />
              <h3 className="text-3xl font-bold text-white mb-2 font-playfair">Ready to focus?</h3>
              <p className="text-stone-400 mb-8 text-center max-w-md">Join the global Lofi room. Video and audio are optional. The Pomodoro timer is synchronized globally for all students.</p>
              <button 
                onClick={handleJoin}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition shadow-lg shadow-indigo-600/30"
              >
                <Users className="w-5 h-5" /> Join Room
              </button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Video Grid */}
              <div className="flex-1 p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto">
                {/* Local Video */}
                <div className="bg-black rounded-2xl border border-white/10 relative overflow-hidden aspect-video shadow-2xl group">
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    muted 
                    playsInline 
                    className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`} 
                  />
                  {isVideoOff && (
                    <div className="absolute inset-0 flex items-center justify-center bg-stone-900">
                      <div className="w-20 h-20 rounded-full bg-stone-800 flex items-center justify-center text-2xl font-bold text-stone-500">
                        YOU
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-white text-sm backdrop-blur flex items-center gap-2">
                    {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                    You
                  </div>
                </div>

                {/* Mock Remote Peers */}
                {peers.map(peerId => (
                  <div key={peerId} className="bg-stone-900 rounded-2xl border border-white/10 relative overflow-hidden aspect-video shadow-2xl">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-20 h-20 rounded-full bg-indigo-900/50 flex items-center justify-center text-indigo-300">
                        <Users className="w-8 h-8" />
                      </div>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-black/60 px-3 py-1 rounded-lg text-white text-sm backdrop-blur">
                      Student_{peerId.substring(0, 4)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom Control Bar */}
              <div className="h-24 bg-black/60 backdrop-blur-md border-t border-white/10 flex items-center justify-between px-8">
                
                {/* Music Player */}
                <div className="flex items-center gap-4 bg-white/5 pr-4 rounded-full border border-white/10">
                  <button 
                    onClick={() => setIsMusicPlaying(!isMusicPlaying)}
                    className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white hover:bg-indigo-500 transition"
                  >
                    {isMusicPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-1" />}
                  </button>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-white flex items-center gap-2">
                      <Music className="w-3 h-3 text-indigo-400" /> Chillhop Radio
                    </span>
                    <span className="text-xs text-stone-400">Beats to study/relax to</span>
                  </div>
                </div>

                {/* Media Controls */}
                <div className="flex items-center gap-4">
                  <button 
                    onClick={toggleMute}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition ${isMuted ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={toggleVideo}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition ${isVideoOff ? 'bg-red-500/20 text-red-500 border border-red-500/50' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                  </button>
                </div>

                <div className="w-48 text-right">
                  <span className="text-stone-400 text-sm">{peers.length + 1} online</span>
                </div>

              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default FocusRoom;
