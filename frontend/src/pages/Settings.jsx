import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import LeatherBoard from '../components/dashboard/LeatherBoard';
import VintagePaper from '../components/dashboard/VintagePaper';
import API from '../services/api';
import { loadUser } from '../store/slices/authSlice';

const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const [leaderboardVisible, setLeaderboardVisible] = useState(
    typeof user?.leaderboardVisible === 'boolean' ? user.leaderboardVisible : true
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const handleToggle = useCallback(async () => {
    const next = !leaderboardVisible;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await API.patch('/auth/settings', { leaderboardVisible: next });
      setLeaderboardVisible(next);
      setSaved(true);
      // Refresh the Redux user so every surface reflects the new preference
      await dispatch(loadUser());
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  }, [leaderboardVisible, dispatch]);

  return (
    <LeatherBoard>
      <div className="pl-4 md:pl-16 pr-4 lg:pr-8 py-8 space-y-10">
        {/* --- HEADER --- */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-black/20 pb-6 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-gold-foil mb-2 font-playfair tracking-tight">
              Settings
            </h1>
            <p className="text-amber-100/70 text-base italic font-playfair">
              Manage your privacy and study preferences.
            </p>
          </motion.div>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-yellow-400 border border-yellow-700/50 rounded-sm text-sm font-semibold shadow transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
        </div>

        {/* --- LEADERBOARD PRIVACY --- */}
        <VintagePaper className="border-t-4 border-t-amber-700">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-7 h-7 text-amber-700" />
            <h2 className="text-2xl font-bold font-playfair text-neutral-800 dark:text-neutral-100">
              Leaderboard Privacy
            </h2>
          </div>

          <p className="text-neutral-600 dark:text-neutral-300 mb-6 leading-relaxed">
            The weekly study leaderboard ranks students by focus hours, quizzes completed and
            flashcards reviewed. You can choose whether your real name is shown to other students
            or replaced with an anonymous handle.
          </p>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-neutral-100/60 dark:bg-neutral-800/60 border border-neutral-300 dark:border-neutral-600 rounded-sm">
            <div className="flex items-start gap-3">
              {leaderboardVisible ? (
                <Eye className="w-5 h-5 mt-0.5 text-green-700 dark:text-green-400 shrink-0" />
              ) : (
                <EyeOff className="w-5 h-5 mt-0.5 text-red-700 dark:text-red-400 shrink-0" />
              )}
              <div>
                <p className="font-playfair font-bold text-lg text-neutral-800 dark:text-neutral-100">
                  {leaderboardVisible ? 'Public Leaderboard Name' : 'Anonymous Student'}
                </p>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-0.5">
                  {leaderboardVisible
                    ? 'Other students will see your real name on the leaderboard.'
                    : 'Other students will see "Anonymous Student" instead of your name.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={leaderboardVisible}
              aria-label="Show my real name on the weekly leaderboard"
              onClick={handleToggle}
              disabled={saving}
              className="relative inline-flex items-center h-8 w-14 rounded-full bg-neutral-300 dark:bg-neutral-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600 disabled:opacity-50 shrink-0"
            >
              <span
                className={`inline-block w-6 h-6 rounded-full bg-white shadow transform transition-transform ${
                  leaderboardVisible ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {saving && (
            <p className="mt-4 flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
              <Loader2 className="w-4 h-4 animate-spin" /> Saving preference...
            </p>
          )}
          {!saving && saved && (
            <p className="mt-4 text-sm text-green-700 dark:text-green-400" role="status">
              Preferences saved successfully.
            </p>
          )}
          {!saving && error && (
            <p className="mt-4 text-sm text-red-700 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
        </VintagePaper>
      </div>
    </LeatherBoard>
  );
};

export default Settings;
