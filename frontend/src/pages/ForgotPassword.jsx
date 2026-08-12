import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle, BookOpen } from 'lucide-react';
import { forgotPassword, clearError, clearMessage } from '../store/slices/authSlice';
import ThemeToggle from '../components/ThemeToggle';
import SoundToggle from '../components/SoundToggle';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { loading, error, message } = useSelector((state) => state.auth);
  const [email, setEmail] = useState('');

  useEffect(() => {
    return () => { dispatch(clearError()); dispatch(clearMessage()); };
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(forgotPassword(email));
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFBE9] dark:bg-[#000000] text-[#1F150C] dark:text-[#E1DCC9] p-4 sm:p-6 transition-colors duration-300 font-inter relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-[#AD8B73]/10 dark:bg-[#412D15]/30 rounded-full blur-3xl -z-10 animate-pulse-glow" />

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
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#AD8B73] dark:text-[#E1DCC9] hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#AD8B73]/15 dark:bg-[#412D15]/50 text-[#AD8B73] dark:text-[#E1DCC9] flex items-center justify-center mx-auto mb-4 border border-[#CEAB93] dark:border-[#412D15]">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-extrabold font-playfair text-[#1F150C] dark:text-[#E1DCC9]">Reset Password</h1>
          <p className="text-[#412D15] dark:text-[#C4BA9D] mt-1.5 text-sm font-medium">
            Enter your email address and we'll send you a password reset link
          </p>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 flex items-start gap-2.5 text-sm text-emerald-700 dark:text-emerald-300 font-medium">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && !message && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300 font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-xs font-bold uppercase tracking-wider text-[#1F150C] dark:text-[#E1DCC9] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-3 bg-[#FFFBE9] dark:bg-[#2C1E16] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/70 dark:placeholder-[#C4BA9D]/50 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] focus:border-transparent text-sm transition-all shadow-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-primary-theme font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" /> Sending Link...
                </span>
              ) : (
                'Send Reset Link'
              )}
            </button>
          </form>
        )}
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[#8C6A53] dark:text-[#C4BA9D] py-2">
        © {new Date().getFullYear()} OpenPrep AI. All rights reserved.
      </div>
    </div>
  );
};

export default ForgotPassword;
