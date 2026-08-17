import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle, X, ArrowLeft } from 'lucide-react';
import API from '../../services/api';
import OtpInput from './OtpInput';
import { loadUser } from '../../store/slices/authSlice';
import useFocusTrap from '../../hooks/useFocusTrap';

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const containerRef = useFocusTrap(isOpen, onClose);
  const dispatch = useDispatch();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(Array(6).fill(''));
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await API.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'OTP reset code has been sent to your email.');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter a 6-digit code.');
      setLoading(false);
      return;
    }
    try {
      const response = await API.post('/auth/verify-otp', { email, otp: otpCode });
      setMessage(response.data.message || 'Code verified successfully.');
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Please check the code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Client-side password complexity check
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    if (password.length < 8 || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      setError('Password must be at least 8 characters and contain at least one uppercase letter, one lowercase letter, one number, and one special character.');
      setLoading(false);
      return;
    }

    const otpCode = otp.join('');
    try {
      const response = await API.post('/auth/reset-password', { email, otp: otpCode, password });
      const { token, refreshToken } = response.data;
      if (token && refreshToken) {
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        await dispatch(loadUser());
      }
      setMessage('Password reset successful. Logging you in...');
      setTimeout(() => {
        onClose();
        // Reset state
        setStep(1);
        setEmail('');
        setOtp(Array(6).fill(''));
        setPassword('');
        setMessage('');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="forgot-password-modal-title"
        className="w-full max-w-md bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93] dark:border-[#412D15] rounded-3xl shadow-2xl overflow-hidden relative p-6 sm:p-8 animate-scale-up"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-full hover:bg-[#E3CAA5]/30 dark:hover:bg-[#412D15]/50 text-[#AD8B73] dark:text-[#E1DCC9] transition-all"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 id="forgot-password-modal-title" className="text-2xl font-extrabold font-playfair text-[#1F150C] dark:text-[#E1DCC9]">
            {step === 1 && 'Forgot Password'}
            {step === 2 && 'Verify Code'}
            {step === 3 && 'New Password'}
          </h2>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mt-1.5 font-medium">
            {step === 1 && "Enter your email address and we'll send you a 6-digit recovery code."}
            {step === 2 && `We sent a 6-digit recovery code to ${email}`}
            {step === 3 && 'Choose a strong password containing letters, numbers, and symbols.'}
          </p>
        </div>

        {/* Error / Success Toast alerts */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300 font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300 font-medium">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {/* Step 1: Send OTP */}
        {step === 1 && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <label htmlFor="forgot-email-modal" className="block text-xs font-bold text-[#1F150C] dark:text-[#E1DCC9] mb-1">
                Email address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
                <input
                  id="forgot-email-modal"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-[#FFFBE9] dark:bg-[#251D17] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/60 dark:placeholder-[#C4BA9D]/40 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] text-xs sm:text-sm transition-all font-medium"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-primary-theme font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send Verification Code'
              )}
            </button>
          </form>
        )}

        {/* Step 2: Verify OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <OtpInput otp={otp} setOtp={setOtp} error={error} />

            <div className="space-y-3">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl btn-primary-theme font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Verify Code'
                )}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 bg-transparent text-xs text-[#AD8B73] dark:text-[#E1DCC9] hover:underline font-bold flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Request a new code
              </button>
            </div>
          </form>
        )}

        {/* Step 3: New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="new-password-modal" className="block text-xs font-bold text-[#1F150C] dark:text-[#E1DCC9] mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
                <input
                  id="new-password-modal"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  className="w-full pl-10 pr-10 py-2.5 bg-[#FFFBE9] dark:bg-[#251D17] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/60 dark:placeholder-[#C4BA9D]/40 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] text-xs sm:text-sm transition-all font-medium"
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl btn-primary-theme font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                'Reset Password'
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
