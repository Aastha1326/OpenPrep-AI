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
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState('');

  const { isAuthenticated } = useSelector((state) => state.auth || {});
  const interviewState = useSelector((state) => state.interview || {});
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const lastActivityRef = useRef(Date.now());
  const timerIntervalRef = useRef(null);
  const autoSavedRef = useRef(false);

  const resetIdleTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    setRemainingSeconds(IDLE_TIMEOUT_SECONDS);
    autoSavedRef.current = false;
    setSaveSuccessMessage('');
  }, []);

  // Listen to user interaction events to reset idle timer when warning modal is NOT open
  useEffect(() => {
    if (!isAuthenticated || showWarningModal) return;

    const handleUserActivity = () => {
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

  /**
   * Serializes current application state and posts to POST /session/save
   */
  const saveCurrentState = useCallback(
    async (reason = 'AUTO_SAVE_PRE_EXPIRY') => {
      setIsSaving(true);
      try {
        // Collect in-progress quiz progress from localStorage
        const activeQuizProgress = {};
        Object.keys(localStorage).forEach((key) => {
          if (key.startsWith('quiz_progress_')) {
            try {
              activeQuizProgress[key] = JSON.parse(localStorage.getItem(key));
            } catch (e) {}
          }
        });

        // Construct serializable state payload
        const payload = {
          currentRoute: location?.pathname || '/',
          quizProgress: activeQuizProgress,
          interviewState: {
            roomId: interviewState.roomId,
            role: interviewState.role,
            code: interviewState.code,
            language: interviewState.language,
          },
          savedAt: new Date().toISOString(),
          reason,
        };

        const res = await API.post('/session/save', {
          payload,
          reason,
        });

        if (res.data?.success) {
          setSaveSuccessMessage('Session state saved!');
        }
        return true;
      } catch (err) {
        console.warn('Failed to save session state:', err.message);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [location?.pathname, interviewState]
  );

  const autoSaveNow = useCallback(async () => {
    await saveCurrentState('USER_CLICKED_SAVE_NOW');
  }, [saveCurrentState]);

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
      await saveCurrentState('USER_CLICKED_SAVE_EXIT');
    } catch (e) {
      console.error('Error saving progress on exit:', e);
    } finally {
      handleLogout();
    }
  }, [saveCurrentState, handleLogout]);

  // Main countdown timer interval
  useEffect(() => {
    if (!isAuthenticated) {
      setShowWarningModal(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      return;
    }

    const tick = async () => {
      if (location?.pathname?.includes('/battle')) {
        return;
      }

      const elapsedSecs = Math.floor((Date.now() - lastActivityRef.current) / 1000);
      const remaining = Math.max(0, IDLE_TIMEOUT_SECONDS - elapsedSecs);

      setRemainingSeconds(remaining);

      if (remaining <= 0) {
        if (!autoSavedRef.current) {
          autoSavedRef.current = true;
          await saveCurrentState('AUTO_SAVE_COUNTDOWN_EXPIRED');
        }
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
  }, [isAuthenticated, location?.pathname, saveCurrentState, handleLogout]);

  return (
    <SessionTimerContext.Provider
      value={{
        remainingSeconds,
        showWarningModal,
        setShowWarningModal,
        isExtending,
        isSaving,
        saveSuccessMessage,
        resetIdleTimer,
        extendSession,
        saveCurrentState,
        autoSaveNow,
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
      isSaving: false,
      saveSuccessMessage: '',
      resetIdleTimer: () => {},
      extendSession: async () => {},
      saveCurrentState: async () => {},
      autoSaveNow: async () => {},
      saveAndExit: async () => {},
      handleLogout: () => {},
    };
  }
  return context;
};

export default SessionTimerContext;
