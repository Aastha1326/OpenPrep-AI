import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Youtube, Loader2, Sparkles, AlertCircle, CheckCircle2, Play } from 'lucide-react';
import API from '../../services/api';

// Helper to extract video ID for embed preview
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function YouTubeFlashcardImporter({ isOpen, onClose, onImported }) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [videoId, setVideoId] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [count, setCount] = useState(10);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successCount, setSuccessCount] = useState(0);

  // Sync Video ID on url change
  useEffect(() => {
    const id = getYouTubeId(youtubeUrl);
    setVideoId(id);
  }, [youtubeUrl]);

  // Load subjects
  useEffect(() => {
    if (isOpen) {
      const fetchSubjects = async () => {
        try {
          const res = await API.get('/subjects');
          if (res.data?.success) {
            const list = res.data.data || [];
            setSubjects(list);
            if (list.length > 0) {
              setSelectedSubjectId(list[0].id);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchSubjects();
      setYoutubeUrl('');
      setError('');
      setSuccessCount(0);
    }
  }, [isOpen]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!youtubeUrl) return;
    if (!videoId) {
      setError('Please enter a valid YouTube video URL.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessCount(0);

    try {
      const res = await API.post('/flashcards/from-youtube', {
        youtubeUrl,
        subjectId: selectedSubjectId || null,
        count: parseInt(count, 10),
      });

      if (res.data?.success) {
        setSuccessCount(res.data.count || 0);
        if (onImported) onImported();
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to generate flashcards from video transcript.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-xl w-full space-y-6 shadow-2xl relative"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-stone-400 hover:text-white bg-neutral-800 border border-neutral-750 hover:border-neutral-700 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="space-y-1">
              <h3 className="text-lg font-black text-white flex items-center gap-2 font-playfair">
                <Youtube className="text-rose-500 w-6 h-6" /> YouTube Flashcard Generator
              </h3>
              <p className="text-stone-400 text-xs font-semibold">
                Generate revision flashcards directly from closed captions and video transcripts.
              </p>
            </div>

            {successCount > 0 ? (
              // Success Area
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <h4 className="text-base font-black text-white">Import Successful!</h4>
                <p className="text-xs text-stone-400 max-w-sm">
                  Generated and saved <strong>{successCount}</strong> flashcards with lecture timestamp markers into your deck.
                </p>
                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-neutral-800 hover:bg-neutral-750 text-stone-200 text-xs font-bold rounded-xl border border-neutral-700 transition cursor-pointer"
                >
                  Close Importer
                </button>
              </div>
            ) : (
              // Import Form
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400" htmlFor="yt-url-input">YouTube Video URL</label>
                  <input
                    id="yt-url-input"
                    type="url"
                    required
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={youtubeUrl}
                    onChange={(e) => setYoutubeUrl(e.target.value)}
                    disabled={loading}
                    className="w-full px-4 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-stone-200 text-xs outline-none focus:border-indigo-500 transition font-mono"
                  />
                </div>

                {/* Video Preview Embed */}
                {videoId && (
                  <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-950">
                    <iframe
                      title="YouTube Video Preview"
                      src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {subjects.length > 0 && (
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-stone-400" htmlFor="yt-subject-select">Target Deck</label>
                      <select
                        id="yt-subject-select"
                        value={selectedSubjectId}
                        onChange={(e) => setSelectedSubjectId(e.target.value)}
                        disabled={loading}
                        className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-stone-200 text-xs outline-none focus:border-indigo-500 transition"
                      >
                        {subjects.map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400" htmlFor="yt-count-select">Number of Cards</label>
                    <select
                      id="yt-count-select"
                      value={count}
                      onChange={(e) => setCount(e.target.value)}
                      disabled={loading}
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-stone-200 text-xs outline-none focus:border-indigo-500 transition"
                    >
                      <option value={5}>5 Flashcards</option>
                      <option value={10}>10 Flashcards</option>
                      <option value={15}>15 Flashcards</option>
                      <option value={20}>20 Flashcards</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-750 text-stone-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !youtubeUrl}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-lg hover:shadow-rose-500/10"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Generating Deck...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Extract AI Flashcards
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
