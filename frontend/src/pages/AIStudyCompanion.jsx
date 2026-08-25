/**
 * @fileoverview Main page for the Context-Aware AI Study Companion.
 */
import React, { useState } from 'react';
import ChatInterface from '../components/Chatbot/ChatInterface';
import axios from 'axios';

const AIStudyCompanion = () => {
    const [topic, setTopic] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [hasStarted, setHasStarted] = useState(false);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleStart = (e) => {
        e.preventDefault();
        if (!topic.trim()) return;
        setHasStarted(true);
        setSessionId(`session_${Date.now()}`);
    };

    const handleSendMessage = async (text) => {
        setIsTyping(true);
        try {
            const response = await axios.post(`${API_URL}/chatbot/message`, {
                sessionId,
                message: text,
                topic,
            });

            if (response.data.success) {
                setSessionId(response.data.data.sessionId);
                setMessages(response.data.data.messages);
            }
        } catch (error) {
            console.error('Chat error:', error);
            // Handle error UI
        } finally {
            setIsTyping(false);
        }
    };

    const handleClearContext = async () => {
        if (!sessionId) return;
        try {
            await axios.post(`${API_URL}/chatbot/session/${sessionId}/clear`);
            setMessages([]);
        } catch (error) {
            console.error('Clear error:', error);
        }
    };

    if (!hasStarted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
                    <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">AI Study Companion</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">Let's personalize your learning. What topic are we focusing on today?</p>

                    <form onSubmit={handleStart} className="space-y-4">
                        <input
                            type="text"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            placeholder="e.g., Quantum Mechanics, React Hooks, Macroeconomics"
                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Start Learning
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Studying: {topic}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Context-aware AI companion</p>
                    </div>
                    <button
                        onClick={handleClearContext}
                        className="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        Clear Context
                    </button>
                </div>

                <ChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isTyping={isTyping}
                />
            </div>
        </div>
    );
};

export default AIStudyCompanion;
