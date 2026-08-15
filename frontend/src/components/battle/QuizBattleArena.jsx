import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { Swords, Trophy, Users, Timer, Sparkles, Send } from 'lucide-react';

const socket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');

export default function QuizBattleArena({ quizId, userName }) {
  const [roomCode, setRoomCode] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [room, setRoom] = useState(null);
  const [gameState, setGameState] = useState('menu'); // 'menu' | 'lobby' | 'countdown' | 'active' | 'leaderboard'
  const [countdown, setCountdown] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    socket.on('room-created', ({ roomCode, room }) => {
      setRoomCode(roomCode);
      setRoom(room);
      setGameState('lobby');
    });

    socket.on('update-lobby', (updatedRoom) => {
      setRoom(updatedRoom);
    });

    socket.on('countdown-tick', ({ countdown }) => {
      setGameState('countdown');
      setCountdown(countdown);
    });

    socket.on('start-questions', () => {
      setGameState('active');
    });

    socket.on('live-leaderboard', ({ leaderboard }) => {
      setLeaderboard(leaderboard);
    });

    socket.on('error-message', ({ message }) => {
      setError(message);
    });

    return () => {
      socket.off();
    };
  }, []);

  const handleCreateRoom = () => {
    socket.emit('create-room', { hostName: userName, quizId });
  };

  const handleJoinRoom = () => {
    if (!inputCode || inputCode.length !== 6) {
      setError('Please enter a valid 6-character room code.');
      return;
    }
    setError('');
    socket.emit('join-room', { roomCode: inputCode.toUpperCase(), playerName: userName });
    setRoomCode(inputCode.toUpperCase());
    setGameState('lobby');
  };

  const handleStartBattle = () => {
    socket.emit('start-battle', { roomCode });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 font-inter text-[#1F150C] dark:text-[#E1DCC9]">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
          {error}
        </div>
      )}

      {/* Menu State */}
      {gameState === 'menu' && (
        <div className="bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93]/60 dark:border-[#412D15] rounded-3xl p-8 text-center shadow-xl">
          <Swords className="w-12 h-12 mx-auto text-amber-500 mb-3" />
          <h2 className="text-2xl font-bold font-playfair mb-2">Multiplayer Quiz Battle Arena</h2>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mb-8">
            Compete against your classmates in real-time synchronized battles with live scoreboards.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleCreateRoom}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl btn-primary-theme font-bold text-xs shadow cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" /> Create Battle Room
            </button>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="6-Char Code"
                className="px-4 py-3 bg-white dark:bg-[#251D17] border border-[#CEAB93] dark:border-[#412D15] rounded-2xl text-xs font-mono uppercase tracking-widest text-center focus:outline-none"
              />
              <button
                onClick={handleJoinRoom}
                className="px-6 py-3 rounded-2xl bg-neutral-800 text-amber-400 font-bold text-xs shadow cursor-pointer hover:bg-neutral-700"
              >
                Join Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lobby State */}
      {gameState === 'lobby' && room && (
        <div className="bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93]/60 dark:border-[#412D15] rounded-3xl p-8 shadow-xl">
          <div className="flex justify-between items-center mb-6 border-b border-[#CEAB93]/30 pb-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D]">Room Code</span>
              <h2 className="text-3xl font-mono font-bold text-amber-600 dark:text-amber-400">{roomCode}</h2>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-2xl">
              <Users className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-bold">{room.players.length} Players Connected</span>
            </div>
          </div>

          <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-[#8C6A53] dark:text-[#C4BA9D]">Players in Lobby</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
            {room.players.map((p, idx) => (
              <div key={idx} className="p-3 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/30 flex items-center justify-between">
                <span className="text-xs font-bold">{p.name} {p.id === room.hostId ? '(Host)' : ''}</span>
                <span className={`w-2.5 h-2.5 rounded-full ${p.connected ? 'bg-green-500' : 'bg-red-500'}`} title={p.connected ? 'Connected' : 'Disconnected'} />
              </div>
            ))}
          </div>

          {socket.id === room.hostId ? (
            <button
              onClick={handleStartBattle}
              className="w-full py-3.5 rounded-2xl btn-primary-theme font-bold text-sm shadow cursor-pointer flex items-center justify-center gap-2"
            >
              <Swords className="w-5 h-5" /> Start Synchronized Battle
            </button>
          ) : (
            <div className="text-center py-4 text-xs text-[#8C6A53] dark:text-[#C4BA9D] font-medium animate-pulse">
              Waiting for host to start the battle...
            </div>
          )}
        </div>
      )}

      {/* Countdown State */}
      {gameState === 'countdown' && (
        <div className="bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93]/60 dark:border-[#412D15] rounded-3xl p-16 text-center shadow-xl">
          <Timer className="w-10 h-10 mx-auto text-amber-500 mb-4 animate-bounce" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#8C6A53] dark:text-[#C4BA9D] mb-2">Battle Starting In</h2>
          <div className="text-7xl font-bold font-playfair text-amber-600 dark:text-amber-400">{countdown}</div>
        </div>
      )}
    </div>
  );
}
