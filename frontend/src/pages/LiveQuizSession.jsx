import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { socket, connectSocket } from '../services/socket';
import RoomJoin from '../components/quiz/RoomJoin';
import LiveQuiz from '../components/quiz/LiveQuiz';
import { Sparkles, ShieldAlert, Users } from 'lucide-react';

export default function LiveQuizSession() {
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const currentUserId = user?.id || user?._id || 'anonymous-user';

  const [phase, setPhase] = useState('lobby'); // 'lobby' | 'live'
  const [roomState, setRoomState] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionResult, setQuestionResult] = useState(null);
  const [quizEndedData, setQuizEndedData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    connectSocket();

    const handleRoomUpdate = (data) => {
      setRoomState(data);
      if (data.status === 'in_progress') {
        setPhase('live');
      }
    };

    const handleQuizStarted = () => {
      setPhase('live');
      setQuizEndedData(null);
    };

    const handleQuestion = (qData) => {
      setPhase('live');
      setCurrentQuestion(qData);
      setQuestionResult(null);
    };

    const handleQuestionResult = (rData) => {
      setQuestionResult(rData);
    };

    const handleScore = (scoreData) => {
      if (scoreData?.scores) {
        setRoomState((prev) => (prev ? { ...prev, participants: scoreData.scores } : prev));
      }
    };

    const handleQuizEnded = (endData) => {
      setQuizEndedData(endData);
    };

    const handleError = (err) => {
      setErrorMsg(err.message || 'Socket error encountered.');
      setIsConnecting(false);
    };

    socket.on('room_update', handleRoomUpdate);
    socket.on('quiz_started', handleQuizStarted);
    socket.on('question', handleQuestion);
    socket.on('question_result', handleQuestionResult);
    socket.on('score', handleScore);
    socket.on('quiz_ended', handleQuizEnded);
    socket.on('error', handleError);

    if (urlRoomId) {
      handleJoinRoom(urlRoomId);
    }

    return () => {
      socket.off('room_update', handleRoomUpdate);
      socket.off('quiz_started', handleQuizStarted);
      socket.off('question', handleQuestion);
      socket.off('question_result', handleQuestionResult);
      socket.off('score', handleScore);
      socket.off('quiz_ended', handleQuizEnded);
      socket.off('error', handleError);
    };
  }, [urlRoomId]);

  const handleCreateRoom = (options = {}) => {
    setIsConnecting(true);
    setErrorMsg('');

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('create_room', options, (response) => {
      setIsConnecting(false);
      if (response?.success) {
        setRoomState((prev) => ({
          ...prev,
          roomId: response.roomId,
          status: response.status,
          hostUserId: response.hostUserId,
        }));
      } else {
        setErrorMsg(response?.message || 'Failed to create quiz room.');
      }
    });
  };

  const handleJoinRoom = (code) => {
    setIsConnecting(true);
    setErrorMsg('');

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('join_room', { roomId: code }, (response) => {
      setIsConnecting(false);
      if (response?.success) {
        setRoomState((prev) => ({
          ...prev,
          roomId: response.roomId,
          status: response.status,
        }));
        if (response.status === 'in_progress') {
          setPhase('live');
        }
      } else {
        setErrorMsg(response?.message || 'Failed to join quiz room.');
      }
    });
  };

  const handleStartQuiz = () => {
    if (roomState?.roomId) {
      socket.emit('start_quiz', { roomId: roomState.roomId });
    }
  };

  const handleLeaveRoom = () => {
    if (roomState?.roomId) {
      socket.emit('leave_room', { roomId: roomState.roomId });
    }
    setPhase('lobby');
    setRoomState(null);
    setCurrentQuestion(null);
    setQuestionResult(null);
    setQuizEndedData(null);
    navigate('/quiz/live');
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      {errorMsg && (
        <div className="max-w-xl mx-auto mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg('')}
            className="text-xs uppercase font-bold px-2 py-1 rounded bg-rose-500/20 text-rose-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {phase === 'lobby' ? (
        <RoomJoin
          onCreateRoom={handleCreateRoom}
          onJoinRoom={handleJoinRoom}
          onStartQuiz={handleStartQuiz}
          roomState={roomState}
          currentUserId={currentUserId}
          isConnecting={isConnecting}
        />
      ) : (
        <LiveQuiz
          socket={socket}
          roomId={roomState?.roomId}
          currentUserId={currentUserId}
          currentQuestion={currentQuestion}
          questionResult={questionResult}
          roomState={roomState}
          quizEndedData={quizEndedData}
          onLeaveRoom={handleLeaveRoom}
        />
      )}
    </div>
  );
}
