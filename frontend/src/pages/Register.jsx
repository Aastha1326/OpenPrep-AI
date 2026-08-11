import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';
import { registerUser, clearError, clearRegistrationSuccess } from '../store/slices/authSlice';
import ThemeToggle from '../components/ThemeToggle';
import SoundToggle from '../components/SoundToggle';

// Password validation criteria (synced with backend validators.js)
const PASSWORD_CRITERIA = [
  { label: 'At least 8 characters', test: (pw) => pw.length >= 8 },
  { label: 'One uppercase letter (A-Z)', test: (pw) => /[A-Z]/.test(pw) },
  { label: 'One lowercase letter (a-z)', test: (pw) => /[a-z]/.test(pw) },
  { label: 'One number (0-9)', test: (pw) => /[0-9]/.test(pw) },
  { label: 'One special character (!@#$%^&* etc.)', test: (pw) => /[^A-Za-z0-9]/.test(pw) },
];

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error, registrationSuccess, message, isAuthenticated } = useSelector((state) => state.auth);

  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard', { replace: true });
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    return () => { dispatch(clearError()); dispatch(clearRegistrationSuccess()); };
  }, [dispatch]);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(registerUser(formData));
  };

  // ── Confirmation screen after successful registration ──
  if (registrationSuccess) {
    return (
      <div className="min-h-screen flex flex-col justify-between bg-[#FFFBE9] dark:bg-[#000000] text-[#1F150C] dark:text-[#E1DCC9] p-4 sm:p-6 transition-colors duration-300 font-inter relative overflow-hidden">
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

        <div className="w-full max-w-md mx-auto my-auto bg-[#E3CAA5]/60 dark:bg-[#1F150C] rounded-2xl border border-[#CEAB93] dark:border-[#412D15] shadow-2xl p-6 sm:p-8 text-center transition-colors duration-300">
          <div className="w-16 h-16 rounded-full bg-[#AD8B73]/20 dark:bg-[#412D15] flex items-center justify-center mx-auto mb-6 border border-[#CEAB93] dark:border-[#412D15]">
            <Mail className="w-8 h-8 text-[#AD8B73] dark:text-[#E1DCC9]" />
          </div>
          <h1 className="text-2xl font-extrabold font-playfair text-[#1F150C] dark:text-[#E1DCC9] mb-2">Check Your Email</h1>
          <p className="text-[#412D15] dark:text-[#C4BA9D] mb-6 leading-relaxed text-sm font-medium">{message}</p>
          <div className="bg-[#E3CAA5]/40 dark:bg-[#2C1E16] border border-[#CEAB93] dark:border-[#412D15] rounded-xl p-4 mb-6 text-left text-sm text-[#1F150C] dark:text-[#E1DCC9]">
            <p className="font-bold flex items-center gap-2 text-[#AD8B73] dark:text-[#E1DCC9]">
              <AlertCircle className="w-4 h-4" />
              Didn't receive the email?
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-xs text-[#412D15] dark:text-[#C4BA9D]">
              <li>Check your spam / promotions folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>The link expires in 24 hours</li>
            </ul>
          </div>
          <Link
            to="/login"
            className="w-full py-3.5 rounded-xl btn-primary-theme font-bold shadow-lg hover:shadow-xl transition-all inline-block text-sm"
          >
            Go to Login
          </Link>
        </div>

        <div className="text-center text-xs text-[#8C6A53] dark:text-[#C4BA9D] py-2">
          © {new Date().getFullYear()} OpenPrep AI. All rights reserved.
        </div>
      </div>
    );
  }

  // ── Registration form ──
  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#FFFBE9] dark:bg-[#000000] text-[#1F150C] dark:text-[#E1DCC9] p-4 sm:p-6 transition-colors duration-300 font-inter relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#AD8B73]/10 dark:bg-[#412D15]/30 rounded-full blur-3xl -z-10 animate-pulse-glow" />

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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold font-playfair text-[#1F150C] dark:text-[#E1DCC9]">Create Account</h1>
          <p className="text-[#412D15] dark:text-[#C4BA9D] mt-2 text-sm font-medium">Join OpenPrep AI and start your preparation</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3.5 mb-6 flex items-start gap-2.5 text-sm text-red-700 dark:text-red-300 font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="register-name" className="block text-xs font-bold uppercase tracking-wider text-[#1F150C] dark:text-[#E1DCC9] mb-1.5">Full Name</label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
              <input
                id="register-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-3 bg-[#FFFBE9] dark:bg-[#2C1E16] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/70 dark:placeholder-[#C4BA9D]/50 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] focus:border-transparent text-sm transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="register-email" className="block text-xs font-bold uppercase tracking-wider text-[#1F150C] dark:text-[#E1DCC9] mb-1.5">Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
              <input
                id="register-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-[#FFFBE9] dark:bg-[#2C1E16] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/70 dark:placeholder-[#C4BA9D]/50 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] focus:border-transparent text-sm transition-all shadow-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="register-password" className="block text-xs font-bold uppercase tracking-wider text-[#1F150C] dark:text-[#E1DCC9] mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8C6A53] dark:text-[#C4BA9D]" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Min. 8 chars, upper, lower, number, special"
                className="w-full pl-10 pr-10 py-3 bg-[#FFFBE9] dark:bg-[#2C1E16] border border-[#CEAB93] dark:border-[#412D15] rounded-xl text-[#1F150C] dark:text-[#E1DCC9] placeholder-[#8C6A53]/70 dark:placeholder-[#C4BA9D]/50 focus:outline-none focus:ring-2 focus:ring-[#AD8B73] dark:focus:ring-[#E1DCC9] focus:border-transparent text-sm transition-all shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C6A53] hover:text-[#1F150C] dark:text-[#C4BA9D] dark:hover:text-[#E1DCC9] transition"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Real-time password criteria checklist */}
            {formData.password.length > 0 && (
              <ul className="mt-2 space-y-1 bg-[#FFFBE9]/60 dark:bg-[#2C1E16]/60 p-2.5 rounded-xl border border-[#CEAB93]/50 dark:border-[#412D15]">
                {PASSWORD_CRITERIA.map((rule, idx) => {
                  const passed = rule.test(formData.password);
                  return (
                    <li key={idx} className={`flex items-center gap-1.5 text-xs font-medium ${passed ? 'text-emerald-700 dark:text-emerald-400' : 'text-[#8C6A53] dark:text-[#C4BA9D]'}`}>
                      {passed ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-[#CEAB93] dark:border-[#412D15] shrink-0" />
                      )}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            aria-label="Create account"
            className="w-full py-3.5 rounded-xl btn-primary-theme font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex items-center justify-center gap-2 text-sm"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-2">
          <span className="h-px w-full bg-[#CEAB93]/60 dark:bg-[#412D15]"></span>
          <span className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] font-bold tracking-wider">OR</span>
          <span className="h-px w-full bg-[#CEAB93]/60 dark:bg-[#412D15]"></span>
        </div>

        <div className="mt-6">
          <a
            href="http://localhost:5000/api/auth/google"
            className="w-full py-3 rounded-xl btn-secondary-theme font-bold shadow-sm hover:shadow transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              <path fill="none" d="M1 1h22v22H1z" />
            </svg>
            Continue with Google
          </a>
        </div>

        <p className="text-center text-sm text-[#412D15] dark:text-[#C4BA9D] mt-6 font-medium">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-[#AD8B73] hover:text-[#1F150C] dark:text-[#E1DCC9] dark:hover:text-[#FFFBE9] transition">
            Sign In
          </Link>
        </p>
      </div>

      {/* Footer copyright */}
      <div className="text-center text-xs text-[#8C6A53] dark:text-[#C4BA9D] py-2">
        © {new Date().getFullYear()} OpenPrep AI. All rights reserved.
      </div>
    </div>
  );
};

export default Register;
