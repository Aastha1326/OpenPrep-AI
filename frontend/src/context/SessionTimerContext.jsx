import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../services/api';
import { logout, refreshTokenThunk } from '../store/slices/authSlice';

const SessionTimerContext = createContext(null);

const IDLE_TIMEOUT_SECONDS = 15 * 60; // 15 minutes total idle timeout
const PRE_EXPIRY_WARNING_SECONDS = 120; // 2 minutes (120 seconds) warning threshold

export const SessionTimerProvider = ({ children }) => {
  const [remainingSeconds, setRemainingSeconds] = useState(IDLE_TIMEOUT_SECONDS);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isExtending, setIsExtending] = useState(false);

  const { isAuthenticated, token } = useSelector((state) => state.auth || {});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const lastActivityRef = useRef(Date.now());
  const timerIntervalRef = useRef(null);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingSeconds(IDLE_TIMEOUT_SECONDS);
  }, []);

  // Listen to user interaction events to reset idle timer when warning modal is NOT open
  useEffect(() => {
    if (!isAuthenticated || showWarningModal) return;

    const handleUserActivity = () => {
      // Only reset if active tab is in focus and not displaying warning modal
      if (!showWarningModal) {
        lastActivityRef.current = Date.now();
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((evt) => window.addEventListener(evt, handleUserActivity, { passive: true }));

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleUserActivity));
    };
  }, [isAuthenticated, showWarningModal]);

  const handleLogout = useCallback(() => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    setShowWarningModal(false);
    if (dispatch) dispatch(logout());
    if (navigate) navigate('/login');
  }, [dispatch, navigate]);

  const extendSession = useCallback(async () => {
    setIsExtending(true);
    try {
      let success = false;
      try {
        const response = await API.post('/session/keepalive');
        if (response.data?.success) {
          success = true;
          if (response.data.token) {
            localStorage.setItem('token', response.data.token);
          }
        }
      } catch (apiErr) {
        // Fallback to refresh token thunk if keepalive route falls back
        if (dispatch) {
          const actionResult = await dispatch(refreshTokenThunk());
          if (refreshTokenThunk.fulfilled.match(actionResult)) {
            success = true;
          }
        }
      }

      if (success) {
        resetIdleTimer();
        setShowWarningModal(false);
      } else {
        handleLogout();
      }
    } catch (err) {
      handleLogout();
    } finally {
      setIsExtending(false);
    }
  }, [dispatch, resetIdleTimer, handleLogout]);

  const saveAndExit = useCallback(async () => {
    try {
      // Save all in-progress quiz sessions to localStorage/backup
      const activeProgressKeys = Object.keys(localStorage).filter((k) => k.startsWith('quiz_progress_'));
      for (const key of activeProgressKeys) {
        try {
          const raw = localStorage.getItem(key);
          if (raw) {
            const data = JSON.parse(raw);
            await API.post(`/quizzes/${data.quizId}/submit`, {
              answers: Object.entries(data.answers || {}).map(([qId, val]) => ({
                questionId: qId,
                selectedAnswer: val,
              })),
            }).catch(() => {});
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error('Error saving progress on exit:', e);
    } finally {
      handleLogout();
    }
  }, [handleLogout]);

  // Main countdown timer interval
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarningModal(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const tick = () => {
      // Pause modal popup on active battle arenas
      if (location?.pathname?.includes('/battle')) {
        return;
      }

      const elapsedSecs = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, IDLE_TIMEOUT_SECONDS - elapsedSecs);

      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        handleLogout();
      } else if (remaining <= PRE_EXPIRY_WARNING_SECONDS) {
        setShowWarningModal(true);
      } else {
        setShowWarningModal(false);
      }
    };

    tick();
    timerIntervalRef.current = setInterval(tick, 1000);

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isAuthenticated, location?.pathname, handleLogout]);

  return (
    <SessionTimerContext.Provider
      value={{
        remainingSeconds,
        showWarningModal,
        setShowWarningModal,
        isExtending,
        resetIdleTimer,
        extendSession,
        saveAndExit,
        handleLogout,
      }}
    >
      {children}
    </SessionTimerContext.Provider>
  );
};

export const useSessionTimer = () => {
  const context = useContext(SessionTimerContext);
  if (!context) {
    return {
      remainingSeconds: IDLE_TIMEOUT_SECONDS,
      showWarningModal: false,
      isExtending: false,
      resetIdleTimer: () => {},
      extendSession: async () => {},
      saveAndExit: async () => {},
      handleLogout: () => {},
    };
  }
  return context;
};

export default SessionTimerContext;
