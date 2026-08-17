import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import { registerUser, clearError, clearRegistrationSuccess } from '../store/slices/authSlice';
import { useReCaptcha } from '../hooks/useReCaptcha';

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
  const { executeCaptcha } = useReCaptcha();

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await executeCaptcha('register');
    dispatch(registerUser({ ...formData, captchaToken: token }));
  };

  // ── Confirmation screen after successful registration ──
  if (registrationSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-900 via-stone-900 to-stone-950 p-4">
        <div className="w-full max-w-md bg-gradient-to-br from-amber-50 to-amber-100 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-amber-700/50 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-amber-600/20 flex items-center justify-center mx-auto mb-6">
            <Mail className="w-8 h-8 text-amber-700" />
          </div>
          <h1 className="text-2xl font-bold font-playfair text-stone-900 mb-2">Check Your Email</h1>
          <p className="text-stone-600 mb-6 leading-relaxed">{message}</p>
          <div className="bg-amber-600/10 border border-amber-600/20 rounded-sm p-4 mb-6 text-left text-sm text-stone-700">
            <p className="font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              Didn't receive the email?
            </p>
            <ul className="mt-2 list-disc list-inside space-y-1 text-stone-600">
              <li>Check your spam / promotions folder</li>
              <li>Make sure you entered the correct email address</li>
              <li>The link expires in 24 hours</li>
            </ul>
          </div>
          <Link
            to="/login"
            className="inline-block bg-amber-700 hover:bg-amber-800 text-amber-50 font-semibold px-6 py-3 rounded-sm transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ──
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-900 via-stone-900 to-stone-950 p-4">
      <div className="w-full max-w-md bg-gradient-to-br from-amber-50 to-amber-100 rounded-sm shadow-[0_20px_60px_rgba(0,0,0,0.8)] border border-amber-700/50 p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold font-playfair text-stone-900">Create Account</h1>
          <p className="text-stone-600 mt-2 text-sm">Join OpenPrep AI and start your preparation</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-sm p-3 mb-6 flex items-start gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Name */}
          <div>
            <label htmlFor="register-name" className="block text-sm font-semibold text-stone-700 mb-1">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="register-name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Enter your name"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label htmlFor="register-email" className="block text-sm font-semibold text-stone-700 mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="register-email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label htmlFor="register-password" className="block text-sm font-semibold text-stone-700 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                placeholder="Min. 8 chars, upper, lower, number, special"
                className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-300 rounded-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-600 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {/* Real-time password criteria checklist */}
            {formData.password.length > 0 && (
              <ul className="mt-2 space-y-1">
                {PASSWORD_CRITERIA.map((rule, idx) => {
                  const passed = rule.test(formData.password);
                  return (
                    <li key={idx} className={`flex items-center gap-1.5 text-xs ${passed ? 'text-green-700' : 'text-stone-400'}`}>
                      {passed ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-stone-300 shrink-0" />
                      )}
                      {rule.label}
                    </li>
                  );
                })}
              </ul>
            )}
            {formData.password.length === 0 && (
              <p className="text-xs text-stone-500 mt-1">
                Must contain uppercase, lowercase, number, and special character
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            aria-label="Create account"
            className="w-full bg-amber-700 hover:bg-amber-800 disabled:bg-amber-400 text-amber-50 font-semibold py-2.5 rounded-sm transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-amber-200 border-t-transparent rounded-full animate-spin" aria-hidden="true" />
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center space-x-2">
          <span className="h-px w-full bg-stone-300"></span>
          <span className="text-sm text-stone-500 font-medium">OR</span>
          <span className="h-px w-full bg-stone-300"></span>
        </div>

        <div className="mt-6">
          <a
            href="http://localhost:5000/api/auth/google"
            className="w-full flex items-center justify-center gap-2 bg-white border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold py-2.5 rounded-sm transition-colors"
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

        <p className="text-center text-sm text-stone-600 mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-amber-700 hover:text-amber-800 font-semibold">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
