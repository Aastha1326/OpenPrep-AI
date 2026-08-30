import React, { useState } from 'react';
import { Sparkles, X, Loader2, CheckCircle2, Copy, BookOpen, HelpCircle } from 'lucide-react';
import API from '../../services/api';

const GenerateQuestionsModal = ({ isOpen, onClose, noteId, noteContent, noteTitle = 'Study Document' }) => {
  const [numQuestions, setNumQuestions] = useState(5);
  const [type, setType] = useState('multiple_choice');
  const [difficulty, setDifficulty] = useState('medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedQuestions, setGeneratedQuestions] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post('/ai/generate-questions', {
        noteId: noteId || null,
        content: noteContent || 'Study content summary',
        title: noteTitle,
        numQuestions: Number(numQuestions),
        type,
        difficulty,
      });

      if (response.data?.success) {
        setGeneratedQuestions(response.data.data || []);
      } else {
        setError(response.data?.error || 'Failed to generate questions.');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate AI questions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyQuestion = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-500">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-playfair font-bold text-neutral-800 dark:text-neutral-100">
                AI Question Generator
              </h2>
              <p className="text-xs text-neutral-500 italic">
                Source: {noteTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Controls */}
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-100/50 dark:bg-neutral-800/30 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Questions Count
            </label>
            <select
              value={numQuestions}
              onChange={(e) => setNumQuestions(e.target.value)}
              className="w-full text-sm p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            >
              <option value={3}>3 Questions</option>
              <option value={5}>5 Questions</option>
              <option value={10}>10 Questions</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Question Format
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full text-sm p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            >
              <option value="multiple_choice">Multiple Choice</option>
              <option value="short_answer">Short Answer</option>
              <option value="true_false">True / False</option>
              <option value="essay">Essay</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full text-sm p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/50 rounded-lg text-red-700 dark:text-red-300 text-xs">
            {error}
          </div>
        )}

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center" data-testid="loading-spinner">
              <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-3" />
              <h3 className="text-base font-bold font-playfair text-neutral-800 dark:text-neutral-200">
                AI is analyzing your note content...
              </h3>
              <p className="text-xs text-neutral-500 mt-1">
                Generating structured Q&A questions and persisting to database.
              </p>
            </div>
          ) : generatedQuestions && generatedQuestions.length > 0 ? (
            <div className="space-y-4" data-testid="generated-questions-list">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Generated {generatedQuestions.length} Questions (Saved)
                </span>
              </div>

              {generatedQuestions.map((q, idx) => (
                <div
                  key={q.id || `gen-${idx}`}
                  className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-700/80 bg-white dark:bg-neutral-800 shadow-sm relative group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-playfair font-bold text-base text-neutral-900 dark:text-neutral-100">
                      {idx + 1}. {q.question}
                    </h4>
                    <button
                      onClick={() => handleCopyQuestion(`${q.question}\nAnswer: ${q.answer}`, q.id || idx)}
                      className="p-1.5 rounded-lg text-neutral-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-neutral-100 dark:hover:bg-neutral-700 transition"
                      title="Copy Question & Answer"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  {q.options && q.options.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 my-3">
                      {q.options.map((opt, oIdx) => (
                        <div
                          key={oIdx}
                          className="px-3 py-2 text-xs rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300"
                        >
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-700/50 bg-amber-50/50 dark:bg-amber-950/20 p-2.5 rounded-lg">
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block mb-0.5">
                      Answer & Explanation:
                    </span>
                    <p className="text-xs text-neutral-700 dark:text-neutral-300">
                      {q.answer}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-neutral-500 text-center">
              <HelpCircle className="w-10 h-10 opacity-40 mb-2" />
              <p className="text-sm font-semibold">Ready to generate AI Questions</p>
              <p className="text-xs text-neutral-400 max-w-sm mt-1">
                Select your preferred difficulty and format above, then click &quot;Generate Questions&quot;.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/50 flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 rounded-lg transition"
          >
            Close
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-md transition"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate Questions
          </button>
        </div>
      </div>
    </div>
  );
};

export default GenerateQuestionsModal;
