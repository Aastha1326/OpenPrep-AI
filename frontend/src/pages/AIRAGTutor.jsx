/**
 * @fileoverview Main page for the Personalized AI Tutor Chatbot with RAG capabilities.
 */
import React, { useState } from 'react';
import RAGChatInterface from '../components/tutor/RAGChatInterface';
import axios from 'axios';

const AIRAGTutor = () => {
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    const handleSendMessage = async (query, useFallback) => {
        // Add user message
        const userMsg = { role: 'user', content: query };
        setMessages(prev => [...prev, userMsg]);
        setIsLoading(true);

        try {
            const response = await axios.post(`${API_URL}/rag-tutor/chat`, {
                query,
                useFallback
            });

            if (response.data.success) {
                const aiMsg = {
                    role: 'model',
                    content: response.data.data.answer,
                    citations: response.data.data.citations,
                    usedPersonalNotes: response.data.data.usedPersonalNotes
                };
                setMessages(prev => [...prev, aiMsg]);
            } else {
                setMessages(prev => [...prev, { role: 'model', content: 'Sorry, I encountered an error processing your request.' }]);
            }
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, { role: 'model', content: 'Network error. Please try again later.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Personalized AI Tutor</h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Get answers grounded in your own uploaded notes, flashcards, and study materials.
                    </p>
                </div>

                <RAGChatInterface
                    messages={messages}
                    onSendMessage={handleSendMessage}
                    isLoading={isLoading}
                />
            </div>
        </div>
    );
};

export default AIRAGTutor;
