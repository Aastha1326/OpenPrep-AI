/**
 * @fileoverview Distraction-minimized dashboard combining exam countdown and Pomodoro timer.
 */
import React, { useState, useEffect } from 'react';
import PomodoroTimer from '../components/Focus/PomodoroTimer';
import axios from 'axios';

const FocusModeDashboard = () => {
    const [examDate, setExamDate] = useState('2026-12-01'); // Mock exam date
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0 });
    const [currentTopic, setCurrentTopic] = useState('');
    const [isFocusMode, setIsFocusMode] = useState(false);
    const [recentSessions, setRecentSessions] = useState([]);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +new Date(examDate) - +new Date();
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                });
            }
        };
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 60000);
        return () => clearInterval(timer);
    }, [examDate]);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const response = await axios.get(`${API_URL}/focus/sessions`);
                if (response.data.success) {
                    setRecentSessions(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch sessions:', error);
            }
        };
        fetchSessions();
    }, []);

    const handleSessionComplete = async (duration) => {
        try {
            await axios.post(`${API_URL}/focus/sessions`, {
                topic: currentTopic || 'General Study',
                durationMinutes: duration,
                focusScore: 5, // Mocked self-rating
            });
            // Refresh sessions
            const response = await axios.get(`${API_URL}/focus/sessions`);
            if (response.data.success) setRecentSessions(response.data.data);
        } catch (error) {
            console.error('Failed to log session:', error);
        }
    };

    if (isFocusMode) {
        return (
            <div className="fixed inset-0 z-50 bg-gray-900 flex flex-col items-center justify-center p-4">
                <button
                    onClick={() => setIsFocusMode(false)}
                    className="absolute top-6 right-6 text-gray-400 hover:text-white flex items-center gap-2"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    Exit Focus Mode
                </button>

                <div className="text-center mb-12">
                    <h2 className="text-2xl text-gray-400 mb-2">Current Topic</h2>
                    <input
                        type="text"
                        value={currentTopic}
                        onChange={(e) => setCurrentTopic(e.target.value)}
                        placeholder="What are you studying?"
                        className="bg-transparent text-4xl font-bold text-white text-center border-b-2 border-gray-700 focus:border-blue-500 outline-none pb-2 w-full max-w-lg placeholder-gray-600"
                    />
                </div>

                <PomodoroTimer onSessionComplete={handleSessionComplete} />

                <p className="mt-12 text-gray-500 text-sm">Stay focused. You've got this.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Focus Dashboard</h1>
                    <button
                        onClick={() => setIsFocusMode(true)}
                        className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                        Enter Focus Mode
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Exam Countdown */}
                    <div className="lg:col-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
                        <h2 className="text-lg font-semibold opacity-90 mb-4">Next Exam Countdown</h2>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <span className="block text-3xl font-bold">{timeLeft.days}</span>
                                <span className="text-xs uppercase tracking-wider opacity-80">Days</span>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <span className="block text-3xl font-bold">{timeLeft.hours}</span>
                                <span className="text-xs uppercase tracking-wider opacity-80">Hours</span>
                            </div>
                            <div className="bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                                <span className="block text-3xl font-bold">{timeLeft.minutes}</span>
                                <span className="text-xs uppercase tracking-wider opacity-80">Mins</span>
                            </div>
                        </div>
                        <div className="mt-6 pt-6 border-t border-white/20">
                            <label className="text-xs uppercase tracking-wider opacity-80 block mb-2">Exam Date</label>
                            <input
                                type="date"
                                value={examDate}
                                onChange={(e) => setExamDate(e.target.value)}
                                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 outline-none focus:bg-white/20"
                            />
                        </div>
                    </div>

                    {/* Timer & Sessions */}
                    <div className="lg:col-span-2 space-y-6">
                        <PomodoroTimer onSessionComplete={handleSessionComplete} />

                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Sessions</h3>
                            {recentSessions.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm">No sessions logged yet. Start focusing!</p>
                            ) : (
                                <div className="space-y-3">
                                    {recentSessions.map((session) => (
                                        <div key={session.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{session.topic || 'General Study'}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(session.createdAt).toLocaleDateString()}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-bold text-blue-600 dark:text-blue-400">{session.durationMinutes} min</p>
                                                <div className="flex gap-1 justify-end mt-1">
                                                    {[...Array(session.focusScore)].map((_, i) => (
                                                        <svg key={i} className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FocusModeDashboard;
