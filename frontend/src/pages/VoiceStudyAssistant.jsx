/**
 * @fileoverview Main page for the hands-free voice-activated study assistant.
 */
import React, { useState } from 'react';
import VoiceCommandListener from '../components/Voice/VoiceCommandListener';

const VoiceStudyAssistant = () => {
    const [currentTopic, setCurrentTopic] = useState('Cellular Biology');
    const [assistantResponse, setAssistantResponse] = useState('');
    const [commandHistory, setCommandHistory] = useState([]);

    const handleCommandRecognized = (result) => {
        // Add to history
        setCommandHistory(prev => [{
            id: Date.now(),
            transcript: result.transcript,
            action: result.action,
            response: result.response || 'Command recognized. Executing action.'
        }, ...prev].slice(0, 10)); // Keep last 10

        // Set assistant response for TTS or display
        if (result.response) {
            setAssistantResponse(result.response);
            // Optional: Trigger browser TTS
            if ('speechSynthesis' in window) {
                const utterance = new SpeechSynthesisUtterance(result.response);
                window.speechSynthesis.speak(utterance);
            }
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Voice Study Assistant</h1>
                    <p className="text-gray-600 dark:text-gray-400">Navigate your study materials hands-free using voice commands.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left: Voice Listener */}
                    <div className="lg:col-span-1">
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Current Study Context</label>
                            <input
                                type="text"
                                value={currentTopic}
                                onChange={(e) => setCurrentTopic(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g., Calculus, History"
                            />
                        </div>
                        <VoiceCommandListener
                            onCommandRecognized={handleCommandRecognized}
                            currentTopic={currentTopic}
                        />
                    </div>

                    {/* Right: Response & History */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Active Response */}
                        {assistantResponse && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-6 animate-fade-in">
                                <div className="flex items-start gap-3">
                                    <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">Assistant Response</h3>
                                        <p className="text-blue-800 dark:text-blue-200 leading-relaxed">{assistantResponse}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Command History */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Recent Commands</h3>
                            {commandHistory.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-sm text-center py-8">No commands recognized yet.</p>
                            ) : (
                                <div className="space-y-4">
                                    {commandHistory.map((cmd) => (
                                        <div key={cmd.id} className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700">
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold rounded uppercase">
                                                    {cmd.action.replace('_', ' ')}
                                                </span>
                                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                                    {new Date(cmd.id).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-800 dark:text-gray-200 italic mb-2">"{cmd.transcript}"</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{cmd.response}</p>
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

export default VoiceStudyAssistant;
