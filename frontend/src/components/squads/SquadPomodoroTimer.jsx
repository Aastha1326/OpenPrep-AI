/**
 * @fileoverview Synchronized Pomodoro clock with circular SVG progress ring.
 */
import React, { useState, useEffect, useRef } from 'react';

const SquadPomodoroTimer = ({ socket, squadId }) => {
  const [timerState, setTimerState] = useState({ mode: 'focus', timeLeft: 25 * 60, isRunning: false });
  const audioRef = useRef(null);


  useEffect(() => {
    if (!socket || !squadId) return;

    socket.emit('pomodoro:join', { squadId, userId: 'user-1', username: 'Student_A' });

    socket.on('pomodoro:sync', (state) => setTimerState(state));
    socket.on('pomodoro:state-changed', (state) => setTimerState(state));
    socket.on('pomodoro:tick', ({ timeLeft }) => {
      setTimerState(prev => ({ ...prev, timeLeft }));
    });
    socket.on('pomodoro:session-complete', () => {
      if (audioRef.current) audioRef.current.play();
      alert('Session Complete!');
    });

    return () => {
      socket.off('pomodoro:sync');
      socket.off('pomodoro:state-changed');
      socket.off('pomodoro:tick');
      socket.off('pomodoro:session-complete');
    };
  }, [socket, squadId]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const totalSeconds = timerState.mode === 'focus' ? 25 * 60 : timerState.mode === 'shortBreak' ? 5 * 60 : 15 * 60;
  const progress = ((totalSeconds - timerState.timeLeft) / totalSeconds) * 100;
  const circumference = 2 * Math.PI * 120;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center">
      <audio ref={audioRef} src="/chime.mp3" />
      
      <div className="flex gap-2 mb-8">
        {['focus', 'shortBreak', 'longBreak'].map((mode) => (
          <button
            key={mode}
            onClick={() => socket.emit('pomodoro:reset')} // Simplified for demo
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${
              timerState.mode === mode 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {mode.replace(/([A-Z])/g, ' $1').trim()}
          </button>
        ))}
      </div>

      <div className="relative w-72 h-72 mb-8">
        <svg className="w-full h-full transform -rotate-90">
          <circle cx="144" cy="144" r="120" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-gray-200 dark:text-gray-700" />
          <circle
            cx="144"
            cy="144"
            r="120"
            stroke="currentColor"
            strokeWidth="12"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - progress / 100)}
            className="text-blue-600 transition-all duration-1000 ease-linear"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-6xl font-bold font-mono text-gray-900 dark:text-white tracking-tight">
            {formatTime(timerState.timeLeft)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-widest">
            {timerState.isRunning ? 'Focusing' : 'Paused'}
          </span>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={() => socket.emit(timerState.isRunning ? 'pomodoro:pause' : 'pomodoro:start')}
          className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 ${
            timerState.isRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {timerState.isRunning ? 'Pause' : 'Start'}
        </button>
        <button
          onClick={() => socket.emit('pomodoro:reset')}
          className="px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default SquadPomodoroTimer;
