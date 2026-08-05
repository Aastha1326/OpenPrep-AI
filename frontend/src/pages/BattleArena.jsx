import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { socket } from '../services/socket';
import { FaPlay, FaCheck, FaUsers, FaCopy, FaCrown, FaWifi, FaLock, FaUnlock } from 'react-icons/fa';

const MOCK_QUESTIONS = [
  { id: 'q1', text: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'], correct: 'Mitochondria' },
  { id: 'q2', text: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '10,000 km/s'], correct: '300,000 km/s' },
  { id: 'q3', text: 'Who wrote Hamlet?', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'], correct: 'William Shakespeare' },
  { id: 'q4', text: 'What is the chemical symbol for Gold?', options: ['Ag', 'Fe', 'Au', 'Cu'], correct: 'Au' },
  { id: 'q5', text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Saturn', 'Mars'], correct: 'Mars' },
];

const TypingDots = ({ delay = 0 }) => (
  <span className="inline-flex items-center">
    {[0, 1, 2].map((dot) => (
      <span
        key={dot}
        className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce mr-1"
        style={{ animationDelay: `${delay + dot * 150}ms` }}
      />
    ))}
  </span>
);

const ReconnectBanner = ({ connected }) => {
  if (connected) return null;

  return (
    <div className="fixed top-0 inset-x-0 z-50 bg-amber-500/95 backdrop-blur text-slate-900 text-center py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
      <FaWifi className="animate-pulse" />
      Connection lost. Reconnecting to the arena...
    </div>
  );
};

const BattleArena = () => {
  const { user } = useSelector((state) => state.auth);
  const { roomId: routeRoomId } = useParams();

  const [roomId, setRoomId] = useState('');
  const [roomName, setRoomName] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState('waiting');
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [typingPlayers, setTypingPlayers] = useState({});
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [accessError, setAccessError] = useState('');
  const [accessPending, setAccessPending] = useState(false);
  const [pendingRoomId, setPendingRoomId] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const joinedRef = useRef(false);
  const roomIdRef = useRef('');
  const passwordRef = useRef('');
  const roomNameRef = useRef('');
  const typingTimers = useRef({});

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      setIsConnected(true);
      if (joinedRef.current) {
        socket.emit('join-room', {
          roomId: roomIdRef.current,
          username: user?.name || 'Anonymous',
          password: passwordRef.current,
        });
      }
    });

    socket.on('disconnect', () => setIsConnected(false));
    socket.on('connect_error', () => setIsConnected(false));

    socket.on('room_update', (data) => {
      setPlayers(data.players);
      setStatus(data.status);
    });

    socket.on('battle_start', () => {
      setStatus('playing');
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
    });

    socket.on('score_update', (data) => {
      setPlayers(data.players);
    });

    socket.on('presence_update', ({ socketId, online }) => {
      setPlayers((prev) => {
        if (!prev[socketId]) return prev;
        return { ...prev, [socketId]: { ...prev[socketId], online } };
      });

      if (!online) {
        clearTimeout(typingTimers.current[socketId]);
        setTypingPlayers((prev) => {
          const next = { ...prev };
          delete next[socketId];
          return next;
        });
      }
    });

    socket.on('user:typing', ({ socketId, username, isTyping }) => {
      setTypingPlayers((prev) => {
        const next = { ...prev };
        if (isTyping) next[socketId] = { username };
        else delete next[socketId];
        return next;
      });

      clearTimeout(typingTimers.current[socketId]);
      if (isTyping) {
        typingTimers.current[socketId] = setTimeout(() => {
          setTypingPlayers((prev) => {
            const next = { ...prev };
            delete next[socketId];
            return next;
          });
        }, 3000);
      }
    });

    socket.on('user:ready', ({ socketId, username, isReady }) => {
      setPlayers((prev) => ({
        ...prev,
        [socketId]: { ...prev[socketId], username, isReady },
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('room_update');
      socket.off('battle_start');
      socket.off('score_update');
      socket.off('presence_update');
      socket.off('user:typing');
      socket.off('user:ready');
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!routeRoomId) return;

    const normalizedRoomId = routeRoomId.toUpperCase();
    setRoomId(normalizedRoomId);
    setAccessError('');
    setAccessPending(true);
    setPendingRoomId(normalizedRoomId);

    socket.emit('join-room', {
      roomId: normalizedRoomId,
      username: user?.name || 'Anonymous',
      password: '',
    }, (response) => {
      setAccessPending(false);
      if (response?.success) {
        setJoined(true);
        setIsPrivate(Boolean(response.room?.password));
        setInviteLink(`${window.location.origin}/battle/join/${normalizedRoomId}`);
        joinedRef.current = true;
        roomIdRef.current = normalizedRoomId;
        passwordRef.current = '';
        roomNameRef.current = response.room?.name || roomNameRef.current || 'Battle Room';
        setRoomName(roomNameRef.current);
        setPendingRoomId('');
        setAccessError('');
      } else if (response?.requiresPassword) {
        setJoined(false);
        setPendingRoomId(normalizedRoomId);
        setAccessError('Enter the room password to continue.');
      } else {
        setJoined(false);
        setAccessError(response?.message || 'Unable to join this room.');
      }
    });
  }, [routeRoomId, user?.name]);

  const joinRoom = (targetRoomId, { createMode = false, enteredPassword = '' } = {}) => {
    const normalizedRoomId = (targetRoomId || '').trim().toUpperCase();
    if (!normalizedRoomId) return;

    setAccessError('');
    setAccessPending(true);
    setPendingRoomId(normalizedRoomId);

    const payload = {
      roomId: normalizedRoomId,
      roomName: (roomNameRef.current || roomName || 'Battle Room').trim() || 'Battle Room',
      username: user?.name || 'Anonymous',
      password: enteredPassword,
    };

    const eventName = createMode ? 'create-room' : 'join-room';
    socket.emit(eventName, payload, (response) => {
      setAccessPending(false);
      if (response?.success) {
        const nextRoomName = response.room?.name || payload.roomName;
        setRoomId(normalizedRoomId);
        setRoomName(nextRoomName);
        roomIdRef.current = normalizedRoomId;
        passwordRef.current = enteredPassword;
        roomNameRef.current = nextRoomName;
        setIsPrivate(Boolean(response.room?.password));
        setInviteLink(`${window.location.origin}/battle/join/${normalizedRoomId}`);
        joinedRef.current = true;
        setJoined(true);
        setPendingRoomId('');
        setAccessError('');
      } else if (response?.requiresPassword) {
        setJoined(false);
        setPendingRoomId(normalizedRoomId);
        setAccessError('Enter the room password to continue.');
      } else {
        setJoined(false);
        setAccessError(response?.message || 'Unable to join this room.');
      }
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    joinRoom(roomId, { createMode: false, enteredPassword: password });
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    roomNameRef.current = roomName || 'Battle Room';
    joinRoom(newRoomId, { createMode: true, enteredPassword: isPrivate ? password : '' });
  };

  const handlePasswordSubmit = () => {
    joinRoom(pendingRoomId, { createMode: false, enteredPassword: password });
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
  };

  const handleToggleReady = () => {
    const isReady = !players[socket.id]?.isReady;
    socket.emit('toggle_ready', { roomId });
    socket.emit('user:ready', { roomId, isReady });
  };

  const handleAnswerSelect = (option) => {
    if (selectedAnswer) return; // Prevent multiple selections

    setSelectedAnswer(option);

    // Broadcast live "answering" activity to opponents
    socket.emit('user:typing', { roomId, isTyping: true });

    const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correct;
    
    socket.emit('submit_answer', { roomId, isCorrect, points: 10 });
    
    // Move to next question after short delay
    setTimeout(() => {
      socket.emit('user:typing', { roomId, isTyping: false });
      if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setStatus('finished');
      }
    }, 1500);
  };

  if (!joined) {
    const showPasswordPrompt = Boolean(accessPending || pendingRoomId);

    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <ReconnectBanner connected={isConnected} />
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <FaUsers className="text-5xl text-indigo-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Battle Arena</h1>
            <p className="text-slate-400">Join a lobby to battle your friends in real-time!</p>
          </div>

          {showPasswordPrompt ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-4 text-sm text-indigo-200">
                <p className="font-semibold mb-1">Enter Password</p>
                <p className="text-indigo-100/80">This room is private. Enter the password to join.</p>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
              />
              {accessError && <p className="text-sm text-red-400">{accessError}</p>}
              <button
                onClick={handlePasswordSubmit}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors"
              >
                Join Room
              </button>
            </div>
          ) : (
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Room Name</label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => {
                    const nextValue = e.target.value;
                    setRoomName(nextValue);
                    roomNameRef.current = nextValue;
                  }}
                  placeholder="My Battle Room"
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2">
                <label className="text-sm font-medium text-slate-300">Private Room</label>
                <input
                  type="checkbox"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-indigo-500 focus:ring-indigo-500"
                />
              </div>
              {isPrivate && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter room password"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              )}
              <form onSubmit={handleJoin} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Room Code</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest text-center text-lg font-mono"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center"
                >
                  Join Lobby <FaPlay className="ml-2 text-sm" />
                </button>
              </form>
            </div>
          )}

          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-slate-600"></div>
            <span className="flex-shrink-0 mx-4 text-slate-500 text-sm font-medium">OR</span>
            <div className="flex-grow border-t border-slate-600"></div>
          </div>

          <button
            onClick={handleCreateRoom}
            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-lg border border-slate-500 transition-colors"
          >
            Create New Lobby
          </button>
        </div>
      </div>
    );
  }

  if (status === 'waiting') {
    const isReady = players[socket.id]?.isReady;
    const onlineCount = Object.values(players).filter((p) => p.online !== false).length;
    
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12">
        <ReconnectBanner connected={isConnected} />
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <h1 className="text-2xl font-bold">Lobby: <span className="text-indigo-400 font-mono tracking-wider">{roomId}</span></h1>
                {isPrivate ? <FaLock className="text-amber-400" /> : <FaUnlock className="text-emerald-400" />}
              </div>
              <p className="text-slate-400 text-sm flex items-center flex-wrap gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
                Waiting for players to get ready... <span className="text-emerald-400 font-medium">{onlineCount} online</span>
              </p>
              <p className="text-slate-500 text-sm mt-1">{roomName || 'Battle Room'}</p>
            </div>
            <div className="flex flex-col md:flex-row gap-2 mt-4 md:mt-0">
              <button
                onClick={() => navigator.clipboard.writeText(roomId)}
                className="flex items-center text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
              >
                <FaCopy className="mr-2" /> Copy Code
              </button>
              {inviteLink && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center text-sm bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
                >
                  <FaCopy className="mr-2" /> Copy Invite
                </button>
              )}
            </div>
          </div>

          {inviteLink && (
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg mb-6">
              <p className="text-sm font-semibold text-slate-300 mb-2">Invite Link</p>
              <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                <span className="text-sm text-indigo-300 break-all">{inviteLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-2 rounded-lg transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center border-b border-slate-700 pb-3">
                <FaUsers className="mr-2 text-indigo-400" /> Players ({Object.keys(players).length})
              </h2>
              <div className="space-y-3">
                {Object.entries(players).map(([id, player]) => (
                  <div key={id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <span className="font-medium flex items-center">
                      <span className={`w-2.5 h-2.5 rounded-full mr-2 animate-pulse ${player.online === false ? 'bg-slate-500' : 'bg-emerald-400'}`} />
                      {player.username} {id === socket.id && <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">You</span>}
                    </span>
                    <span className="flex items-center gap-3">
                      <span className={`text-xs font-medium ${player.online === false ? 'text-slate-500' : 'text-emerald-400'}`}>
                        {player.online === false ? 'Offline' : 'Online'}
                      </span>
                      {player.isReady ? (
                        <span className="text-emerald-400 text-sm font-medium flex items-center"><FaCheck className="mr-1" /> Ready</span>
                      ) : (
                        <span className="text-slate-400 text-sm">Not Ready</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center justify-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <div className="text-center mb-8">
                <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-4 transition-colors ${isReady ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'}`}>
                  {isReady ? <FaCheck className="text-3xl" /> : <FaPlay className="text-3xl" />}
                </div>
                <h3 className="text-lg font-medium text-slate-300">
                  {isReady ? "You're ready! Waiting for others..." : "Ready to battle?"}
                </h3>
              </div>
              <button
                onClick={handleToggleReady}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
                  isReady 
                    ? 'bg-slate-600 hover:bg-slate-500 text-white' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20'
                }`}
              >
                {isReady ? 'Cancel Ready' : 'I am Ready!'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calculate sorted leaderboard
  const leaderboard = Object.entries(players)
    .map(([id, player]) => ({ id, ...player }))
    .sort((a, b) => b.score - a.score);

  if (status === 'finished') {
    const winner = leaderboard[0];
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12 flex flex-col items-center justify-center">
        <ReconnectBanner connected={isConnected} />
        <div className="bg-slate-800 p-10 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-2xl text-center">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-500/20 rounded-full mb-6">
            <FaCrown className="text-5xl text-yellow-400" />
          </div>
          <h1 className="text-4xl font-bold mb-2">Battle Finished!</h1>
          <p className="text-slate-400 text-lg mb-8">Winner: <span className="text-yellow-400 font-bold">{winner?.username}</span></p>

          <div className="bg-slate-900 rounded-xl overflow-hidden mb-8">
            {leaderboard.map((player, index) => (
              <div key={player.id} className={`flex justify-between items-center p-4 border-b border-slate-800 ${player.id === socket.id ? 'bg-indigo-900/30' : ''}`}>
                <div className="flex items-center">
                  <span className={`w-8 font-bold ${index === 0 ? 'text-yellow-400' : 'text-slate-500'}`}>#{index + 1}</span>
                  <span className="font-medium text-lg">{player.username} {player.id === socket.id && '(You)'}</span>
                </div>
                <span className="font-bold text-xl text-emerald-400">{player.score} pts</span>
              </div>
            ))}
          </div>

          <button
            onClick={() => window.location.reload()}
            className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors"
          >
            Leave Arena
          </button>
        </div>
      </div>
    );
  }

  // PLAYING STATUS
  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
  const activeTypers = Object.entries(typingPlayers).filter(([id]) => id !== socket.id);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
      <ReconnectBanner connected={isConnected} />
      {/* Top Bar / Leaderboard */}
      <div className="bg-slate-800 border-b border-slate-700 p-4 sticky top-0 z-10 flex overflow-x-auto gap-4 scrollbar-hide items-center px-6">
        <span className="text-slate-400 font-medium mr-4 flex-shrink-0">Live Scores:</span>
        {leaderboard.map((player) => (
          <div key={player.id} className="flex items-center bg-slate-900 px-4 py-2 rounded-full border border-slate-700 flex-shrink-0">
            <span className="font-medium text-sm mr-2">{player.username}</span>
            <span className="text-emerald-400 font-bold">{player.score}</span>
          </div>
        ))}
      </div>

      {/* Live typing / answering indicator */}
      {activeTypers.length > 0 && (
        <div className="bg-slate-800/80 border-b border-slate-700 px-6 py-2 text-center">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1">
            {activeTypers.map(([id, { username }], idx) => (
              <div key={id} className="text-indigo-300 text-sm font-medium flex items-center">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse mr-2" />
                {username} is typing <TypingDots delay={idx * 200} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Battle Area */}
      <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl">
          <div className="flex justify-between text-sm font-medium text-indigo-400 mb-4">
            <span>Question {currentQuestionIndex + 1} of {MOCK_QUESTIONS.length}</span>
            <span>Speed matters!</span>
          </div>
          
          <div className="bg-slate-800 rounded-2xl p-8 md:p-10 shadow-2xl border border-slate-700 mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-8 leading-tight text-center">
              {currentQuestion.text}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, idx) => {
                let btnClass = "p-5 rounded-xl border-2 text-lg font-medium transition-all duration-200 text-left relative overflow-hidden ";
                
                if (!selectedAnswer) {
                  btnClass += "bg-slate-700/50 border-slate-600 hover:border-indigo-500 hover:bg-slate-700";
                } else if (option === currentQuestion.correct) {
                  btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                } else if (option === selectedAnswer) {
                  btnClass += "bg-red-500/20 border-red-500 text-red-300";
                } else {
                  btnClass += "bg-slate-800 border-slate-700 text-slate-500 opacity-50";
                }

                return (
                  <button
                    key={idx}
                    disabled={!!selectedAnswer}
                    onClick={() => handleAnswerSelect(option)}
                    className={btnClass}
                  >
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleArena;