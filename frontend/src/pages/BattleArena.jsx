import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { socket } from '../services/socket';
import { FaPlay, FaCheck, FaUsers, FaCopy, FaCrown } from 'react-icons/fa';

const MOCK_QUESTIONS = [
  { id: 'q1', text: 'What is the powerhouse of the cell?', options: ['Nucleus', 'Mitochondria', 'Ribosome', 'Endoplasmic Reticulum'], correct: 'Mitochondria' },
  { id: 'q2', text: 'What is the speed of light?', options: ['300,000 km/s', '150,000 km/s', '1,000,000 km/s', '10,000 km/s'], correct: '300,000 km/s' },
  { id: 'q3', text: 'Who wrote Hamlet?', options: ['Charles Dickens', 'William Shakespeare', 'Mark Twain', 'Jane Austen'], correct: 'William Shakespeare' },
  { id: 'q4', text: 'What is the chemical symbol for Gold?', options: ['Ag', 'Fe', 'Au', 'Cu'], correct: 'Au' },
  { id: 'q5', text: 'Which planet is known as the Red Planet?', options: ['Venus', 'Jupiter', 'Saturn', 'Mars'], correct: 'Mars' },
];

const BattleArena = () => {
  const { user } = useSelector((state) => state.auth);
  
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [players, setPlayers] = useState({});
  const [status, setStatus] = useState('waiting');
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  useEffect(() => {
    socket.connect();

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

    socket.on('player_left', (data) => {
      // Optional: show toast notification
    });

    return () => {
      socket.off('room_update');
      socket.off('battle_start');
      socket.off('score_update');
      socket.off('player_left');
      socket.disconnect();
    };
  }, []);

  const handleJoin = (e) => {
    e.preventDefault();
    if (roomId.trim()) {
      socket.emit('join_room', { roomId, username: user?.name || 'Anonymous' });
      setJoined(true);
    }
  };

  const handleCreateRoom = () => {
    const newRoomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(newRoomId);
    socket.emit('join_room', { roomId: newRoomId, username: user?.name || 'Anonymous' });
    setJoined(true);
  };

  const handleToggleReady = () => {
    socket.emit('toggle_ready', { roomId });
  };

  const handleAnswerSelect = (option) => {
    if (selectedAnswer) return; // Prevent multiple selections

    setSelectedAnswer(option);
    
    const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
    const isCorrect = option === currentQuestion.correct;
    
    socket.emit('submit_answer', { roomId, isCorrect, points: 10 });
    
    // Move to next question after short delay
    setTimeout(() => {
      if (currentQuestionIndex < MOCK_QUESTIONS.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
        setSelectedAnswer(null);
      } else {
        setStatus('finished');
      }
    }, 1500);
  };

  if (!joined) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 p-8 rounded-xl border border-slate-700 shadow-2xl w-full max-w-md">
          <div className="text-center mb-8">
            <FaUsers className="text-5xl text-indigo-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Battle Arena</h1>
            <p className="text-slate-400">Join a lobby to battle your friends in real-time!</p>
          </div>

          <form onSubmit={handleJoin} className="space-y-4 mb-6">
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
    
    return (
      <div className="min-h-screen bg-slate-900 text-white p-6 md:p-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg mb-8">
            <div>
              <h1 className="text-2xl font-bold mb-1">Lobby: <span className="text-indigo-400 font-mono tracking-wider">{roomId}</span></h1>
              <p className="text-slate-400 text-sm">Waiting for players to get ready...</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(roomId)}
              className="mt-4 md:mt-0 flex items-center text-sm bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
            >
              <FaCopy className="mr-2" /> Copy Code
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
              <h2 className="text-xl font-semibold mb-6 flex items-center border-b border-slate-700 pb-3">
                <FaUsers className="mr-2 text-indigo-400" /> Players ({Object.keys(players).length})
              </h2>
              <div className="space-y-3">
                {Object.entries(players).map(([id, player]) => (
                  <div key={id} className="flex justify-between items-center p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                    <span className="font-medium flex items-center">
                      {player.username} {id === socket.id && <span className="ml-2 text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full">You</span>}
                    </span>
                    {player.isReady ? (
                      <span className="text-emerald-400 text-sm font-medium flex items-center"><FaCheck className="mr-1" /> Ready</span>
                    ) : (
                      <span className="text-slate-400 text-sm">Not Ready</span>
                    )}
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

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col">
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
