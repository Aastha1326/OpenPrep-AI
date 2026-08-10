import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square, Send, Volume2, VolumeX, AlertCircle, ArrowLeft, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import LeatherBoard from '../components/dashboard/LeatherBoard';

const AiAssistant = () => {
  const navigate = useNavigate();

  // Chat states
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello! I am your AI Study Mentor. You can ask me any academic question or concept query. Press the microphone button to speak your question!',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Voice recording & visualizer states
  const [recording, setRecording] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);

  // Speech Recognition & Audio refs
  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const canvasRef = useRef(null);
  const chatEndRef = useRef(null);

  // Speech Synthesis ref (TTS)
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInputText(transcript);
          // Auto-submit the query
          handleSendMessage(transcript);
        }
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone permission denied. Please allow mic access in your browser.');
        } else {
          setError(`Voice input failed: ${event.error}`);
        }
        stopVoiceRecording();
      };

      rec.onend = () => {
        setRecording(false);
        stopVoiceRecording();
      };

      recognitionRef.current = rec;
    }
  }, []);

  // Clean up Audio resources on unmount
  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      stopVoiceRecording();
    };
  }, []);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Start voice recording & recognition
  const startVoiceRecording = async () => {
    setError(null);
    if (synthRef.current) {
      synthRef.current.cancel();
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Set up real-time audio analysis for wave visualization
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioContextClass();
      const analyser = audioCtx.createAnalyser();
      const source = audioCtx.createMediaStreamSource(stream);

      source.connect(analyser);
      analyser.fftSize = 64;

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;

      setRecording(true);

      // Start browser Speech Recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      // Draw dynamic visualizer waves
      drawLiveWave();
    } catch (err) {
      console.error('Microphone permission denied:', err);
      setError('Microphone access denied. Please check site permissions.');
      setRecording(false);
    }
  };

  // Stop voice recording & recognition
  const stopVoiceRecording = () => {
    if (recognitionRef.current && recording) {
      recognitionRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setRecording(false);
  };

  // Draw Dynamic Visualizer Waveform on Canvas
  const drawLiveWave = () => {
    if (!canvasRef.current || !analyserRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!analyserRef.current) return;
      animationFrameRef.current = requestAnimationFrame(draw);

      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'transparent';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const barWidth = canvas.width / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        // scale height based on frequency value
        const val = dataArray[i] / 255;
        const height = val * canvas.height * 0.8;
        const y = (canvas.height - height) / 2;

        const grad = ctx.createLinearGradient(0, y, 0, y + height);
        grad.addColorStop(0, '#f59e0b'); // amber-500
        grad.addColorStop(0.5, '#d97706'); // amber-600
        grad.addColorStop(1, '#b45309'); // amber-700

        ctx.fillStyle = grad;
        ctx.fillRect(x, y, barWidth - 4, height);

        x += barWidth;
      }
    };

    draw();
  };

  // Send message to backend Gemini query pipeline
  const handleSendMessage = async (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    setInputText('');
    setError(null);
    setLoading(true);

    const userMsg = { id: `msg-${Date.now()}`, role: 'user', text };
    setMessages((prev) => [...prev, userMsg]);

    try {
      // Map history for Gemini endpoint context
      const chatHistory = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({
          role: m.role,
          parts: m.text,
        }));

      const res = await API.post('/ai/chat', {
        message: text,
        history: chatHistory,
      });

      if (res.data && res.data.success) {
        const aiText = res.data.text;
        const aiMsg = { id: `msg-${Date.now() + 1}`, role: 'assistant', text: aiText };
        setMessages((prev) => [...prev, aiMsg]);

        // Speak response if Text-to-Speech is enabled
        if (ttsEnabled && synthRef.current) {
          synthRef.current.cancel();
          // Strip Markdown for cleaner speech synthesis
          const plainText = aiText.replace(/[*#_`~]/g, '');
          const utterance = new SpeechSynthesisUtterance(plainText);
          synthRef.current.speak(utterance);
        }
      } else {
        throw new Error('Failed to resolve query.');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to connect to AI study pipeline.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LeatherBoard>
      <div className="max-w-4xl mx-auto px-4 py-8 h-screen flex flex-col justify-between">
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between border-b border-yellow-700/20 pb-4 shrink-0">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-yellow-600 dark:text-amber-500 hover:text-amber-400 font-playfair font-bold text-sm tracking-wide transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-playfair font-bold text-stone-800 dark:text-stone-100 flex items-center gap-2">
              <Bot className="w-6 h-6 text-amber-500" /> AI Study Mentor
            </h1>
          </div>
          
          {/* TTS Read Aloud Toggle */}
          <button
            onClick={() => {
              setTtsEnabled(!ttsEnabled);
              if (ttsEnabled && synthRef.current) {
                synthRef.current.cancel();
              }
            }}
            className={`p-2.5 rounded-full border transition-all ${
              ttsEnabled
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-neutral-800/40 border-neutral-700 text-neutral-400 hover:bg-neutral-800'
            }`}
            title={ttsEnabled ? 'Mute AI read-aloud' : 'Enable AI read-aloud'}
          >
            {ttsEnabled ? <Volume2 className="w-4 h-4 animate-bounce" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>

        {/* --- ERROR BANNER --- */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 bg-red-950/40 border border-red-500/30 text-red-300 p-3 rounded-lg flex items-start gap-2 text-sm shrink-0"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- CHAT AREA --- */}
        <div className="flex-1 overflow-y-auto my-6 pr-2 space-y-4 min-h-0 custom-scrollbar">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role !== 'user' && (
                <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-amber-400" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-amber-600 to-amber-500 text-stone-950 font-medium'
                    : 'bg-stone-900/60 border border-stone-800 text-stone-200'
                }`}
              >
                <div className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed">
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-amber-500 border border-amber-600 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-stone-950" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-amber-400" />
              </div>
              <div className="bg-stone-900/60 border border-stone-800 text-stone-400 rounded-2xl px-4 py-3 flex items-center gap-2">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* --- VOICE & INPUT AREA --- */}
        <div className="shrink-0 space-y-4">
          
          {/* Wave visualizer */}
          <AnimatePresence>
            {recording && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 64 }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col items-center justify-center bg-stone-900/40 border border-amber-500/20 rounded-xl px-4 py-2 relative overflow-hidden"
              >
                <span className="text-xs text-amber-400 font-mono animate-pulse mb-1">LISTENING...</span>
                <canvas ref={canvasRef} className="w-full h-8 max-w-md" width={400} height={32} />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-3">
            
            {/* Microphone Toggle Button */}
            <button
              onClick={recording ? stopVoiceRecording : startVoiceRecording}
              className={`p-4 rounded-full shadow-lg border transition-all shrink-0 ${
                recording
                  ? 'bg-red-600 border-red-500 text-white animate-pulse shadow-[0_0_20px_rgba(220,38,38,0.5)]'
                  : 'bg-amber-500 border-amber-600 text-stone-950 hover:bg-amber-400'
              }`}
              title={recording ? 'Stop voice recording' : 'Ask query with your voice'}
            >
              {recording ? <Square className="w-5 h-5 fill-current" /> : <Mic className="w-5 h-5" />}
            </button>

            {/* Text Input Box */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex-1 flex gap-2"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Speak or type your concept question here..."
                disabled={loading || recording}
                className="flex-1 bg-stone-900/60 border border-stone-800 rounded-xl px-4 py-3.5 text-stone-200 placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              />
              <button
                type="submit"
                disabled={loading || !inputText.trim() || recording}
                className="bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold p-3.5 rounded-xl transition-all disabled:opacity-40 disabled:hover:bg-amber-500 shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

      </div>
    </LeatherBoard>
  );
};

export default AiAssistant;
