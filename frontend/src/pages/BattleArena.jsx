import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { socket, connectSocket } from '../services/socket';
import API from '../services/api';
import {
  FaPlay,
  FaCheck,
  FaUsers,
  FaCopy,
  FaCrown,
  FaWifi,
  FaLock,
  FaUnlock,
  FaClock,
  FaTrophy,
  FaUserShield,
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { triggerConfetti } from '../utils/confetti';

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
    <div className="fixed top-0 inset-x-0 z-50 bg-rose-600 text-white text-center py-2.5 px-4 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg">
      <FaWifi className="animate-pulse animate-bounce" />
      Connection lost. Attempting to reconnect to Battle Arena...
    </div>
  );
};

const BattleArena = () => {
  const { user } = useSelector((state) => state.auth);
  const { roomId: routeRoomId } = useParams();
  const navigate = useNavigate();

  // Active Battle State
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [hostUserId, setHostUserId] = useState('');

  // Sync Question State
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [timeRemaining, setTimeRemaining] = useState(15);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [correctAnswerIndex, setCorrectAnswerIndex] = useState(null);
  const [explanation, setExplanation] = useState('');
  const [answerSubmitted, setAnswerSubmitted] = useState(false);
  const [questionStartTimestamp, setQuestionStartTimestamp] = useState(0);

  // Creation Lobby Options
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [topics, setTopics] = useState([]);
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [questionCount, setQuestionCount] = useState(5);
  const [timePerQuestion, setTimePerQuestion] = useState(15);

  const joinedRef = useRef(false);
  const roomIdRef = useRef('');
  const passwordRef = useRef('');
  const roomNameRef = useRef('');

  // Fetch subjects on mount
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        if (res.data?.success) {
          setSubjects(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedSubjectId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch subjects for battle selection:', err);
      }
    };
    fetchSubjects();
  }, []);

  // Fetch topics when subject changes
  useEffect(() => {
    if (!selectedSubjectId) {
      setTopics([]);
      return;
    }
    const fetchTopics = async () => {
      try {
        const res = await API.get(`/academic/topics?subjectId=${selectedSubjectId}`);
        if (res.data?.success) {
          setTopics(res.data.data);
          setSelectedTopicId(''); // default to general
        }
      } catch (err) {
        console.error('Failed to fetch topics for battle selection:', err);
      }
    };
    fetchTopics();
  }, [selectedSubjectId]);

  useEffect(() => {
    if (status === 'finished') {
      triggerConfetti();
    }
  }, [status]);

  // Sync Socket Handlers
  useEffect(() => {
    connectSocket();

    const onConnect = () => {
      setIsConnected(true);
      if (joinedRef.current) {
        socket.emit('join-room', {
          roomId: roomIdRef.current,
          password: passwordRef.current,
        });
      }
    };

    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', () => setIsConnected(false));

    socket.on('room_update', (data) => {
      setPlayers(data.players || {});
      setStatus(data.status || 'waiting');
      if (data.hostUserId) setHostUserId(data.hostUserId);
    });

    socket.on('host_changed', ({ hostUserId: newHostId, username }) => {
      setHostUserId(newHostId);
      // Optional alert
    });

    socket.on('battle_start', () => {
      setStatus('playing');
      setCurrentQuestionIndex(0);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setCorrectAnswerIndex(null);
      setExplanation('');
    });

    socket.on('new_question', (data) => {
      setCurrentQuestion({
        questionText: data.questionText,
        options: data.options,
      });
      setCurrentQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setTimeRemaining(data.timeLimit);
      setSelectedAnswer(null);
      setAnswerSubmitted(false);
      setCorrectAnswerIndex(null);
      setExplanation('');
      setQuestionStartTimestamp(Date.now());
    });

    socket.on('timer_tick', ({ timeRemaining: remaining }) => {
      setTimeRemaining(remaining);
    });

    socket.on('question_result', (data) => {
      setCorrectAnswerIndex(data.correctAnswerIndex);
      setExplanation(data.explanation);
      setPlayers(data.players || {});
    });

    socket.on('battle_finished', (data) => {
      setStatus('finished');
      setPlayers(data.players || {});
    });

    socket.on('user:typing', ({ socketId, username, isTyping }) => {
      setTypingPlayers((prev) => {
        const next = { ...prev };
        if (isTyping) next[socketId] = { username };
        else delete next[socketId];
        return next;
      });
    });

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('room_update');
      socket.off('host_changed');
      socket.off('battle_start');
      socket.off('new_question');
      socket.off('timer_tick');
      socket.off('question_result');
      socket.off('battle_finished');
      socket.off('user:typing');
      socket.emit('leave-room', { roomId: roomIdRef.current });
    };
  }, []);

  // Listen to route join code
  useEffect(() => {
    if (!routeRoomId) return;
    const normalized = routeRoomId.toUpperCase();
    joinLobbyRoom(normalized);
  }, [routeRoomId]);

  const joinLobbyRoom = async (code, enteredPassword = '') => {
    setAccessError('');
    setAccessPending(true);
    setPendingRoomId(code);

    try {
      // Validate battle session exists first via API
      const res = await API.get(`/battles/${code}`);
      if (!res.data?.success) {
        setAccessPending(false);
        setJoined(false);
        setAccessError('Lobby not found.');
        return;
      }

      const battle = res.data.data;
      if (battle.status !== 'waiting') {
        setAccessPending(false);
        setJoined(false);
        setAccessError('This battle lobby has already started.');
        return;
      }

      // Check if password match is required
      if (battle.isPrivate && !enteredPassword) {
        setAccessPending(false);
        setJoined(false);
        setAccessError('Enter password to continue.');
        return;
      }

      // Handshake join socket
      connectSocket();
      socket.emit('join-room', { roomId: code, password: enteredPassword }, (response) => {
        setAccessPending(false);
        if (response?.success) {
          setRoomId(code);
          setRoomName(response.room?.name || 'Live Battle Arena');
          roomIdRef.current = code;
          passwordRef.current = enteredPassword;
          setIsPrivate(Boolean(battle.isPrivate));
          setInviteLink(`${window.location.origin}/battle/join/${code}`);
          joinedRef.current = true;
          setJoined(true);
          setPendingRoomId('');
          setAccessError('');
        } else if (response?.requiresPassword) {
          setJoined(false);
          setPendingRoomId(code);
          setAccessError('Incorrect room password.');
        } else {
          setJoined(false);
          setAccessError(response?.message || 'Unable to join this room.');
        }
      });
    } catch (err) {
      setAccessPending(false);
      setJoined(false);
      setAccessError(err.response?.data?.error || 'Lobby code is invalid.');
    }
  };

  const handleJoin = (e) => {
    e.preventDefault();
    joinLobbyRoom(roomId, password);
  };

  const handleCreateRoom = async () => {
    setAccessError('');
    setAccessPending(true);

    try {
      const res = await API.post('/battles/create', {
        subjectId: selectedSubjectId,
        topicId: selectedTopicId || null,
        questionCount,
        timePerQuestion,
        roomName,
        password: isPrivate ? password : '',
      });

      if (res.data?.success) {
        const battle = res.data.data;
        const code = battle.roomCode;
        
        // Auto-join socket
        connectSocket();
        socket.emit('join-room', { roomId: code, password: isPrivate ? password : '' }, (response) => {
          setAccessPending(false);
          if (response?.success) {
            setRoomId(code);
            setRoomName(roomName || 'Battle Arena');
            roomIdRef.current = code;
            passwordRef.current = isPrivate ? password : '';
            setIsPrivate(isPrivate);
            setInviteLink(`${window.location.origin}/battle/join/${code}`);
            joinedRef.current = true;
            setJoined(true);
            setShowCreateModal(false);
            setAccessError('');
          } else {
            setAccessError('Lobby created but socket handshake failed.');
          }
        });
      }
    } catch (err) {
      setAccessPending(false);
      setAccessError(err.response?.data?.error || ' Lobbies could not be created.');
    }
  };

  const handleToggleReady = () => {
    socket.emit('toggle_ready', { roomId });
  };

  const handleStartGame = () => {
    socket.emit('start-game', { roomId });
  };

  const handleAnswerSelect = (optionIndex) => {
    if (answerSubmitted || correctAnswerIndex !== null) return;
    
    setSelectedAnswer(optionIndex);
    setAnswerSubmitted(true);

    const timeSpentMs = Date.now() - questionStartTimestamp;
    socket.emit('submit_answer', {
      roomId,
      optionIndex,
      timeSpentMs,
    });
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
  };

  if (!joined) {
    const showPasswordPrompt = Boolean(pendingRoomId && accessError.includes('password'));

    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center p-4 text-stone-200">
        <ReconnectBanner connected={isConnected} />
        <div className="bg-neutral-900/90 border border-neutral-800 p-8 rounded-2xl shadow-2xl w-full max-w-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

          <div className="text-center mb-8">
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-full inline-block text-indigo-400 mb-4">
              <FaUsers className="text-4xl" />
            </div>
            <h1 className="text-3xl font-extrabold font-playfair text-stone-100 mb-2">Live Battle Arena</h1>
            <p className="text-stone-400 text-sm">Challenge peers in live synchronized study quiz lobbies</p>
          </div>

          {showPasswordPrompt ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300">
                <p className="font-semibold mb-1">Enter Lobby Password</p>
                <p className="opacity-80">This room requires authentication to enter.</p>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full bg-stone-950 border border-neutral-800 rounded-xl p-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
              />
              {accessError && <p className="text-xs text-rose-400">{accessError}</p>}
              <button
                onClick={() => joinLobbyRoom(pendingRoomId, password)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm"
              >
                Enter Lobby
              </button>
            </div>
          ) : (
            <>
              <form onSubmit={handleJoin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-widest mb-2">Lobby Code</label>
                  <input
                    type="text"
                    value={roomId}
                    onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                    placeholder="ENTER 6-DIGIT CODE"
                    className="w-full bg-stone-950 border border-neutral-800 rounded-xl p-3.5 text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 uppercase tracking-widest text-center text-lg font-mono font-bold"
                    required
                  />
                </div>
                {accessError && <p className="text-xs text-rose-400">{accessError}</p>}
                <button
                  type="submit"
                  disabled={accessPending}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg transition-all text-sm flex items-center justify-center gap-2"
                >
                  {accessPending ? 'Connecting...' : 'Join Battle Lobby'} <FaPlay className="text-xs" />
                </button>
              </form>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-neutral-800"></div>
                <span className="flex-shrink-0 mx-4 text-stone-500 text-xs font-bold uppercase tracking-wider">OR</span>
                <div className="flex-grow border-t border-neutral-800"></div>
              </div>

              <button
                onClick={() => {
                  setAccessError('');
                  setShowCreateModal(true);
                }}
                className="w-full bg-neutral-800/80 hover:bg-neutral-850 text-stone-300 font-bold py-3.5 rounded-xl border border-neutral-750 transition-all text-sm"
              >
                Create Custom Battle Lobby
              </button>
            </>
          )}

          {/* Lobby Customization Modal */}
          <AnimatePresence>
            {showCreateModal && (
              <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCreateModal(false)}
              >
                <motion.div
                  className="bg-neutral-900 w-full max-w-md rounded-2xl border border-neutral-800 shadow-2xl p-6 relative overflow-hidden"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-xl font-bold text-stone-100 font-playfair mb-4">Lobby Parameters</h2>
                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block text-xs font-semibold text-stone-400 mb-1">Room Name</label>
                      <input
                        type="text"
                        value={roomName}
                        onChange={(e) => setRoomName(e.target.value)}
                        placeholder="Class Challenge Room"
                        className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-400 mb-1">Subject</label>
                        <select
                          value={selectedSubjectId}
                          onChange={(e) => setSelectedSubjectId(e.target.value)}
                          className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-3 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        >
                          {subjects.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-400 mb-1">Topic</label>
                        <select
                          value={selectedTopicId}
                          onChange={(e) => setSelectedTopicId(e.target.value)}
                          className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-3 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                        >
                          <option value="">General (All Topics)</option>
                          {topics.map((t) => (
                            <option key={t.id} value={t.id}>{t.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-stone-400 mb-1">Questions</label>
                        <select
                          value={questionCount}
                          onChange={(e) => setQuestionCount(Number(e.target.value))}
                          className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-3 py-3 text-stone-200 focus:outline-none"
                        >
                          <option value="5">5 Questions</option>
                          <option value="10">10 Questions</option>
                          <option value="15">15 Questions</option>
                          <option value="20">20 Questions</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-stone-400 mb-1">Timer Limit</label>
                        <select
                          value={timePerQuestion}
                          onChange={(e) => setTimePerQuestion(Number(e.target.value))}
                          className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-3 py-3 text-stone-200 focus:outline-none"
                        >
                          <option value="10">10s (Fast)</option>
                          <option value="15">15s (Default)</option>
                          <option value="30">30s (Extended)</option>
                          <option value="45">45s (Challenging)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-neutral-800 bg-stone-950 px-4 py-3">
                      <label className="text-xs font-semibold text-stone-400">Private Lobby (Add Password)</label>
                      <input
                        type="checkbox"
                        checked={isPrivate}
                        onChange={(e) => setIsPrivate(e.target.checked)}
                        className="h-4 w-4 accent-indigo-600 rounded bg-stone-950"
                      />
                    </div>

                    {isPrivate && (
                      <div>
                        <input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Lobby Entry Password"
                          className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                      </div>
                    )}

                    <div className="pt-2 space-y-2">
                      <button
                        onClick={handleCreateRoom}
                        disabled={accessPending}
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-md text-sm"
                      >
                        {accessPending ? 'Allocating...' : 'Launch Lobby'}
                      </button>
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="w-full bg-neutral-800 hover:bg-neutral-750 text-stone-300 font-bold py-3 rounded-xl transition-all text-xs"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // --- WAITING LOBBY PHASE ---
  if (status === 'waiting') {
    const activePlayers = Object.values(players);
    const myPlayer = players[socket.id];
    const isMeReady = myPlayer?.isReady;
    const isHost = hostUserId === user?.id;

    return (
      <div className="min-h-screen bg-stone-950 text-stone-250 p-6 md:p-12">
        <ReconnectBanner connected={isConnected} />
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Header Stats */}
          <div className="flex flex-col md:flex-row justify-between items-center bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-stone-100">
                  Lobby Code: <span className="text-indigo-400 font-mono tracking-wider font-extrabold">{roomId}</span>
                </h1>
                {isPrivate ? <FaLock className="text-amber-500" /> : <FaUnlock className="text-emerald-500" />}
              </div>
              <p className="text-stone-400 text-sm flex items-center flex-wrap gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                <span>{activePlayers.filter(p => p.online).length} students online</span>
                <span className="text-neutral-700">•</span>
                <span className="text-stone-400 italic">"{roomName}"</span>
              </p>
            </div>
            
            <div className="flex gap-2 mt-4 md:mt-0">
              <button
                onClick={() => navigator.clipboard.writeText(roomId)}
                className="flex items-center text-xs font-semibold bg-neutral-800 hover:bg-neutral-700 px-4 py-2.5 rounded-xl border border-neutral-750 transition-colors"
              >
                <FaCopy className="mr-2" /> Code
              </button>
              {inviteLink && (
                <button
                  onClick={handleCopyLink}
                  className="flex items-center text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 rounded-xl transition-colors"
                >
                  <FaCopy className="mr-2" /> Copy Invite
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Players Table (2/3 width) */}
            <div className="md:col-span-2 bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl">
              <h2 className="text-lg font-bold mb-4 flex items-center border-b border-neutral-800 pb-3 text-stone-100">
                <FaUsers className="mr-2.5 text-indigo-400" /> Connected Students ({activePlayers.length})
              </h2>
              <div className="space-y-2">
                {activePlayers.map((player, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-stone-950/60 rounded-xl border border-neutral-800/80">
                    <span className="font-semibold flex items-center text-sm">
                      <span className={`w-2.5 h-2.5 rounded-full mr-2.5 ${player.online ? 'bg-emerald-500' : 'bg-stone-600 animate-pulse'}`} />
                      {player.username}
                      {player.userId === hostUserId && <FaUserShield className="ml-2 text-indigo-400 text-xs" title="Lobby Host" />}
                      {player.userId === user?.id && <span className="ml-2 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full font-bold border border-indigo-500/20">You</span>}
                    </span>
                    <span className="flex items-center gap-3">
                      {player.isReady ? (
                        <span className="text-emerald-400 text-xs font-bold flex items-center bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full"><FaCheck className="mr-1" /> READY</span>
                      ) : (
                        <span className="text-stone-500 text-xs bg-neutral-800 px-2.5 py-1 rounded-full font-semibold">NOT READY</span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ready Card (1/3 width) */}
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl shadow-xl flex flex-col justify-between items-center text-center">
              <div className="py-4">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 transition-all border ${isMeReady ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-neutral-800 border-neutral-700 text-stone-500'}`}>
                  {isMeReady ? <FaCheck className="text-2xl" /> : <FaPlay className="text-2xl" />}
                </div>
                <h3 className="text-base font-bold text-stone-200">
                  {isMeReady ? "Locked & Ready" : "Prepare for Quiz"}
                </h3>
                <p className="text-xs text-stone-500 mt-1 max-w-[200px]">
                  All students must toggle ready status to begin the study quiz challenge.
                </p>
              </div>

              <div className="w-full space-y-2">
                <button
                  onClick={handleToggleReady}
                  className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all shadow-md ${
                    isMeReady
                      ? 'bg-neutral-800 hover:bg-neutral-750 text-stone-300 border border-neutral-700'
                      : 'bg-emerald-500 hover:bg-emerald-600 text-stone-950 font-extrabold shadow-emerald-500/10'
                  }`}
                >
                  {isMeReady ? 'Cancel Ready' : 'I am Ready!'}
                </button>
                {isHost && (
                  <button
                    onClick={handleStartGame}
                    disabled={activePlayers.length < 1}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-lg"
                  >
                    Force Start Battle
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // Calculate sorted rankings
  const leaderboard = Object.values(players)
    .sort((a, b) => b.score - a.score);

  // --- BATTLE FINISHED PHASE ---
  if (status === 'finished') {
    const winner = leaderboard[0];
    const isMeWinner = winner?.userId === user?.id;

    return (
      <div className="min-h-screen bg-stone-950 text-stone-250 p-6 md:p-12 flex flex-col items-center justify-center">
        <ReconnectBanner connected={isConnected} />
        <div className="bg-neutral-900 border border-neutral-800 p-8 md:p-10 rounded-2xl shadow-2xl w-full max-w-2xl text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(139,92,246,0.1),transparent_50%)]" />

          <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-full mb-6">
            <FaCrown className="text-4xl text-yellow-400" />
          </div>
          
          <h1 className="text-4xl font-extrabold font-playfair text-stone-100 mb-2">Lobby Standings</h1>
          <p className="text-stone-400 text-sm mb-8">
            Battle Winner: <span className="text-yellow-400 font-bold">{winner?.username}</span>
          </p>

          <div className="bg-stone-950/60 border border-neutral-850 rounded-xl overflow-hidden mb-8 text-left">
            {leaderboard.map((player, index) => (
              <div
                key={index}
                className={`flex justify-between items-center p-4 border-b border-neutral-850/60 last:border-0 ${player.userId === user?.id ? 'bg-indigo-500/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 font-mono text-sm font-bold ${index === 0 ? 'text-yellow-400' : 'text-stone-500'}`}>
                    #{index + 1}
                  </span>
                  <span className="font-semibold text-sm flex items-center gap-1.5 text-stone-200">
                    {index === 0 && <FaCrown className="text-yellow-400 text-xs" />}
                    {player.username}
                    {player.userId === user?.id && <span className="text-[10px] text-indigo-400 bg-indigo-500/10 px-1.5 py-0.2 rounded-full font-bold">You</span>}
                  </span>
                </div>
                <div className="flex items-center gap-6">
                  <span className="text-xs text-stone-500 font-medium">
                    {player.correctCount} correct
                  </span>
                  <span className="font-bold text-sm text-emerald-400">
                    {player.score} pts
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs text-center max-w-md mx-auto mb-8">
            <FaTrophy className="inline-block mr-1.5 text-sm" />
            Battle points calculated dynamically. Winners rewarded with **+200 XP**, participants received **+100 XP**!
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all text-sm"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- PLAYING ACTIVE QUIZ PHASE ---
  const activeTypers = Object.values(typingPlayers).filter((p) => p.username !== user?.name);

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200 flex flex-col font-inter">
      <ReconnectBanner connected={isConnected} />
      
      {/* Live Scores Bar */}
      <div className="bg-neutral-900 border-b border-neutral-800 p-4 sticky top-0 z-10 flex overflow-x-auto gap-4 scrollbar-hide items-center px-6 shadow-md">
        <span className="text-xs font-bold text-stone-500 uppercase tracking-wider mr-2 flex-shrink-0">Live Standings:</span>
        <div className="flex gap-2.5">
          {leaderboard.map((player, idx) => (
            <div
              key={idx}
              className={`flex items-center bg-stone-950 px-3 py-1.5 rounded-xl border border-neutral-850 flex-shrink-0 ${player.userId === user?.id ? 'border-indigo-500/30 bg-indigo-500/5' : ''}`}
            >
              {idx === 0 && <FaCrown className="text-yellow-400 mr-1.5 text-xs animate-bounce" />}
              <span className="font-bold text-xs mr-2 text-stone-300">{player.username}</span>
              <span className="text-emerald-400 font-extrabold text-xs">{player.score}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Synchronized Arena View */}
      <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-3xl">
          
          <div className="flex justify-between items-center text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4">
            <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
            <span className="flex items-center gap-1.5 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-full text-stone-300 normal-case font-mono">
              <FaClock className="text-indigo-400 text-sm animate-spin-slow" /> {timeRemaining}s left
            </span>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 bg-indigo-500 transition-all duration-1000" style={{ width: `${(timeRemaining / timePerQuestion) * 100}%` }} />

            <h2 className="text-xl md:text-2xl font-bold mb-8 leading-relaxed text-center font-playfair text-stone-100">
              {currentQuestion?.questionText}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion?.options.map((option, idx) => {
                let btnClass = "p-5 rounded-xl border-2 text-sm font-semibold transition-all duration-200 text-left relative overflow-hidden flex items-center justify-between ";
                
                if (correctAnswerIndex === null) {
                  // Answer Selection state
                  if (selectedAnswer === idx) {
                    btnClass += "bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md";
                  } else {
                    btnClass += "bg-stone-950/60 border-neutral-850 hover:border-indigo-500 hover:bg-neutral-850 text-stone-300";
                  }
                } else {
                  // Result state
                  if (idx === correctAnswerIndex) {
                    btnClass += "bg-emerald-500/20 border-emerald-500 text-emerald-300";
                  } else if (selectedAnswer === idx) {
                    btnClass += "bg-rose-500/20 border-rose-500 text-rose-300";
                  } else {
                    btnClass += "bg-stone-950 border-neutral-900 text-stone-600 opacity-40";
                  }
                }

                return (
                  <button
                    key={idx}
                    disabled={answerSubmitted || correctAnswerIndex !== null}
                    onClick={() => handleAnswerSelect(idx)}
                    className={btnClass}
                  >
                    <span>{option}</span>
                    {correctAnswerIndex !== null && idx === correctAnswerIndex && <FaCheck className="text-emerald-400 text-sm ml-2" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation overlay */}
            <AnimatePresence>
              {correctAnswerIndex !== null && explanation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-xs text-stone-400 leading-relaxed text-left"
                >
                  <p className="font-bold text-stone-200 mb-1">Concept Explanation</p>
                  {explanation}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BattleArena;