import { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, RotateCcw, Clock, ChevronDown, Music } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import API from '../../services/api';

const PomodoroTimer = () => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);

  const [isCompleted, setIsCompleted] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);
  const [showToast, setShowToast] = useState(null);
  const [totalStudyHours, setTotalStudyHours] = useState(0);
  const [pausedSeconds, setPausedSeconds] = useState(0);
  const [interruptions, setInterruptions] = useState(0);

  const [audioSrc, setAudioSrc] = useState(localStorage.getItem('pomodoro_audio') || '');
  const audioRef = useRef(null);

  // Fetch user's subjects on component mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const response = await API.get('/academic/subjects');
        setSubjects(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch subjects:', error);
      }
    };
    fetchSubjects();
  }, []);

  const playChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {
      // Audio context fallback
    }
  };

  const logFocusSession = useCallback(
    async (activeSeconds) => {
      try {
        const payload = { activeSeconds, pausedSeconds, interruptions };
        if (selectedSubject) payload.subjectId = selectedSubject.id;
        await API.post('/progress/focus-session', payload);
      } catch (error) {
        console.error('Failed to log focus session:', error);
      }
    },
    [pausedSeconds, interruptions, selectedSubject]
  );

  const logStudyTime = useCallback(async () => {
    try {
      const studyHours = 0.42; // 25 minutes in hours
      const description = selectedSubject
        ? `Completed 25-min Pomodoro Study Session for ${selectedSubject.name}`
        : 'Completed 25-min Pomodoro Study Session';

      const payload = {
        studyHours,
        description,
      };

      if (selectedSubject) {
        payload.subjectId = selectedSubject.id;
      }

      const response = await API.post('/progress/track', payload);

      setTotalStudyHours(response.data.data.totalStudyHours);

      setShowToast({
        message: `Great work! +${studyHours.toFixed(2)}h logged. Total: ${response.data.data.totalStudyHours.toFixed(2)}h`,
        streak: Math.floor(response.data.data.totalStudyHours / 2), // Simple streak calculation
      });

      setTimeout(() => setShowToast(null), 4000);
    } catch (error) {
      console.error('Failed to log study time:', error);
      setShowToast({
        message: 'Failed to log study time. Please try again.',
        error: true,
      });
      setTimeout(() => setShowToast(null), 3000);
    }
  }, [selectedSubject]);

  useEffect(() => {
    let interval = null;
    if (isActive) {
      interval = setInterval(() => {
        setTimeLeft((time) => {
          // paused-time accumulation only happens while inactive (see effect below)
          if (time <= 1) {
            setIsActive(false);
            setIsCompleted(true);
            playChime();
            logStudyTime(); // Auto-log study time on completion
            logFocusSession(25 * 60 - pausedSeconds); // Log focus quality breakdown
            return 0;
          }
          return time - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  // Track paused duration whenever the timer is stopped mid-session
  useEffect(() => {
    let pauseInterval = null;
    if (!isActive && !isCompleted && timeLeft < 25 * 60 && timeLeft > 0) {
      pauseInterval = setInterval(() => {
        setPausedSeconds((s) => s + 1);
      }, 1000);
    }
    return () => clearInterval(pauseInterval);
  }, [isActive, isCompleted, timeLeft]);
  const toggleTimer = () => {
    if (isCompleted) setIsCompleted(false);
    if (isActive) {
      setInterruptions((count) => count + 1); // user is pausing -> count it
      audioRef.current?.pause();
    } else {
      if (audioSrc) audioRef.current?.play().catch(() => {});
    }
    setIsActive(!isActive);
  };
  const resetTimer = () => {
    setIsActive(false);
    setIsCompleted(false);
    setTimeLeft(25 * 60);
    setPausedSeconds(0);
    setInterruptions(0);
    audioRef.current?.pause();
  };
  const handleSubjectSelect = (subject) => {
    setSelectedSubject(subject);
    setIsSubjectDropdownOpen(false);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Calculate progress for the circular ring (0 to 100)
  const progress = ((25 * 60 - timeLeft) / (25 * 60)) * 100;

  return (
    <>
      <div className="bg-gradient-to-br from-yellow-700 to-yellow-900 p-6 rounded-full shadow-[0_10px_20px_rgba(0,0,0,0.6),inset_0_2px_10px_rgba(255,255,255,0.2)] border-4 border-yellow-600 relative overflow-hidden flex flex-col items-center justify-center w-64 h-64 mx-auto group">
        {/* Inner Metallic Bezel */}
        <div className="absolute inset-2 rounded-full border-4 border-yellow-800 shadow-[inset_0_5px_15px_rgba(0,0,0,0.8)] pointer-events-none" />

        {/* Dial background */}
        <div className="absolute inset-4 rounded-full bg-vintage-paper shadow-inner flex flex-col items-center justify-center">
          {/* Decorative ticks */}
          <div className="absolute inset-0 rounded-full border-[10px] border-dashed border-neutral-400/30 pointer-events-none" />

          <Clock className="w-6 h-6 text-yellow-800 mb-2 opacity-50" />

          <h3 className="font-playfair font-bold text-4xl text-neutral-900 dark:text-white tracking-wider">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </h3>
          <p className="text-xs text-neutral-500 font-bold tracking-widest mt-1 uppercase">
            {isCompleted ? 'Break Time!' : 'Focus'}
          </p>

          {/* Subject Selector */}
          {subjects.length > 0 && (
            <div className="relative mt-2 z-20">
              <button
                onClick={() => setIsSubjectDropdownOpen(!isSubjectDropdownOpen)}
                className="flex items-center gap-1 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                {selectedSubject ? selectedSubject.name : 'Select Subject (Optional)'}
                <ChevronDown className="w-3 h-3" />
              </button>

              <AnimatePresence>
                {isSubjectDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-neutral-200 dark:border-slate-700 py-1 min-w-[150px] z-30"
                  >
                    <button
                      onClick={() => handleSubjectSelect(null)}
                      className="w-full px-3 py-1.5 text-left text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      No Subject
                    </button>
                    {subjects.map((subject) => (
                      <button
                        key={subject.id}
                        onClick={() => handleSubjectSelect(subject)}
                        className="w-full px-3 py-1.5 text-left text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        {subject.name}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Controls */}
          <div className="flex space-x-4 mt-4 z-10">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={toggleTimer}
              aria-label={isActive ? 'Pause timer' : 'Start timer'}
              className="w-10 h-10 rounded-full bg-yellow-700 text-yellow-50 flex items-center justify-center shadow-md border border-yellow-600"
            >
              {isActive ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={resetTimer}
              aria-label="Reset timer"
              className="w-10 h-10 rounded-full bg-neutral-200 dark:bg-slate-700 text-neutral-700 dark:text-neutral-200 flex items-center justify-center shadow-md border border-neutral-300 dark:border-slate-600"
            >
              <RotateCcw className="w-4 h-4" />
            </motion.button>
          </div>

          {/* Ambient Audio Selection */}
          <div className="mt-3 z-10 w-full px-8">
            <select
              value={audioSrc}
              onChange={(e) => {
                const src = e.target.value;
                setAudioSrc(src);
                localStorage.setItem('pomodoro_audio', src);
                if (src && isActive && audioRef.current) {
                  audioRef.current.src = src;
                  audioRef.current.play().catch(() => {});
                } else if (!src && audioRef.current) {
                  audioRef.current.pause();
                }
              }}
              className="w-full text-[10px] bg-transparent border-b border-neutral-400 text-neutral-600 focus:outline-none p-1"
            >
              <option value="">No ambient sound</option>
              <option value="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3">Rain</option>
              <option value="https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39b4b0eb.mp3">Forest</option>
              <option value="https://cdn.pixabay.com/download/audio/2022/03/15/audio_73d47d12f3.mp3">White Noise</option>
              <option value="https://cdn.pixabay.com/download/audio/2022/01/18/audio_82136d400e.mp3">Binaural 40Hz</option>
            </select>
          </div>
        </div>

        {/* Hidden Audio Player */}
        <audio ref={audioRef} src={audioSrc} loop />

        {/* Progress Indicator (SVG Circle) */}
        <svg
          className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
          viewBox="0 0 100 100"
        >
          <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(0,0,0,0.1)" strokeWidth="4" />
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="289" /* 2 * PI * 46 ≈ 289 */
            strokeDashoffset={289 - (progress / 100) * 289}
            className="transition-all duration-1000 ease-linear"
          />
        </svg>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-sm border shadow-[0_4px_20px_rgba(0,0,0,0.6)] flex items-center gap-3 ${
              showToast.error
                ? 'bg-red-900 text-red-50 border-red-700/50'
                : 'bg-neutral-900 text-yellow-50 border-yellow-700/50'
            }`}
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
              className="text-2xl"
            >
              🔥
            </motion.div>
            <div className="flex flex-col">
              <span className="font-inter font-medium text-sm">{showToast.message}</span>
              {showToast.streak && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs text-yellow-400 font-bold"
                >
                  Streak: {showToast.streak} days! 🎯
                </motion.span>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PomodoroTimer;
