/**
 * @fileoverview Fully functional Pomodoro timer with customizable intervals and browser notifications.
 */
import React, { useState, useEffect, useRef } from 'react';

const PomodoroTimer = ({ onSessionComplete }) => {
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [mode, setMode] = useState('work'); // 'work' | 'shortBreak' | 'longBreak'
    const [customWorkTime, setCustomWorkTime] = useState(25);

    const timerRef = useRef(null);

    const modes = {
        work: customWorkTime * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
    };

    useEffect(() => {
        if (isActive && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);
        } else if (timeLeft === 0) {
            clearInterval(timerRef.current);
            setIsActive(false);
            handleTimerComplete();
        }
        return () => clearInterval(timerRef.current);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        // Browser notification
        if (Notification.permission === 'granted') {
            new Notification('Timer Complete!', { body: mode === 'work' ? 'Time for a break!' : 'Time to focus!' });
        }

        if (mode === 'work') {
            onSessionComplete(customWorkTime);
        }

        // Auto-switch mode logic could go here
    };

    const toggleTimer = () => {
        if (!isActive && Notification.permission !== 'granted') {
            Notification.requestPermission();
        }
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTimeLeft(modes[mode]);
    };

    const changeMode = (newMode) => {
        setMode(newMode);
        setIsActive(false);
        setTimeLeft(modes[newMode]);
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progress = ((modes[mode] - timeLeft) / modes[mode]) * 100;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center max-w-md mx-auto">
            <div className="flex justify-center gap-2 mb-8">
                {Object.keys(modes).map((m) => (
                    <button
                        key={m}
                        onClick={() => changeMode(m)}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-colors ${mode === m
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                            }`}
                    >
                        {m.replace(/([A-Z])/g, ' $1').trim()}
                    </button>
                ))}
            </div>

            <div className="relative w-64 h-64 mx-auto mb-8 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="128" cy="128" r="120" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-200 dark:text-gray-700" />
                    <circle
                        cx="128"
                        cy="128"
                        r="120"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={2 * Math.PI * 120}
                        strokeDashoffset={2 * Math.PI * 120 * (1 - progress / 100)}
                        className={`transition-all duration-1000 ease-linear ${mode === 'work' ? 'text-blue-600' : 'text-green-500'}`}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-6xl font-bold font-mono text-gray-900 dark:text-white tracking-tight">
                        {formatTime(timeLeft)}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 uppercase tracking-widest">
                        {isActive ? 'Running' : 'Paused'}
                    </span>
                </div>
            </div>

            <div className="flex justify-center gap-4 mb-6">
                <button
                    onClick={toggleTimer}
                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all transform hover:scale-105 ${isActive ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30'
                        }`}
                >
                    {isActive ? 'Pause' : 'Start'}
                </button>
                <button
                    onClick={resetTimer}
                    className="px-6 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                    Reset
                </button>
            </div>

            {mode === 'work' && (
                <div className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <span>Duration:</span>
                    <input
                        type="number"
                        value={customWorkTime}
                        onChange={(e) => {
                            const val = Math.max(1, Math.min(60, Number(e.target.value)));
                            setCustomWorkTime(val);
                            if (!isActive) setTimeLeft(val * 60);
                        }}
                        className="w-16 px-2 py-1 text-center rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white outline-none"
                    />
                    <span>mins</span>
                </div>
            )}
        </div>
    );
};

export default PomodoroTimer;
