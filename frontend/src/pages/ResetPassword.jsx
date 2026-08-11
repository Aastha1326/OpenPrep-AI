import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader } from 'lucide-react';
import { resetPassword, clearError, clearMessage } from '../store/slices/authSlice';

const PASSWORD_CRITERIA = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number (0-9)', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character (!@#$%^&* etc.)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

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
    <div className="min-h-screen flex items-center justify-center bg-[#EEE3CB] dark:bg-[#000000] p-4 sm:p-6 font-jakarta relative overflow-hidden">
      {/* Ambient Blobs */}
      <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-[#D7C0AE]/30 dark:bg-[#412D15]/20 rounded-full blur-3xl -z-10 animate-blob" />

      <div className="w-full max-w-md bg-[#F5EDE0] dark:bg-[#1F150C] rounded-3xl p-8 sm:p-10 shadow-2xl border border-[#D7C0AE] dark:border-[#412D15] relative z-10">
        {message ? (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold font-outfit text-[#3E302B] dark:text-[#E1DCC9]">Password Reset!</h1>
            <p className="text-[#7E6760] dark:text-[#E1DCC9]/70 mt-2 text-sm">{message}</p>
            <Link
              to="/login"
              className="w-full bg-[#967E76] hover:bg-[#7E6760] text-[#EEE3CB] dark:bg-[#E1DCC9] dark:hover:bg-[#FFFFFF] dark:text-[#1C1817] font-bold py-3.5 rounded-xl shadow-md transition-all inline-block mt-6 text-sm text-center"
            >
              Go to Sign In
            </Link>
          </div>
        ) : loading ? (
          <div className="text-center py-8">
            <Loader className="w-10 h-10 text-[#967E76] dark:text-[#E1DCC9] animate-spin mx-auto mb-4" />
            <p className="text-[#7E6760] dark:text-[#E1DCC9]/70 text-sm font-medium">Resetting your password...</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold font-outfit text-[#3E302B] dark:text-[#E1DCC9]">Set New Password</h1>
              <p className="text-[#7E6760] dark:text-[#E1DCC9]/70 mt-1.5 text-sm">Choose a strong password for your account</p>
            </div>

            {(error || localError) && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-sm text-rose-700 dark:text-rose-300">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{localError || error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Input Group */}
              <div>
                <label htmlFor="reset-password" className="block text-xs font-bold uppercase tracking-wider text-[#3E302B] dark:text-[#E1DCC9] mb-1.5">
                  New Password
                </label>
                <div className="w-full flex items-center bg-white dark:bg-[#0D0A08] border border-[#D7C0AE] dark:border-[#412D15] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#967E76] dark:focus-within:ring-[#E1DCC9] shadow-sm transition-all">
                  <div className="pl-4 pr-1 text-[#967E76] dark:text-[#E1DCC9] shrink-0 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="reset-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                    placeholder="••••••••"
                    className="w-full py-3 px-2 bg-transparent border-0 text-[#3E302B] dark:text-[#E1DCC9] placeholder-[#967E76]/60 dark:placeholder-[#E1DCC9]/40 text-sm focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="pr-4 text-[#967E76] hover:text-[#3E302B] dark:text-[#E1DCC9]/70 dark:hover:text-[#E1DCC9] shrink-0"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password Input Group */}
              <div>
                <label htmlFor="confirm-password" className="block text-xs font-bold uppercase tracking-wider text-[#3E302B] dark:text-[#E1DCC9] mb-1.5">
                  Confirm New Password
                </label>
                <div className="w-full flex items-center bg-white dark:bg-[#0D0A08] border border-[#D7C0AE] dark:border-[#412D15] rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-[#967E76] dark:focus-within:ring-[#E1DCC9] shadow-sm transition-all">
                  <div className="pl-4 pr-1 text-[#967E76] dark:text-[#E1DCC9] shrink-0 flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full py-3 px-2 bg-transparent border-0 text-[#3E302B] dark:text-[#E1DCC9] placeholder-[#967E76]/60 dark:placeholder-[#E1DCC9]/40 text-sm focus:outline-none focus:ring-0"
                  />
                </div>
              </div>

              {password.length > 0 && (
                <div className="p-3 bg-white/80 dark:bg-[#0D0A08] rounded-xl border border-[#D7C0AE] dark:border-[#412D15] space-y-1.5">
                  {PASSWORD_CRITERIA.map((criterion, idx) => {
                    const passed = criterion.test(password);
                    return (
                      <div key={idx} className="flex items-center gap-2 text-xs">
                        <CheckCircle className={`w-3.5 h-3.5 ${passed ? 'text-[#967E76] dark:text-[#E1DCC9]' : 'text-[#D7C0AE] dark:text-[#412D15]'}`} />
                        <span className={passed ? 'text-[#3E302B] dark:text-[#E1DCC9] font-semibold' : 'text-[#7E6760] dark:text-[#E1DCC9]/40'}>
                          {criterion.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#967E76] hover:bg-[#7E6760] text-[#EEE3CB] dark:bg-[#E1DCC9] dark:hover:bg-[#FFFFFF] dark:text-[#1C1817] font-bold py-3.5 rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-2"
              >
                Reset Password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
