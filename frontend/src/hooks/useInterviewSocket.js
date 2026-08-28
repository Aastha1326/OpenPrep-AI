import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { io } from 'socket.io-client';
import {
  setRoomStateSync,
  updateCode,
  updateLanguage,
  setCodeOutput,
  setIsExecuting,
  addParticipant,
  removeParticipant,
  updateRemoteCursor,
  addChatMessage,
  setInterviewError,
  resetInterviewRoom,
} from '../store/slices/interviewSlice';

/**
 * Custom React Hook connecting Monaco Editor & Interview Room UI to Socket.io.
 */
export function useInterviewSocket({ roomId, role, user }) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const { code, language } = useSelector((state) => state.interview);

  useEffect(() => {
    if (!roomId) return;

    // Use environment socket URL or fallback to origin / window location
    const backendUrl = import.meta.env.VITE_API_URL
      ? import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '')
      : window.location.origin;

    const token = localStorage.getItem('token') || '';

    // Initialize socket connection on /interview namespace
    const socket = io(`${backendUrl}/interview`, {
      transports: ['websocket', 'polling'],
      auth: { token },
      autoConnect: true,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('interview:join_room', {
        roomId,
        role: role || 'candidate',
        user: user || { name: role === 'interviewer' ? 'Interviewer' : 'Candidate' },
      });
    });

    // Room Sync
    socket.on('interview:room_state_sync', (data) => {
      dispatch(setRoomStateSync(data));
    });

    // Code changes from peers
    socket.on('interview:code_changed', ({ code: newCode }) => {
      dispatch(updateCode(newCode));
    });

    // Cursor movement from peers
    socket.on('interview:cursor_moved', (cursorData) => {
      dispatch(updateRemoteCursor(cursorData));
    });

    // Language change
    socket.on('interview:language_changed', ({ language: newLang }) => {
      dispatch(updateLanguage(newLang));
    });

    // Code execution state
    socket.on('interview:code_executing', () => {
      dispatch(setIsExecuting(true));
    });

    socket.on('interview:code_output', ({ output }) => {
      dispatch(setCodeOutput(output));
    });

    // Chat messages
    socket.on('interview:chat_message_received', (msg) => {
      dispatch(addChatMessage(msg));
    });

    // Participants lifecycle
    socket.on('interview:participant_joined', (payload) => {
      dispatch(addParticipant(payload));
    });

    socket.on('interview:participant_left', (payload) => {
      dispatch(removeParticipant(payload));
    });

    // Errors
    socket.on('interview:error', ({ message }) => {
      dispatch(setInterviewError(message));
    });

    return () => {
      if (socket) {
        socket.emit('interview:leave_room');
        socket.disconnect();
      }
      dispatch(resetInterviewRoom());
    };
  }, [roomId, role, dispatch]);

  // Emission helpers
  const sendCodeChange = useCallback(
    (newCode) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('interview:code_change', { roomId, code: newCode });
      }
      dispatch(updateCode(newCode));
    },
    [roomId, dispatch]
  );

  const sendCursorMove = useCallback(
    (position, selection) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('interview:cursor_move', { roomId, position, selection });
      }
    },
    [roomId]
  );

  const sendLanguageChange = useCallback(
    (newLang) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('interview:language_change', { roomId, language: newLang });
      }
      dispatch(updateLanguage(newLang));
    },
    [roomId, dispatch]
  );

  const runCode = useCallback(
    (customCode, stdin) => {
      const codeToRun = customCode !== undefined ? customCode : code;
      dispatch(setIsExecuting(true));
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('interview:run_code', {
          roomId,
          code: codeToRun,
          language,
          stdin,
        });
      }
    },
    [roomId, code, language, dispatch]
  );

  const sendChatMessage = useCallback(
    (text) => {
      if (socketRef.current && socketRef.current.connected && text.trim()) {
        socketRef.current.emit('interview:chat_message', { roomId, text });
      }
    },
    [roomId]
  );

  const sendWebRTCSignal = useCallback(
    (signal, targetSocketId) => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('interview:webrtc_signal', { roomId, targetSocketId, signal });
      }
    },
    [roomId]
  );

  return {
    sendCodeChange,
    sendCursorMove,
    sendLanguageChange,
    runCode,
    sendChatMessage,
    sendWebRTCSignal,
    socket: socketRef.current,
  };
}
