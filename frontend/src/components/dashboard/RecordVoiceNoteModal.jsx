import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Square, Play, Pause, AlertCircle, Save } from 'lucide-react';
import API from '../../services/api';

const RecordVoiceNoteModal = ({ isOpen, onClose, onNoteCreated }) => {
  const [title, setTitle] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);
  const playbackCanvasRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  const audioRef = useRef(null);

  // Load subjects
  useEffect(() => {
    if (isOpen) {
      const fetchSubjects = async () => {
        try {
          const res = await API.get('/academic/subjects');
          if (res.data && res.data.success) {
            setSubjects(res.data.data);
            if (res.data.data.length > 0) {
              setSelectedSubjectId(res.data.data[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to load subjects:', err);
          setError('Failed to load subjects. Please create a subject first.');
        }
      };
      fetchSubjects();
    }
  }, [isOpen]);

  // Clean up recording/playing resources on modal close
  useEffect(() => {
    return () => {
      stopAnimation();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const stopAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  // Start recording voice note
  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

      // Set up Audio Context and Analyser for recording visualizer
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        
        // Stop audio tracks of microphone
        stream.getTracks().forEach((track) => track.stop());
        
        // Draw static waveform for playback preview
        setTimeout(() => {
          drawStaticWaveform();
        }, 100);
      };

      mediaRecorderRef.current.start();
      setRecording(true);
      drawLiveWaveform();
    } catch (err) {
      console.error('Microphone access denied:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  // Stop recording voice note
  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      stopAnimation();
    }
  };

  // Draw real-time live input visualizer
  const drawLiveWaveform = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!recording) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = (canvas.width / bufferLength) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i] / 2;

        const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
        grad.addColorStop(0, '#d97706'); // amber-600
        grad.addColorStop(1, '#f59e0b'); // amber-500

        ctx.fillStyle = grad;
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

        x += barWidth;
      }
    };

    draw();
  };

  // Draw static waveform representing volume levels for playback preview
  const drawStaticWaveform = () => {
    if (!playbackCanvasRef.current) return;
    const canvas = playbackCanvasRef.current;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw dummy gold waveform peaks
    const peaksCount = 40;
    const barWidth = canvas.width / peaksCount;
    
    ctx.fillStyle = '#b45309'; // amber-700
    for (let i = 0; i < peaksCount; i++) {
      const height = 10 + Math.random() * (canvas.height - 20);
      const y = (canvas.height - height) / 2;
      ctx.fillRect(i * barWidth + 2, y, barWidth - 4, height);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const handleSaveNote = async () => {
    if (!title.trim()) {
      setError('Please provide a title for the voice note.');
      return;
    }
    if (!selectedSubjectId) {
      setError('Please select a subject.');
      return;
    }
    if (!audioBlob) {
      setError('Please record your voice note first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subjectId', selectedSubjectId);
      formData.append('file', audioBlob, `${title.replace(/\s+/g, '_')}.wav`);

      const res = await API.post('/notes/voice', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });

      if (onNoteCreated) {
        onNoteCreated(res.data.data);
      }
      
      setTitle('');
      setAudioBlob(null);
      setAudioUrl(null);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to analyze and save voice note.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#fdfaf3] w-full max-w-lg rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-yellow-800/10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-300">
              <div>
                <h2 className="text-2xl font-playfair font-bold text-neutral-800 flex items-center gap-2">
                  <Mic className="w-6 h-6 text-amber-700 animate-pulse" /> Record Voice Note
                </h2>
                <p className="text-xs text-neutral-500 mt-1 font-serif">Record notes, view live waveforms, and transcribe content with AI.</p>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Title & Subject inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5 font-serif">Subject</label>
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => setSelectedSubjectId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 font-serif text-sm"
                    disabled={loading || recording}
                  >
                    {subjects.length === 0 ? (
                      <option value="">No subjects found</option>
                    ) : (
                      subjects.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))
                    )}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5 font-serif">Voice Note Title</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="E.g., Newton's Second Law Lecture Recap"
                    className="w-full px-3 py-2 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 font-serif text-sm"
                    disabled={loading || recording}
                  />
                </div>
              </div>

              {/* Audio recording controls & waveforms */}
              <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-sm flex flex-col items-center justify-center space-y-4">
                
                {/* Live visualization container */}
                {recording && (
                  <div className="w-full flex flex-col items-center">
                    <canvas ref={canvasRef} width="350" height="80" className="w-full max-w-xs h-20 rounded" />
                    <span className="text-[10px] font-bold text-red-600 animate-pulse uppercase tracking-wider mt-2 flex items-center gap-1">
                      <Square className="w-2.5 h-2.5 fill-red-600 text-red-600" /> Recording Live Audio...
                    </span>
                  </div>
                )}

                {/* Playback preview container */}
                {audioUrl && !recording && (
                  <div className="w-full flex flex-col items-center space-y-3">
                    <canvas ref={playbackCanvasRef} width="350" height="80" className="w-full max-w-xs h-20 rounded border border-neutral-200 bg-white" />
                    <audio ref={audioRef} src={audioUrl} onEnded={handleAudioEnded} className="hidden" />
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="p-3 bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 rounded-full transition-colors flex items-center justify-center"
                    >
                      {isPlaying ? <Pause className="w-5 h-5 fill-amber-900" /> : <Play className="w-5 h-5 fill-amber-900 ml-0.5" />}
                    </button>
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                      Recording Preview & Waveform
                    </span>
                  </div>
                )}

                {/* Default state */}
                {!recording && !audioUrl && (
                  <div className="flex flex-col items-center py-6">
                    <Mic className="w-12 h-12 text-neutral-400 mb-2" />
                    <p className="text-xs text-neutral-500 italic">Click start to record up to 15MB of audio recap.</p>
                  </div>
                )}

                {/* Record Button Actions */}
                <div className="flex gap-4">
                  {!recording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={loading}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow transition-colors flex items-center gap-1.5"
                    >
                      <Mic className="w-4 h-4" /> Start Recording
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-900 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow transition-colors flex items-center gap-1.5 animate-pulse"
                    >
                      <Square className="w-4 h-4 fill-white" /> Stop Recording
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-300 flex items-center justify-end bg-neutral-50 gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border border-neutral-300 text-neutral-700 rounded-sm hover:bg-neutral-100 font-medium transition-colors text-sm"
                disabled={loading || recording}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNote}
                disabled={loading || recording || !audioBlob}
                className="px-5 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-sm shadow-md hover:shadow-lg font-medium transition-all flex items-center gap-1.5 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {loading ? 'Analyzing & Summarizing...' : 'Save Voice Note'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default RecordVoiceNoteModal;
