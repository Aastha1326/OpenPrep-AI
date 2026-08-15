import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mic, Square, Play, Pause, AlertCircle, Save, CheckCircle, FileText, Loader } from 'lucide-react';
import API from '../../services/api';
import AudioWaveformVisualizer from './AudioWaveformVisualizer';

const VoiceNoteRecorderModal = ({ isOpen, onClose, onNoteCreated }) => {
  const [step, setStep] = useState('record'); // 'record', 'processing', 'review'
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  
  const [recording, setRecording] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Review step state
  const [transcription, setTranscription] = useState('');
  const [title, setTitle] = useState('');
  const [keyTakeaways, setKeyTakeaways] = useState([]);
  const [formulas, setFormulas] = useState([]);
  const [examWarnings, setExamWarnings] = useState([]);
  const [actionItems, setActionItems] = useState([]);
  const [savedAudioUrl, setSavedAudioUrl] = useState('');

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const audioRef = useRef(null);
  
  const timerRef = useRef(null);
  const [recordingTime, setRecordingTime] = useState(0);

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
          setError('Failed to load subjects. Please create a subject first.');
        }
      };
      fetchSubjects();
      
      // Reset state
      setStep('record');
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingTime(0);
      setTranscription('');
      setTitle('');
    }
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (recording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= 1800) { // 30 minutes
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const startRecording = async () => {
    setError(null);
    setAudioUrl(null);
    setAudioBlob(null);
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);

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
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (err) {
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
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

  const processAudio = async () => {
    if (!audioBlob) return;
    setStep('processing');
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', audioBlob, 'voice_note.wav');
      formData.append('subjectId', selectedSubjectId);

      const res = await API.post('/notes/transcribe-and-summarize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        const data = res.data.data;
        setTranscription(data.transcription);
        setTitle(data.title);
        setKeyTakeaways(data.keyTakeaways || []);
        setFormulas(data.formulas || []);
        setExamWarnings(data.examWarnings || []);
        setActionItems(data.actionItems || []);
        setSavedAudioUrl(data.fileUrl);
        setStep('review');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to transcribe and summarize audio.');
      setStep('record');
    }
  };

  const handleSaveFinalNote = async () => {
    setLoading(true);
    setError(null);
    try {
      const summaryData = {
        title,
        summary: "Voice Note Summary", 
        keyConcepts: keyTakeaways,
        examTips: examWarnings
      };

      // Since we already uploaded the file temporarily, ideally we'd link it,
      // but to use the existing noteController we can upload it again or send text.
      // But we have the existing POST /notes which accepts file, title, content...
      // Or we can modify /notes to accept an existing fileUrl.
      // Actually, wait, let's just use POST /notes/voice directly but pass everything? 
      // But we separated it. We'll send it via POST /notes as a regular note and pass the text content.
      // Or better yet, we can send it to POST /notes but we need the audio file there too.
      // Let's just create a FormData again to POST /notes to save it for real.
      
      const formData = new FormData();
      formData.append('title', title);
      formData.append('subjectId', selectedSubjectId);
      formData.append('file', audioBlob, `${title.replace(/\s+/g, '_')}.wav`);
      
      // Pass the edited AI summary to the backend somehow...
      // The easiest way for now is to store the summary in the "content" field as JSON or let backend generate it again? 
      // No, we want to save the user's edits!
      // We'll append it as a custom field, or we might need to update backend to accept 'aiSummary' directly.
      formData.append('aiSummary', JSON.stringify({
         transcription,
         title,
         keyTakeaways,
         formulas,
         examWarnings,
         actionItems
      }));

      const res = await API.post('/notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (onNoteCreated) {
        onNoteCreated(res.data.data);
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save note.');
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
            className="bg-white dark:bg-neutral-900 w-full max-w-2xl rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.4)] flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-300 dark:border-neutral-800">
              <div>
                <h2 className="text-2xl font-playfair font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                  <Mic className="w-6 h-6 text-amber-700" /> Voice Note Summarization
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 font-serif">
                  {step === 'record' ? 'Record a lecture or study session (up to 30 mins).' : step === 'processing' ? 'AI is processing your audio...' : 'Review and edit your structured notes.'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors"
                disabled={loading || step === 'processing'}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-400 text-sm rounded flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {step === 'record' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1.5 font-serif">Subject</label>
                    <select
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 font-serif text-sm dark:text-neutral-200"
                      disabled={recording}
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

                  <div className="p-8 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded flex flex-col items-center justify-center space-y-6">
                    {recording ? (
                      <div className="flex flex-col items-center">
                        <AudioWaveformVisualizer recording={recording} analyser={analyserRef.current} />
                        <div className="text-xl font-mono mt-4 text-red-600 dark:text-red-400">{formatTime(recordingTime)}</div>
                        <span className="text-[10px] font-bold text-red-600 animate-pulse uppercase tracking-wider mt-1 flex items-center gap-1">
                          <Square className="w-2.5 h-2.5 fill-red-600" /> Recording Live
                        </span>
                      </div>
                    ) : audioUrl ? (
                      <div className="flex flex-col items-center space-y-3 w-full">
                        <AudioWaveformVisualizer isPlayback={true} />
                        <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} className="hidden" />
                        <button
                          type="button"
                          onClick={handlePlayPause}
                          className="p-3 bg-amber-100 dark:bg-amber-900/40 hover:bg-amber-200 dark:hover:bg-amber-800 text-amber-900 dark:text-amber-500 rounded-full transition-colors flex items-center justify-center"
                        >
                          {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
                        </button>
                        <div className="flex gap-3 mt-4">
                          <button onClick={startRecording} className="text-xs text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 underline">Rerecord</button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center py-6">
                        <Mic className="w-12 h-12 text-neutral-400 mb-4" />
                        <p className="text-sm text-neutral-500 italic text-center max-w-xs">Click start to record your voice note. Maximum duration is 30 minutes.</p>
                      </div>
                    )}

                    <div className="flex justify-center">
                      {!recording && !audioUrl && (
                        <button onClick={startRecording} className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-bold shadow flex items-center gap-2 transition-colors">
                          <Mic className="w-4 h-4" /> Start Recording
                        </button>
                      )}
                      {recording && (
                        <button onClick={stopRecording} className="px-6 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded text-sm font-bold shadow flex items-center gap-2 animate-pulse transition-colors">
                          <Square className="w-4 h-4 fill-white" /> Stop Recording
                        </button>
                      )}
                      {audioUrl && !recording && (
                        <button onClick={processAudio} className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-sm font-bold shadow flex items-center gap-2 transition-colors">
                          <CheckCircle className="w-4 h-4" /> Transcribe & Summarize
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {step === 'processing' && (
                <div className="flex flex-col items-center justify-center py-16 space-y-4">
                  <Loader className="w-12 h-12 text-amber-600 animate-spin" />
                  <p className="text-neutral-600 dark:text-neutral-300 font-serif text-lg">AI is processing your audio...</p>
                  <p className="text-neutral-400 text-xs">This may take a moment depending on the length of the recording.</p>
                </div>
              )}

              {step === 'review' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-sm dark:text-neutral-100 font-bold"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Transcription (Editable)</label>
                    <textarea 
                      value={transcription} 
                      onChange={(e) => setTranscription(e.target.value)} 
                      rows={5}
                      className="w-full px-3 py-2 bg-neutral-50 dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded text-sm font-serif dark:text-neutral-200"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Key Takeaways</label>
                      <textarea 
                        value={keyTakeaways.join('\n')} 
                        onChange={(e) => setKeyTakeaways(e.target.value.split('\n'))} 
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-sm dark:text-neutral-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Formulas & Definitions</label>
                      <textarea 
                        value={formulas.join('\n')} 
                        onChange={(e) => setFormulas(e.target.value.split('\n'))} 
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-sm dark:text-neutral-200 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Exam Warnings</label>
                      <textarea 
                        value={examWarnings.join('\n')} 
                        onChange={(e) => setExamWarnings(e.target.value.split('\n'))} 
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-sm dark:text-neutral-200"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Action Items</label>
                      <textarea 
                        value={actionItems.join('\n')} 
                        onChange={(e) => setActionItems(e.target.value.split('\n'))} 
                        rows={3}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-sm dark:text-neutral-200"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-neutral-300 dark:border-neutral-800 flex items-center justify-end bg-neutral-50 dark:bg-neutral-900 gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors text-sm"
                disabled={loading || step === 'processing'}
              >
                Cancel
              </button>
              {step === 'review' && (
                <button
                  onClick={handleSaveFinalNote}
                  disabled={loading}
                  className="px-6 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded shadow transition-colors flex items-center gap-2 text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  {loading ? 'Saving...' : 'Save Final Note'}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default VoiceNoteRecorderModal;
