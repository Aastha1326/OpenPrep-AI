import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCalendarAlt, FaEdit, FaClock, FaCheckCircle, FaExclamationTriangle, FaPlus } from 'react-icons/fa';
import API from '../../services/api';

export default function ExamCountdownCard({ stats, onRefresh }) {
  const { targetExamDate, daysUntilExam, requiredDailyMinutes = 0, loggedMinutesToday = 0, paceStatus } = stats || {};

  const [timeRemaining, setTimeRemaining] = useState({ days: 0, hours: 0, minutes: 0 });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isLogSessionOpen, setIsLogSessionOpen] = useState(false);

  // Date picker form state
  const [selectedDate, setSelectedDate] = useState(targetExamDate ? targetExamDate.substring(0, 10) : '');
  const [targetScore, setTargetScore] = useState('');
  const [isSavingDate, setIsSavingDate] = useState(false);

  // Log study session form state
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [studyHours, setStudyHours] = useState('');
  const [logDescription, setLogDescription] = useState('');
  const [isLoggingSession, setIsLoggingSession] = useState(false);
  const [logError, setLogError] = useState('');

  // Countdown timer hook running once per minute
  useEffect(() => {
    if (!targetExamDate) return;

    const updateTimer = () => {
      const difference = +new Date(targetExamDate) - +new Date();
      if (difference <= 0) {
        setTimeRemaining({ days: 0, hours: 0, minutes: 0 });
      } else {
        setTimeRemaining({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
        });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, [targetExamDate]);

  // Fetch subjects list when Log Study Session opens
  useEffect(() => {
    if (isLogSessionOpen) {
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
      setStudyHours('');
      setLogDescription('');
      setLogError('');
    }
  }, [isLogSessionOpen]);

  const handleSaveExamDate = async (e) => {
    e.preventDefault();
    if (!selectedDate) return;
    setIsSavingDate(true);
    try {
      await API.put('/users/exam-countdown', {
        targetExamDate: selectedDate,
        targetScore: targetScore ? parseInt(targetScore, 10) : null,
      });
      setIsDatePickerOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingDate(false);
    }
  };

  const handleLogStudySession = async (e) => {
    e.preventDefault();
    if (!studyHours || parseFloat(studyHours) <= 0) {
      setLogError('Please input a valid study duration in hours.');
      return;
    }
    setIsLoggingSession(true);
    setLogError('');
    try {
      await API.post('/progress/track', {
        studyHours: parseFloat(studyHours),
        subjectId: selectedSubjectId || null,
        description: logDescription || `Self Study Session`,
      });
      setIsLogSessionOpen(false);
      if (onRefresh) onRefresh();
    } catch (err) {
      setLogError(err?.response?.data?.error || 'Failed to log study session.');
    } finally {
      setIsLoggingSession(false);
    }
  };

  const progressPercent = requiredDailyMinutes > 0
    ? Math.min(100, Math.round((loggedMinutesToday / requiredDailyMinutes) * 100))
    : 100;

  // Pace styling mapping
  const getPaceStyles = () => {
    if (paceStatus === 'On Track') {
      return {
        bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400',
        ringColor: '#10b981',
        icon: <FaCheckCircle />,
      };
    }
    if (paceStatus === 'Slightly Behind') {
      return {
        bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400',
        ringColor: '#f59e0b',
        icon: <FaExclamationTriangle />,
      };
    }
    return {
      bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400',
      ringColor: '#f43f5e',
      icon: <FaExclamationTriangle className="animate-bounce" />,
    };
  };

  const paceStyles = getPaceStyles();

  // Progress ring dimensions
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="relative overflow-hidden bg-neutral-900 border border-neutral-850 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-6 items-center">
      {/* Background radial gradient glow */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Left Area: Exam Countdown */}
      <div className="flex-1 space-y-4 w-full">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2 text-stone-400 text-xs font-black uppercase tracking-wider">
            <FaCalendarAlt className="text-indigo-400" />
            <span>Exam Deadline</span>
          </div>

          <button
            onClick={() => setIsDatePickerOpen(true)}
            className="p-1.5 text-stone-400 hover:text-white rounded-lg bg-neutral-800 border border-neutral-750 hover:border-neutral-700 transition cursor-pointer text-xs flex items-center gap-1 font-bold"
            title="Set Target Exam Date"
          >
            <FaEdit /> Change Date
          </button>
        </div>

        {targetExamDate ? (
          <div className="space-y-1">
            {daysUntilExam <= 0 ? (
              <h2 className="text-3xl font-black text-rose-400 tracking-tight animate-pulse font-playfair">
                Exam Day Today! 🎉
              </h2>
            ) : (
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tight font-playfair">
                  {timeRemaining.days}d
                </span>
                <span className="text-xl font-bold text-stone-300 font-playfair">
                  {timeRemaining.hours}h {timeRemaining.minutes}m
                </span>
                <span className="text-stone-400 text-xs font-semibold ml-1">Left</span>
              </div>
            )}
            <p className="text-stone-400 text-xs font-medium">
              Target Exam Date: {new Date(targetExamDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
            </p>
          </div>
        ) : (
          <div className="py-2">
            <p className="text-stone-400 text-xs font-medium italic">No target exam date set yet.</p>
            <button
              onClick={() => setIsDatePickerOpen(true)}
              className="mt-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1 cursor-pointer"
            >
              Set Date & Start Countdown →
            </button>
          </div>
        )}

        {targetExamDate && paceStatus && (
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 px-3 py-1 rounded-xl border text-[10px] font-black uppercase tracking-wide ${paceStyles.bg}`}>
              {paceStyles.icon}
              <span>{paceStatus}</span>
            </div>
            <span className="text-[10px] font-medium text-stone-400">
              Pace status based on daily study tasks remaining
            </span>
          </div>
        )}
      </div>

      {/* Right Area: Velocity Progress Ring */}
      {targetExamDate && (
        <div className="flex flex-col sm:flex-row items-center gap-4 border-t md:border-t-0 md:border-l border-neutral-800 pt-4 md:pt-0 md:pl-6 w-full md:w-auto shrink-0 justify-around">
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Progress Ring */}
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="48"
                cy="48"
                r={radius}
                className="stroke-neutral-800"
                strokeWidth="7"
                fill="transparent"
              />
              <circle
                cx="48"
                cy="48"
                r={radius}
                stroke={paceStyles.ringColor}
                strokeWidth="7"
                fill="transparent"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-lg font-black text-white leading-none">{progressPercent}%</span>
              <span className="text-[8px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">Pace</span>
            </div>
          </div>

          <div className="space-y-3 w-full sm:w-auto">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5 text-stone-400 text-xs font-semibold">
                <FaClock className="text-indigo-400 w-3 h-3" />
                <span>Daily Velocity Tracker</span>
              </div>
              <p className="text-xs font-bold text-white">
                {(loggedMinutesToday / 60).toFixed(1)} / {(requiredDailyMinutes / 60).toFixed(1)} Hrs Logged Today
              </p>
            </div>

            <button
              onClick={() => setIsLogSessionOpen(true)}
              className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
            >
              <FaPlus /> Log Study Session
            </button>
          </div>
        </div>
      )}

      {/* Date Picker Modal */}
      <AnimatePresence>
        {isDatePickerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-black text-white">Set Target Exam Date</h3>
              <form onSubmit={handleSaveExamDate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400" htmlFor="exam-date-input">Exam Date</label>
                  <input
                    id="exam-date-input"
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-stone-200 text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400" htmlFor="target-score-input">Target Score (Optional)</label>
                  <input
                    id="target-score-input"
                    type="number"
                    placeholder="e.g. 95"
                    value={targetScore}
                    onChange={(e) => setTargetScore(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-stone-200 text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDatePickerOpen(false)}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-750 text-stone-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingDate}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isSavingDate && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />}
                    Save Settings
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Log Study Session Modal */}
      <AnimatePresence>
        {isLogSessionOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl"
            >
              <h3 className="text-base font-black text-white">Log Study Session</h3>
              <form onSubmit={handleLogStudySession} className="space-y-4">
                {subjects.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-stone-400" htmlFor="subject-select">Select Subject</label>
                    <select
                      id="subject-select"
                      value={selectedSubjectId}
                      onChange={(e) => setSelectedSubjectId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-stone-200 text-sm outline-none focus:border-indigo-500 transition"
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
                  <label className="text-xs font-bold text-stone-400" htmlFor="study-hours-input">Hours Studied</label>
                  <input
                    id="study-hours-input"
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    placeholder="e.g. 1.5"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-stone-200 text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-400" htmlFor="study-desc-input">Description / Tasks Done</label>
                  <input
                    id="study-desc-input"
                    type="text"
                    placeholder="e.g. Revised Chapter 3 Notes"
                    value={logDescription}
                    onChange={(e) => setLogDescription(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-stone-200 text-sm outline-none focus:border-indigo-500 transition"
                  />
                </div>

                {logError && (
                  <p className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl">
                    {logError}
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsLogSessionOpen(false)}
                    className="flex-1 py-2 bg-neutral-800 hover:bg-neutral-750 text-stone-300 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoggingSession}
                    className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    {isLoggingSession && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin mr-1" />}
                    Log Session
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
