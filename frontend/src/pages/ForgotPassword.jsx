import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { Mail, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { forgotPassword, clearError, clearMessage } from '../store/slices/authSlice';

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
    <div className="min-h-screen flex items-center justify-center bg-[#EEE3CB] dark:bg-[#000000] p-4 sm:p-6 font-jakarta relative overflow-hidden">
      {/* Ambient Blobs */}
      <div className="absolute top-1/3 left-1/3 w-96 h-96 bg-[#D7C0AE]/30 dark:bg-[#412D15]/20 rounded-full blur-3xl -z-10 animate-blob" />

      <div className="w-full max-w-md bg-[#F5EDE0] dark:bg-[#1F150C] rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#D7C0AE] dark:border-[#412D15] relative z-10">
        <Link to="/login" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#967E76] dark:text-[#E1DCC9] hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Sign In
        </Link>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-[#967E76]/15 dark:bg-[#412D15]/50 text-[#967E76] dark:text-[#E1DCC9] flex items-center justify-center mx-auto mb-4 border border-[#D7C0AE] dark:border-[#412D15]">
            <Mail className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold font-outfit text-[#3E302B] dark:text-[#E1DCC9]">Reset Password</h1>
          <p className="text-[#7E6760] dark:text-[#E1DCC9]/70 mt-1.5 text-sm">
            Enter your email address and we'll send you a password reset link
          </p>
        </div>

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 mb-6 flex items-start gap-2.5 text-sm text-emerald-700 dark:text-emerald-300">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {error && !message && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-sm text-rose-700 dark:text-rose-300">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="forgot-email" className="block text-xs font-bold uppercase tracking-wider text-[#3E302B] dark:text-[#E1DCC9] mb-1.5">
                Email Address
              </label>
              <div className="w-full flex items-center bg-white dark:bg-[#0D0A08] border border-[#D7C0AE] dark:border-[#412D15] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#967E76] dark:focus-within:ring-[#E1DCC9] shadow-sm transition-all">
                <div className="pl-4 pr-1 text-[#967E76] dark:text-[#E1DCC9] shrink-0 flex items-center justify-center">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="student@university.edu"
                  className="w-full py-3 pr-4 pl-2 bg-transparent border-0 text-[#3E302B] dark:text-[#E1DCC9] placeholder-[#967E76]/60 dark:placeholder-[#E1DCC9]/40 text-sm focus:outline-none focus:ring-0"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#967E76] hover:bg-[#7E6760] text-[#EEE3CB] dark:bg-[#E1DCC9] dark:hover:bg-[#FFFFFF] dark:text-[#1C1817] font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
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
    </div>
  );
};

export default ForgotPassword;
