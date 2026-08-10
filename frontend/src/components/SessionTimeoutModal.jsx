import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { logout } from '../store/slices/authSlice';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

const IDLE_TIMEOUT = 15 * 60 * 1000; // 15 minutes
const WARNING_DURATION = 60 * 1000; // 1 minute

const SessionTimeoutModal = () => {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION / 1000);
  const { isAuthenticated } = useSelector((state) => state.auth);
  
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const idleTimerRef = useRef(null);
  const warningTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearAllTimers = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    if (warningTimerRef.current) clearTimeout(warningTimerRef.current);
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
  }, []);

  const handleLogout = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    dispatch(logout());
    navigate('/login');
  }, [clearAllTimers, dispatch, navigate]);

  const startIdleTimer = useCallback(() => {
    clearAllTimers();
    setShowWarning(false);
    setCountdown(WARNING_DURATION / 1000);

    // Pause timer if on active live battle routes
    if (location.pathname.includes('/battle')) {
      return;
    }

    idleTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      
      // Start warning countdown
      warningTimerRef.current = setTimeout(() => {
        handleLogout();
      }, WARNING_DURATION);

      countdownIntervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, IDLE_TIMEOUT);
  }, [clearAllTimers, handleLogout, location.pathname]);

  useEffect(() => {
    if (!isAuthenticated) {
      clearAllTimers();
      return;
    }

    startIdleTimer();

    const handleActivity = () => {
      if (!showWarning) {
        startIdleTimer();
      }
    };

    // Standard DOM events
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    events.forEach((event) => {
      window.addEventListener(event, handleActivity);
    });

    // Custom WebSocket activity event dispatcher
    window.addEventListener('ws-activity', handleActivity);

    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, handleActivity);
      });
      window.removeEventListener('ws-activity', handleActivity);
      clearAllTimers();
    };
  }, [isAuthenticated, startIdleTimer, showWarning, clearAllTimers]);

  const stayLoggedIn = () => {
    startIdleTimer();
  };

  if (!showWarning) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white dark:bg-neutral-900 rounded-lg shadow-2xl max-w-md w-full p-6 border border-neutral-200 dark:border-neutral-800"
        >
          <div className="flex items-center justify-center w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full mb-4">
            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-500" />
          </div>
          
          <h2 className="text-xl font-bold text-center text-neutral-900 dark:text-neutral-100 mb-2 font-playfair">
            Session Expiring Soon
          </h2>
          
          <p className="text-center text-neutral-600 dark:text-neutral-400 mb-6 font-inter">
            You've been idle for a while. For your security, you will be logged out in{' '}
            <span className="font-bold text-amber-600 dark:text-amber-500">{countdown} seconds</span>.
          </p>
          
          <div className="flex gap-3">
            <button
              onClick={handleLogout}
              className="flex-1 px-4 py-2 bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded font-inter font-medium transition-colors"
            >
              Log Out Now
            </button>
            <button
              onClick={stayLoggedIn}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-inter font-medium transition-colors shadow-lg shadow-amber-600/20"
            >
              Stay Logged In
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default SessionTimeoutModal;
