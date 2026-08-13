import React, { useState, useEffect, useRef } from 'react';
import { FaMicrophone, FaPaperPlane, FaVolumeUp } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import ExaminerAvatar from './ExaminerAvatar';

export default function VivaSimulatorCanvas({
  turns = [],
  nextQuestion = '',
  onRespond,
  loading = false,
}) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [typewriterText, setTypewriterText] = useState('');
  const [speechStatus, setSpeechStatus] = useState('idle'); // 'idle', 'speaking', 'listening'
  const chatEndRef = useRef(null);

  // Typewriter effect for current AI examiner question
  useEffect(() => {
    if (!nextQuestion) return;
    setSpeechStatus('speaking');
    setTypewriterText('');
    let idx = 0;
    const interval = setInterval(() => {
      setTypewriterText((prev) => prev + nextQuestion.charAt(idx));
      idx++;
      if (idx >= nextQuestion.length) {
        clearInterval(interval);
        setSpeechStatus('idle');
        
        // Read out loud the examiner's question using SpeechSynthesis
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(nextQuestion);
          utterance.rate = 1.0;
          utterance.onstart = () => setSpeechStatus('speaking');
          utterance.onend = () => setSpeechStatus('idle');
          window.speechSynthesis.speak(utterance);
        }
      }
    }, 15);

    return () => {
      clearInterval(interval);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [nextQuestion]);

  // Scroll to bottom on updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [turns, typewriterText]);

  // Speech-to-text input (Web Speech API)
  const handleStartSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech Recognition is not supported by your current browser. Please try typing your answer.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      setSpeechStatus('idle');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsRecording(true);
      setSpeechStatus('listening');
    };

    recognition.onresult = (event) => {
      const speechToText = event.results[0][0].transcript;
      setInputText((prev) => (prev ? prev + ' ' + speechToText : speechToText));
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsRecording(false);
      setSpeechStatus('idle');
    };

    recognition.onend = () => {
      setIsRecording(false);
      setSpeechStatus('idle');
    };

    recognition.start();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onRespond(inputText);
    setInputText('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
      
      {/* Left panel: Examiner Avatar & Visual Cues */}
      <div className="md:col-span-1 flex flex-col items-center justify-center space-y-4">
        <ExaminerAvatar status={speechStatus} />
        <div className="text-center space-y-1">
          <span className="text-[10px] font-bold text-stone-500 uppercase tracking-widest block">Oral Simulator Tip</span>
          <p className="text-stone-400 text-xs px-4">Speak clearly into your microphone, or fallback to typing your responses if in a noisy room.</p>
        </div>
      </div>

      {/* Right panel: Conversational transcript & inputs */}
      <div className="md:col-span-2 flex flex-col h-[500px] bg-stone-950/20 rounded-2xl border border-neutral-850 p-4 relative overflow-hidden">
        
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto space-y-4 pr-2 pb-4 scrollbar-thin">
          {turns.slice(0, -1).map((turn, index) => (
            <div
              key={index}
              className={`flex flex-col space-y-1 ${
                turn.speaker === 'AI' ? 'items-start' : 'items-end'
              }`}
            >
              <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest px-2">
                {turn.speaker === 'AI' ? 'Examiner' : 'Student'}
              </span>
              <div
                className={`max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  turn.speaker === 'AI'
                    ? 'bg-neutral-800/80 border border-neutral-750 text-stone-200 rounded-tl-none'
                    : 'bg-indigo-600 text-white rounded-tr-none'
                }`}
              >
                {turn.text}
              </div>
            </div>
          ))}

          {/* Current Typewriter Question */}
          {typewriterText && (
            <div className="flex flex-col space-y-1 items-start">
              <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest px-2">
                Examiner
              </span>
              <div className="max-w-md px-4 py-2.5 rounded-2xl text-xs leading-relaxed bg-neutral-850/80 border border-neutral-750 text-indigo-200 rounded-tl-none flex items-start gap-2">
                <span>{typewriterText}</span>
                {speechStatus === 'speaking' && <span className="inline-block w-1.5 h-3 bg-indigo-400 animate-pulse shrink-0" />}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input area */}
        <form onSubmit={handleSubmit} className="border-t border-neutral-850 pt-4 flex gap-2.5 items-center">
          <button
            type="button"
            onClick={handleStartSpeech}
            disabled={loading}
            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-center ${
              isRecording
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse'
                : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-750 text-stone-400 hover:text-stone-200'
            }`}
            title="Start verbal speech input"
            aria-label="Start verbal speech input"
          >
            <FaMicrophone />
          </button>
          
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={loading}
            placeholder={
              isRecording ? 'Listening to speech...' : 'Type your answer here...'
            }
            className="flex-1 bg-stone-950/60 border border-neutral-850 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-stone-200 outline-none transition"
            aria-label="Student response text"
          />

          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center gap-1.5 shrink-0"
          >
            {loading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <>
                <FaPaperPlane />
                <span>Submit</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
