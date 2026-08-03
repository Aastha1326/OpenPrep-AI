import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, RefreshCw, HelpCircle, Info, Check } from 'lucide-react';
import { updateSM2Settings, resetSM2Settings } from '../../store/slices/authSlice';

const SM2SettingsModal = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user, loading, error: authError } = useSelector((state) => state.auth);

  // Local state for inputs
  const [easyMod, setEasyMod] = useState('1.0');
  const [intervalMod, setIntervalMod] = useState('1.0');
  const [step1, setStep1] = useState('1');
  const [step2, setStep2] = useState('6');

  const [localError, setLocalError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [saving, setSaving] = useState(false);

  // Sync state with user profile settings
  useEffect(() => {
    if (user) {
      setEasyMod((user.sm2EasyFactorModifier ?? 1.0).toString());
      setIntervalMod((user.sm2IntervalModifier ?? 1.0).toString());
      setStep1((user.sm2Step1Interval ?? 1).toString());
      setStep2((user.sm2Step2Interval ?? 6).toString());
    }
  }, [user, isOpen]);

  // Clean errors and messages on close/open
  useEffect(() => {
    setLocalError(null);
    setSuccessMsg(null);
  }, [isOpen]);

  const handleReset = async () => {
    if (window.confirm('Are you sure you want to reset all SM-2 parameters to default values?')) {
      setSaving(true);
      setLocalError(null);
      setSuccessMsg(null);
      try {
        const result = await dispatch(resetSM2Settings()).unwrap();
        setSuccessMsg(result.message || 'Reset to default parameters successfully!');
        setTimeout(() => setSuccessMsg(null), 3000);
      } catch (err) {
        setLocalError(err || 'Failed to reset settings');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setSuccessMsg(null);

    const parsedEasyMod = parseFloat(easyMod);
    const parsedIntervalMod = parseFloat(intervalMod);
    const parsedStep1 = parseInt(step1, 10);
    const parsedStep2 = parseInt(step2, 10);

    // Validation checks
    if (isNaN(parsedEasyMod) || parsedEasyMod <= 0) {
      setLocalError('Easiness Factor Modifier must be a positive number.');
      return;
    }
    if (isNaN(parsedIntervalMod) || parsedIntervalMod <= 0) {
      setLocalError('Interval Modifier must be a positive number.');
      return;
    }
    if (isNaN(parsedStep1) || parsedStep1 <= 0 || !Number.isInteger(parsedStep1)) {
      setLocalError('Step 1 Interval must be a positive integer.');
      return;
    }
    if (isNaN(parsedStep2) || parsedStep2 <= 0 || !Number.isInteger(parsedStep2)) {
      setLocalError('Step 2 Interval must be a positive integer.');
      return;
    }

    setSaving(true);
    try {
      const result = await dispatch(
        updateSM2Settings({
          sm2EasyFactorModifier: parsedEasyMod,
          sm2IntervalModifier: parsedIntervalMod,
          sm2Step1Interval: parsedStep1,
          sm2Step2Interval: parsedStep2,
        })
      ).unwrap();
      
      setSuccessMsg(result.message || 'SM-2 settings updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setLocalError(err || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const error = localError || authError;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#fdfaf3] w-full max-w-lg rounded-sm shadow-[0_12px_40px_rgba(0,0,0,0.4)] border border-yellow-800/10 flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-300">
              <div>
                <h2 className="text-2xl font-playfair font-bold text-neutral-800">SM-2 Spaced Repetition Settings</h2>
                <p className="text-xs text-neutral-500 mt-1 font-serif">Tailor review intervals and learning pace to your study speed.</p>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
                disabled={saving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
                  <X className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {successMsg && (
                <div className="p-3 bg-green-50 border border-green-200 text-green-800 text-sm rounded flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <form onSubmit={handleSave} className="space-y-4">
                {/* Easiness Factor Modifier */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5">
                      Easiness Factor Modifier
                      <span className="group relative cursor-pointer">
                        <HelpCircle className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-64 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity font-normal z-50 shadow-lg text-center leading-relaxed">
                          Multiplies the E-Factor change. Higher values make the card interval grow faster on success; lower values slow down the growth.
                        </span>
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      max="10.0"
                      value={easyMod}
                      onChange={(e) => setEasyMod(e.target.value)}
                      className="w-24 px-3 py-1 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 font-mono text-sm text-right"
                      required
                      disabled={saving}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 italic">Default standard value: 1.0</p>
                </div>

                {/* Interval Modifier */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5">
                      Interval Modifier
                      <span className="group relative cursor-pointer">
                        <HelpCircle className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-64 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity font-normal z-50 shadow-lg text-center leading-relaxed">
                          Overall modifier multiplied by computed days. E.g., 1.2 increases review intervals by 20% for all cards.
                        </span>
                      </span>
                    </label>
                    <input
                      type="number"
                      step="0.05"
                      min="0.05"
                      max="10.0"
                      value={intervalMod}
                      onChange={(e) => setIntervalMod(e.target.value)}
                      className="w-24 px-3 py-1 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 font-mono text-sm text-right"
                      required
                      disabled={saving}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 italic">Default standard value: 1.0</p>
                </div>

                {/* Step 1 Interval */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5">
                      Step 1 Interval (Repetition 0)
                      <span className="group relative cursor-pointer">
                        <HelpCircle className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-64 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity font-normal z-50 shadow-lg text-center leading-relaxed">
                          Interval in days for review after passing a flashcard on the first step.
                        </span>
                      </span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={step1}
                      onChange={(e) => setStep1(e.target.value)}
                      className="w-24 px-3 py-1 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 font-mono text-sm text-right"
                      required
                      disabled={saving}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 italic">Default standard value: 1 day</p>
                </div>

                {/* Step 2 Interval */}
                <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-sm">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-semibold text-neutral-800 flex items-center gap-1.5">
                      Step 2 Interval (Repetition 1)
                      <span className="group relative cursor-pointer">
                        <HelpCircle className="w-3.5 h-3.5 text-neutral-400 hover:text-neutral-600" />
                        <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1 w-64 p-2 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity font-normal z-50 shadow-lg text-center leading-relaxed">
                          Interval in days for review after passing a flashcard on the second step.
                        </span>
                      </span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={step2}
                      onChange={(e) => setStep2(e.target.value)}
                      className="w-24 px-3 py-1 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-yellow-600 font-mono text-sm text-right"
                      required
                      disabled={saving}
                    />
                  </div>
                  <p className="text-xs text-neutral-500 italic">Default standard value: 6 days</p>
                </div>
              </form>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-300 flex items-center justify-between bg-neutral-50">
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 border border-red-200 hover:bg-red-50 text-red-700 rounded-sm font-medium transition-colors flex items-center gap-1.5 text-sm"
                disabled={saving}
              >
                <RefreshCw className="w-4 h-4" />
                Reset Defaults
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 border border-neutral-300 text-neutral-700 rounded-sm hover:bg-neutral-100 font-medium transition-colors text-sm"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded-sm shadow-md hover:shadow-lg font-medium transition-all flex items-center gap-1.5 text-sm disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default SM2SettingsModal;
