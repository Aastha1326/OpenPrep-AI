import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout, refreshTokenThunk } from '../store/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Clock, RefreshCw, LogOut } from 'lucide-react';

const PRE_EXPIRY_WARNING_SECONDS = 120; // 2 minutes (120 seconds) before JWT expiry

const parseJwtExp = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(jsonPayload);
    return parsed.exp ? parsed.exp * 1000 : null;
  } catch (e) {
    return null;
  }
};

const formatTime = (totalSeconds) => {
  const mins = Math.floor(Math.max(0, totalSeconds) / 60);
  const secs = Math.max(0, totalSeconds) % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

const SessionTimeoutModal = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(PRE_EXPIRY_WARNING_SECONDS);
  const [extending, setExtending] = useState(false);

  const { isAuthenticated, token } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const intervalRef = useRef(null);

  const handleLogout = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowWarning(false);
    dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const handleExtendSession = async () => {
    setExtending(true);
    try {
      const actionResult = await dispatch(refreshTokenThunk());
      if (refreshTokenThunk.fulfilled.match(actionResult)) {
        setShowWarning(false);
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    } finally {
      setExtending(false);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const checkTokenExpiry = () => {
      // Pause modal popup on active live quiz battles
      if (location.pathname.includes('/battle')) {
        return;
      }

      const activeToken = token || localStorage.getItem('token');
      const expMs = parseJwtExp(activeToken);

      if (!expMs) return;

      const remainingSecs = Math.floor((expMs - Date.now()) / 1000);

      if (remainingSecs <= 0) {
        handleLogout();
      } else if (remainingSecs <= PRE_EXPIRY_WARNING_SECONDS) {
        setSecondsLeft(remainingSecs);
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    checkTokenExpiry();
    intervalRef.current = setInterval(checkTokenExpiry, 1000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isAuthenticated, token, location.pathname, handleLogout]);

  if (!showWarning) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-inter">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-[#FFFBE9] dark:bg-[#1f150c] rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-amber-500/40 dark:border-amber-600/40 text-neutral-900 dark:text-neutral-100"
          role="dialog"
          aria-modal="true"
          aria-labelledby="session-warning-title"
        >
          <div className="flex items-center justify-center w-14 h-14 mx-auto bg-amber-500/20 dark:bg-amber-900/40 rounded-full mb-4 ring-8 ring-amber-500/10">
            <AlertTriangle className="w-7 h-7 text-amber-700 dark:text-amber-400" />
          </div>

          <h2
            id="session-warning-title"
            className="text-2xl font-bold text-center mb-2 font-playfair text-amber-900 dark:text-amber-200"
          >
            Session Expiring Soon
          </h2>

          <p className="text-center text-sm text-neutral-600 dark:text-neutral-300 mb-5 leading-relaxed">
            Your login session will expire shortly. Extend your session now to avoid losing your active study progress or quiz score.
          </p>

          {/* Formatted Countdown Badge */}
          <div className="flex items-center justify-center gap-2 mb-6 px-4 py-3 bg-amber-500/15 dark:bg-amber-950/40 border border-amber-600/30 rounded-xl">
            <Clock className="w-5 h-5 text-amber-700 dark:text-amber-400 animate-pulse" />
            <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Time remaining:</span>
            <span className="text-lg font-mono font-bold text-amber-800 dark:text-amber-300 tracking-wider">
              {formatTime(secondsLeft)}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 px-4 py-2.5 bg-neutral-200 dark:bg-neutral-800 hover:bg-neutral-300 dark:hover:bg-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Log Out Now
            </button>

            <button
              type="button"
              onClick={handleExtendSession}
              disabled={extending}
              className="flex-1 px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl font-semibold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {extending ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Extending...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" /> Extend Session
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SessionTimeoutModal;

