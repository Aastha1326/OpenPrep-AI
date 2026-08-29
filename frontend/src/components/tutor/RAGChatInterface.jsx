/**
 * @fileoverview Chat interface displaying AI responses alongside collapsible source citations.
 */
import React, { useState, useRef, useEffect } from 'react';

const RAGChatInterface = ({ messages, onSendMessage, isLoading }) => {
    const [input, setInput] = useState('');
    const [useFallback, setUseFallback] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!input.trim()) return;
        onSendMessage(input, useFallback);
        setInput('');
    };

    return (
        <div className="flex flex-col h-[600px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 dark:text-gray-400 mt-10">
                        <p className="text-lg font-medium">AI Tutor with Personal Notes</p>
                        <p className="text-sm">Ask a question, and I will search your uploaded notes and flashcards to provide a cited answer.</p>
                    </div>
                )}

                {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user'
                                ? 'bg-blue-600 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm'
                            }`}>
                            <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>

                            {/* Citations for AI messages */}
                            {msg.role === 'model' && msg.citations && msg.citations.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                        Sources from your notes:
                                    </p>
                                    <div className="space-y-2">
                                        {msg.citations.map((citation, idx) => (
                                            <details key={idx} className="group">
                                                <summary className="text-xs font-medium text-blue-600 dark:text-blue-400 cursor-pointer hover:underline list-none flex items-center gap-1">
                                                    <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                                    {citation.source}
                                                </summary>
                                                <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/50 p-2 rounded italic">
                                                    "{citation.snippet}"
                                                </p>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {msg.role === 'model' && !msg.usedPersonalNotes && (
                                <p className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 italic">
                                    * No relevant personal notes found. Answered using general knowledge.
                                </p>
                            )}
                        </div>
                    </div>
                ))}

                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 space-y-3">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        id="fallback"
                        checked={useFallback}
                        onChange={(e) => setUseFallback(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                    />
                    <label htmlFor="fallback" className="text-xs text-gray-600 dark:text-gray-400 select-none cursor-pointer">
                        Allow general knowledge if no notes match
                    </label>
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder="Ask a question about your notes..."
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50"
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </form>
        </div>
    );
};

export default RAGChatInterface;
