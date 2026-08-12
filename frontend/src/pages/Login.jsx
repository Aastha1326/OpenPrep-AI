import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, AlertCircle, BookOpen } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';
import { loginUser, googleLoginUser, loadUser, clearError } from '../store/slices/authSlice';
import ThemeToggle from '../components/ThemeToggle';
import SoundToggle from '../components/SoundToggle';
import ForgotPasswordModal from '../components/auth/ForgotPasswordModal';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const googleAuthUrl = `${apiBaseUrl.replace(/\/$/, '')}/auth/google`;

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    // Check if returning from Passport Google OAuth redirect with tokens in URL
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    const refreshToken = searchParams.get('refreshToken');

    if (token && refreshToken) {
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      dispatch(loadUser()).then(() => {
        navigate('/dashboard', { replace: true });
      });
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); };
  }, [dispatch]);

  const handleGoogleSuccess = async (tokenResponse) => {
    try {
      await dispatch(googleLoginUser({ access_token: tokenResponse.access_token })).unwrap();
      navigate('/dashboard', { replace: true });
    } catch (err) {
      console.warn('Google popup error, falling back to redirect:', err);
      window.location.href = googleAuthUrl;
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: handleGoogleSuccess,
    onError: (err) => {
      console.warn('Google OAuth popup blocked or failed, redirecting:', err);
      window.location.href = googleAuthUrl;
    },
  });

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden flex items-center justify-center p-3 sm:p-6 bg-[#FFFBE9] dark:bg-[#000000] text-[#1F150C] dark:text-[#E1DCC9] font-inter relative select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_70%_20%,rgba(173,139,115,0.12),transparent_50%)] pointer-events-none" />

      {/* Main Split Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-5xl h-full max-h-[640px] sm:max-h-[680px] bg-[#FFFBE9] dark:bg-[#16120E] rounded-3xl border border-[#CEAB93]/60 dark:border-[#412D15] shadow-2xl overflow-hidden flex flex-col md:flex-row relative z-10"
      >
        {/* ── LEFT COLUMN: Sign In Form Panel (55% Width) ── */}
        <div className="w-full md:w-[55%] flex flex-col justify-between p-6 sm:p-8 md:p-10 bg-[#FFFBE9] dark:bg-[#16120E] text-[#1F150C] dark:text-[#E1DCC9] overflow-y-auto md:overflow-hidden">
          {/* Top Logo / Mobile Controls */}
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="bg-[#AD8B73] dark:bg-[#1F150C] p-2 rounded-xl border border-[#CEAB93]/50 dark:border-[#412D15] group-hover:scale-105 transition-transform">
                <BookOpen className="h-5 w-5 text-[#FFFBE9] dark:text-[#E1DCC9]" />
              </div>
              <span className="font-playfair text-lg font-bold text-[#1F150C] dark:text-[#E1DCC9]">
                OpenPrep AI
              </span>
            </Link>
            <div className="flex md:hidden items-center gap-2">
              <SoundToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Form Content */}
          <div className="my-auto py-2">
            <div className="mb-6">
              <h1 className="text-2xl sm:text-3xl font-extrabold font-playfair tracking-tight text-[#1F150C] dark:text-[#E1DCC9]">
                Sign in
              </h1>
              <p className="text-[#412D15] dark:text-[#C4BA9D] mt-1.5 text-xs sm:text-sm font-medium leading-relaxed">
                Welcome back! Sign in to access your personalized dashboard. Don't have an account?{' '}
                <Link to="/register" className="font-bold text-[#AD8B73] hover:underline dark:text-[#E1DCC9]">
                  Sign up here
                </Link>
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4 flex items-center gap-2 text-xs text-red-700 dark:text-red-300 font-medium">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div>
                <label htmlFor="login-email" className="block text-xs font-bold text-[#1F150C] dark:text-[#E1DCC9] mb-1">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Provide your email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-[#FFFBE9] dark:bg-[#251D17] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/60 dark:placeholder-[#C4BA9D]/40 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] text-xs sm:text-sm transition-all shadow-sm font-medium"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="login-password" className="block text-xs font-bold text-[#1F150C] dark:text-[#E1DCC9]">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsForgotPasswordOpen(true)}
                    className="text-xs font-semibold text-[#AD8B73] hover:underline dark:text-[#E1DCC9] bg-transparent border-none cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-2.5 bg-[#FFFBE9] dark:bg-[#251D17] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/60 dark:placeholder-[#C4BA9D]/40 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] text-xs sm:text-sm transition-all shadow-sm font-medium"
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

              {/* Submit CTA */}
              <motion.button
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl btn-primary-theme font-bold shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm mt-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="my-4 flex items-center justify-center space-x-2">
              <span className="h-px w-full bg-[#CEAB93]/50 dark:bg-[#412D15]"></span>
              <span className="text-[10px] text-[#8C6A53] dark:text-[#C4BA9D] font-bold tracking-wider uppercase">OR</span>
              <span className="h-px w-full bg-[#CEAB93]/50 dark:bg-[#412D15]"></span>
            </div>

            {/* Google OAuth Button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={() => loginWithGoogle()}
              className="w-full py-2.5 rounded-xl btn-secondary-theme font-bold shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                <path fill="none" d="M1 1h22v22H1z" />
              </svg>
              Continue with Google
            </motion.button>
          </div>

          {/* Legal Terms Footer */}
          <p className="text-center text-[11px] text-[#8C6A53] dark:text-[#C4BA9D]/80 font-medium">
            By signing in you agree to OpenPrep's{' '}
            <a href="#" className="underline font-semibold hover:text-[#1F150C] dark:hover:text-[#E1DCC9]">Privacy Policy</a> and{' '}
            <a href="#" className="underline font-semibold hover:text-[#1F150C] dark:hover:text-[#E1DCC9]">Terms of Service</a>
          </p>
        </div>

        {/* ── RIGHT COLUMN: Hero Visual & Brand Panel (45% Width) ── */}
        <div className="hidden md:flex md:w-[45%] flex-col justify-between p-8 md:p-10 relative overflow-hidden bg-[#0D0A08] text-[#E1DCC9] border-l border-[#CEAB93]/30 dark:border-[#412D15]">
          {/* Abstract Hero Image Background */}
          <img
            src="/assets/abstract_hero.png"
            alt="OpenPrep Abstract Sculpture"
            className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-screen scale-105 -z-0"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0D0A08] via-[#0D0A08]/40 to-[#0D0A08]/70 -z-0" />

          {/* Top Brand Header & Controls */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#AD8B73] dark:bg-[#1F150C] border border-[#CEAB93]/40 dark:border-[#412D15] flex items-center justify-center shadow-lg">
                <BookOpen className="w-4 h-4 text-[#FFFBE9] dark:text-[#E1DCC9]" />
              </div>
              <span className="font-playfair text-xl font-extrabold tracking-wide text-white">
                OpenPrep
              </span>
            </div>
            <div className="flex items-center gap-2">
              <SoundToggle />
              <ThemeToggle />
            </div>
          </div>

          {/* Center Tagline */}
          <div className="relative z-10 my-auto py-6">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h2 className="text-2xl sm:text-3xl font-extrabold font-playfair leading-tight text-white drop-shadow-md">
                Realize the potential of AI-Powered Exam Preparation
              </h2>
              <p className="mt-3 text-xs sm:text-sm text-[#C4BA9D] leading-relaxed font-medium">
                Personalized study schedules, real-time PYQ analytics, interactive flashcards, and instant AI tutoring.
              </p>
            </motion.div>
          </div>

          {/* Bottom Support Footer */}
          <div className="relative z-10 text-xs text-[#C4BA9D]/90">
            <p className="font-medium">Experiencing issues?</p>
            <p className="mt-0.5">
              Get assistance via{' '}
              <a href="mailto:support@openprep.ai" className="underline font-bold text-white hover:text-[#CEAB93] transition">
                support@openprep.ai
              </a>
            </p>
          </div>
        </div>
      </motion.div>
      <ForgotPasswordModal isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
    </div>
  );
};

export default Login;
