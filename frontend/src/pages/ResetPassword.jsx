import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader, BookOpen } from 'lucide-react';
import { resetPassword, clearError, clearMessage } from '../store/slices/authSlice';
import ThemeToggle from '../components/ThemeToggle';
import SoundToggle from '../components/SoundToggle';

const ResetPassword = () => {
  const { token } = useParams();
  const dispatch = useDispatch();
  const { loading, error, message, isAuthenticated } = useSelector((state) => state.auth);

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    return () => { dispatch(clearError()); dispatch(clearMessage()); };
  }, [dispatch]);

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError('');

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }

    dispatch(resetPassword({ token, password }));
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFBE9] dark:bg-[#000000] text-[#1F150C] dark:text-[#E1DCC9] p-4 sm:p-6 transition-colors duration-300 font-inter relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[#AD8B73]/10 dark:bg-[#412D15]/30 rounded-full blur-3xl -z-10 animate-pulse-glow" />

      {/* Top Header */}
      <div className="w-full max-w-6xl mx-auto flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="bg-[#AD8B73] dark:bg-[#1F150C] p-2 rounded-xl border border-[#CEAB93]/40 dark:border-[#412D15] flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-[#FFFBE9] dark:text-[#E1DCC9]" />
          </div>
          <span className="font-playfair text-lg font-bold text-[#1F150C] dark:text-[#E1DCC9]">
            OpenPrep AI
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <SoundToggle />
          <ThemeToggle />
        </div>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md mx-auto my-auto bg-[#E3CAA5]/60 dark:bg-[#1F150C] rounded-2xl border border-[#CEAB93] dark:border-[#412D15] shadow-2xl p-6 sm:p-8 transition-colors duration-300">
        {message ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-extrabold font-playfair text-[#1F150C] dark:text-[#E1DCC9]">Password Reset!</h1>
            <p className="text-[#412D15] dark:text-[#C4BA9D] mt-2 text-sm font-medium">{message}</p>
            <Link
              to="/login"
              className="w-full py-3.5 rounded-xl btn-primary-theme font-bold shadow-lg transition-all inline-block mt-6 text-sm text-center"
            >
              Go to Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <Loader className="w-10 h-10 text-[#AD8B73] dark:text-[#E1DCC9] animate-spin mx-auto mb-4" />
            <p className="text-[#412D15] dark:text-[#C4BA9D] text-sm font-medium">Resetting your password...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-extrabold font-playfair text-[#1F150C] dark:text-[#E1DCC9]">Set New Password</h1>
              <p className="text-[#412D15] dark:text-[#C4BA9D] mt-1.5 text-sm font-medium">Choose a strong password for your account</p>
            </div>

            {(error || localError) && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300 font-medium">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
                <span>{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Input Group */}
              <div>
                <label htmlFor="reset-password" className="block text-xs font-bold uppercase tracking-wider text-[#1F150C] dark:text-[#E1DCC9] mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-[#FFFBE9] dark:bg-[#2C1E16] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/70 dark:placeholder-[#C4BA9D]/50 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] focus:border-transparent text-sm transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C6A53] hover:text-[#1F150C] dark:text-[#C4BA9D] dark:hover:text-[#E1DCC9] transition"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input Group */}
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-[#1F150C] dark:text-[#E1DCC9] mb-1.5">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-3 bg-[#FFFBE9] dark:bg-[#2C1E16] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/70 dark:placeholder-[#C4BA9D]/50 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] focus:border-transparent text-sm transition-all shadow-sm"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl btn-primary-theme font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                {loading ? 'Updating Password...' : 'Reset Password'}
              </button>
            </form>
          </>
        )}
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[#8C6A53] dark:text-[#C4BA9D] py-2">
        © {new Date().getFullYear()} OpenPrep AI. All rights reserved.
      </div>
    </div>
  );
};

export default ResetPassword;


export default ResetPassword;
