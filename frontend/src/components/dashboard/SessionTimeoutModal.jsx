import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { clearSessionExpired } from '../../store/slices/authSlice';

/**
 * SessionTimeoutModal
 *
 * Displayed when the user returns to a background tab and
 * their JWT refreshToken has expired while the tab was inactive.
 * Provides a clean redirect to /login.
 */
const SessionTimeoutModal = ({ isOpen }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Trap focus inside modal when open
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleLogin();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleLogin = () => {
    dispatch(clearSessionExpired());
    navigate('/login', { replace: true });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="session-timeout-title"
      aria-describedby="session-timeout-desc"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
    >
      {/* Backdrop click redirects to login */}
      <div
        className="absolute inset-0"
        onClick={handleLogin}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div className="relative z-10 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-indigo-500/30 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
        {/* Decorative top accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />

        <div className="p-8">
          {/* Icon */}
          <div className="flex justify-center mb-5">
            <div className="relative">
              <div className="w-20 h-20 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-10 h-10 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
              {/* Pulsing ring */}
              <span className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
            </div>
          </div>

          {/* Heading */}
          <h2
            id="session-timeout-title"
            className="text-2xl font-bold text-center text-white mb-2"
          >
            Session Expired
          </h2>

          {/* Description */}
          <p
            id="session-timeout-desc"
            className="text-slate-400 text-sm text-center leading-relaxed mb-6"
          >
            Your session has expired while this tab was inactive. Please log in
            again to continue studying.
          </p>

          {/* Session info badge */}
          <div className="flex items-center gap-2 justify-center mb-6 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4 text-indigo-400 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"
              />
            </svg>
            <span className="text-indigo-300 text-xs font-medium">
              Your work has been saved. Log in to pick up where you left off.
            </span>
          </div>

          {/* Action button */}
          <button
            id="session-timeout-login-btn"
            onClick={handleLogin}
            autoFocus
            className="w-full py-3 px-6 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-xl text-sm shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:shadow-indigo-500/40 hover:-translate-y-0.5 active:translate-y-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          >
            Go to Login
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default SessionTimeoutModal;
