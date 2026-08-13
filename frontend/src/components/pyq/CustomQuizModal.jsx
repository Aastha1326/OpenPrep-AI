/* eslint-disable no-unused-vars */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaTimes, FaHourglassHalf, FaTrophy, FaBrain, FaFilter, FaSpinner } from 'react-icons/fa';
import API from '../../services/api';

export default function CustomQuizModal({ isOpen, onClose, subjectId, analyses = [] }) {
  const navigate = useNavigate();

  // Extract topics and years from subject analyses
  const { topics, years } = useMemo(() => {
    const topicsSet = new Set();
    const yearsSet = new Set();
    analyses.forEach((analysis) => {
      (analysis.questions || []).forEach((q) => {
        if (q.topicName) topicsSet.add(q.topicName);
        if (q.year) yearsSet.add(Number(q.year));
      });
    });
    return {
      topics: Array.from(topicsSet).sort(),
      years: Array.from(yearsSet).sort((a, b) => b - a),
    };
  }, [analyses]);

  // Form states
  const [selectedTopics, setSelectedTopics] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [difficulty, setDifficulty] = useState('medium');
  const [count, setCount] = useState(10);
  const [timeLimit, setTimeLimit] = useState(20);
  const [language, setLanguage] = useState('english');

  // Status
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const toggleTopic = (topic) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const toggleYear = (year) => {
    setSelectedYears((prev) =>
      prev.includes(year) ? prev.filter((y) => y !== year) : [...prev, year]
    );
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await API.post('/quizzes/generate-custom', {
        subjectId,
        topics: selectedTopics,
        years: selectedYears,
        difficulty,
        count,
        timeLimit,
        language,
      });

      if (res.data?.success) {
        onClose();
        navigate(`/quiz/${res.data.data.id}`);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to generate custom quiz.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800">
          <h3 className="text-base font-bold text-stone-100 flex items-center gap-2">
            <FaBrain className="text-indigo-400" /> Custom Revision Test Generator
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 hover:text-stone-100 transition-colors"
            aria-label="Close custom test builder"
          >
            <FaTimes className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleGenerate} className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl font-semibold">
              {error}
            </div>
          )}

          {/* Topics selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Select Topics ({selectedTopics.length === 0 ? 'All Topics' : `${selectedTopics.length} Selected`})
            </label>
            {topics.length === 0 ? (
              <p className="text-stone-500 text-xs italic">No topics analyzed yet. Upload past papers first.</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto p-2 bg-stone-950/40 rounded-xl border border-neutral-800/60">
                {topics.map((topic) => {
                  const active = selectedTopics.includes(topic);
                  return (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => toggleTopic(topic)}
                      className={`text-left px-3 py-2 rounded-lg text-xs font-medium border transition-all truncate ${
                        active
                          ? 'bg-indigo-500/10 border-indigo-500/80 text-indigo-300'
                          : 'border-neutral-850 hover:bg-neutral-850 text-stone-400'
                      }`}
                    >
                      {topic}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Years selection */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
              Select Exam Years ({selectedYears.length === 0 ? 'All Years' : `${selectedYears.length} Selected`})
            </label>
            {years.length === 0 ? (
              <p className="text-stone-500 text-xs italic">No exam years available.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5 p-2 bg-stone-950/40 rounded-xl border border-neutral-800/60">
                {years.map((yr) => {
                  const active = selectedYears.includes(yr);
                  return (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => toggleYear(yr)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        active
                          ? 'bg-indigo-500/10 border-indigo-500/80 text-indigo-300'
                          : 'border-neutral-850 hover:bg-neutral-850 text-stone-400'
                      }`}
                    >
                      {yr}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Difficulty
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="w-full bg-neutral-850 border border-neutral-750 text-stone-300 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Question Count
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 text-stone-300 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value={5}>5 Questions</option>
                <option value={10}>10 Questions</option>
                <option value={15}>15 Questions</option>
                <option value={20}>20 Questions</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Time Limit (Min)
              </label>
              <select
                value={timeLimit}
                onChange={(e) => setTimeLimit(Number(e.target.value))}
                className="w-full bg-neutral-850 border border-neutral-750 text-stone-300 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value={5}>5 Minutes</option>
                <option value={10}>10 Minutes</option>
                <option value={20}>20 Minutes</option>
                <option value={30}>30 Minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1.5">
                Test Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-neutral-850 border border-neutral-750 text-stone-300 px-3 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
              >
                <option value="english">English</option>
                <option value="hindi">Hindi</option>
                <option value="hinglish">Hinglish</option>
                <option value="tamil">Tamil</option>
                <option value="marathi">Marathi</option>
              </select>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-neutral-950 border-t border-neutral-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 text-xs font-semibold text-stone-400 border border-neutral-850 rounded-xl hover:bg-neutral-850 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading || topics.length === 0}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-md"
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin" /> Generating...
              </>
            ) : (
              <>
                <FaBrain /> Launch Timed Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
