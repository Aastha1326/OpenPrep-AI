/**
 * @fileoverview Main page for the Oral Viva Simulator.
 * Manages conversation state, integrates the recorder, and displays AI feedback.
 */
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import API from '../services/api';
import VivaRecorder from '../components/Viva/VivaRecorder';
import VivaScorecardModal from '../components/viva/VivaScorecardModal';
import { FaGraduationCap, FaExclamationCircle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';

export default function VivaSimulator() {
  const location = useLocation();

  // Initialize state from location state or defaults
  const [topic, setTopic] = useState(location.state?.topic || '');
  const [sessionId, setSessionId] = useState(location.state?.sessionId || null);
  const [currentQuestion, setCurrentQuestion] = useState(location.state?.currentQuestion || '');
  const [conversationHistory, setConversationHistory] = useState(location.state?.conversationHistory || []);
  const [scorecard, setScorecard] = useState(null);
  const [isScorecardOpen, setIsScorecardOpen] = useState(false);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showTopicInput, setShowTopicInput] = useState(!location.state?.topic);

  const handleStartSession = async (e) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsProcessing(true);
    setError('');
    setScorecard(null);

    try {
      const response = await API.post('/viva/start', { topic: topic.trim() });
      if (response.data.success) {
        setSessionId(response.data.data.sessionId);
        setCurrentQuestion(response.data.data.currentQuestion);
        setConversationHistory(response.data.data.conversationHistory || []);
        setShowTopicInput(false);
      } else {
        setError(response.data.message || 'Failed to start session.');
      }
    } catch (err) {
      console.error('Start session error:', err);
      setError(err?.response?.data?.message || 'Network error. Please check your connection and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRecordingComplete = async (audioBlob) => {
    // In production, upload audioBlob to a transcription service (e.g., Whisper) first.
    // For this implementation, we simulate the STT output to satisfy the API contract.
    const mockTranscribedText = "This is a simulated transcribed answer from the audio blob. In production, this would be the actual STT output.";

    setIsProcessing(true);
    setError('');

    try {
      const response = await API.post('/viva/evaluate', {
        sessionId,
        topic,
        currentQuestion,
        userAnswer: mockTranscribedText,
        conversationHistory,
      });

      if (response.data.success) {
        setConversationHistory(response.data.data.conversationHistory);
        setCurrentQuestion(response.data.data.nextQuestion);
      } else {
        setError(response.data.message || 'Failed to evaluate answer.');
      }
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err?.response?.data?.message || 'Failed to evaluate. The AI service might be busy.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestart = () => {
    setTopic('');
    setSessionId(null);
    setCurrentQuestion('');
    setConversationHistory([]);
    setScorecard(null);
    setIsScorecardOpen(false);
    setShowTopicInput(true);
    setError('');
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-inter py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-black font-playfair tracking-tight text-white flex items-center gap-2">
              <FaGraduationCap className="text-indigo-400" /> AI Oral Viva Simulator
            </h1>
            <p className="text-stone-400 text-xs mt-1">
              Practice your spoken answers and get instant, constructive feedback.
            </p>
          </div>
          {sessionId && !showTopicInput && (
            <button
              onClick={handleRestart}
              className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-stone-300 border border-neutral-750 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              End & Restart
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400 font-semibold">
            <FaExclamationCircle className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Topic Input Phase */}
        {showTopicInput ? (
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl max-w-xl mx-auto space-y-6">
            <form onSubmit={handleStartSession} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-stone-100 font-extrabold font-playfair text-xl">Configure Your Session</h2>
                <p className="text-stone-400 text-xs leading-relaxed">
                  Enter a specific topic to generate targeted oral examination questions.
                </p>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="topic" className="text-[10px] font-black text-stone-500 uppercase tracking-widest block">
                  Practice Topic
                </label>
                <input
                  type="text"
                  id="topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Data Structures, World War II, React Hooks"
                  className="w-full bg-stone-950 border border-neutral-850 focus:border-indigo-500 rounded-xl px-4 py-3 text-sm text-stone-300 outline-none transition"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing || !topic.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:opacity-50 text-white rounded-2xl text-xs font-bold transition shadow-lg hover:shadow-indigo-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Question...</span>
                  </>
                ) : (
                  <span>Start Viva Session</span>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* Active Viva Phase */
          <div className="space-y-6">

            {/* Current Question Card */}
            <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-3xl p-6 sm:p-8">
              <h2 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">
                Current Question
              </h2>
              <p className="text-xl sm:text-2xl font-medium text-white leading-relaxed font-playfair">
                {currentQuestion}
              </p>
            </div>

            {/* Recorder Component */}
            <VivaRecorder
              onRecordingComplete={handleRecordingComplete}
              isProcessing={isProcessing}
            />

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
              <div className="space-y-4 pt-4">
                <h3 className="text-sm font-bold text-stone-400 uppercase tracking-widest border-b border-neutral-800 pb-2">
                  Session History
                </h3>
                {conversationHistory.map((turn, index) => (
                  <div key={index} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 space-y-4">
                    <div>
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Q{index + 1}</span>
                      <p className="text-stone-200 mt-1 text-sm">{turn.question}</p>
                    </div>

                    <div className="pl-4 border-l-2 border-neutral-800">
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Your Answer</span>
                      <p className="text-stone-400 mt-1 text-sm italic">"{turn.answer}"</p>
                    </div>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">AI Feedback</span>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-full border border-emerald-500/30">
                          Score: {turn.score}/10
                        </span>
                      </div>
                      <p className="text-xs text-emerald-100/80 leading-relaxed">{turn.feedback}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evaluation Scorecard Modal (Retained for future end-session evaluation) */}
        <VivaScorecardModal
          isOpen={isScorecardOpen}
          onClose={() => setIsScorecardOpen(false)}
          scorecard={scorecard}
          onRestart={handleRestart}
        />
      </div>
    </div>
  );
}
