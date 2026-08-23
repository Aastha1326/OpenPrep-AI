/**
 * @fileoverview Main hub page for managing mock interview requests, schedules, and feedback.
 */
import React, { useState, useEffect } from 'react';
import PeerInterviewScheduler from '../components/Interview/PeerInterviewScheduler';
import axios from 'axios';

const PeerMockInterviewHub = () => {
    const [exchanges, setExchanges] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('upcoming'); // upcoming, pending, history

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchExchanges = async () => {
            try {
                const response = await axios.get(`${API_URL}/interview-exchanges/my-exchanges`);
                if (response.data.success) {
                    setExchanges(response.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch exchanges:', error);
            }
        };
        fetchExchanges();
    }, []);

    const handleScheduleSubmit = async (data) => {
        try {
            await axios.post(`${API_URL}/interview-exchanges`, {
                receiverId: 'mock-receiver-id',
                ...data,
            });
            // Refresh list
            const response = await axios.get(`${API_URL}/interview-exchanges/my-exchanges`);
            if (response.data.success) setExchanges(response.data.data);
        } catch (error) {
            console.error('Failed to schedule:', error);
        }
    };

    const filteredExchanges = exchanges.filter(ex => {
        if (activeTab === 'upcoming') return ex.status === 'accepted';
        if (activeTab === 'pending') return ex.status === 'pending';
        if (activeTab === 'history') return ['completed', 'rejected', 'cancelled'].includes(ex.status);
        return true;
    });

    const StatusBadge = ({ status }) => {
        const colors = {
            pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            accepted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
            completed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
        };
        return <span className={`px-2 py-1 text-xs font-semibold rounded-full capitalize ${colors[status]}`}>{status}</span>;
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mock Interview Hub</h1>
                        <p className="text-gray-600 dark:text-gray-400">Schedule practice sessions and exchange structured feedback with peers.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Request Interview
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                    {['upcoming', 'pending', 'history'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${activeTab === tab
                                    ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* List */}
                <div className="space-y-4">
                    {filteredExchanges.length === 0 ? (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">No {activeTab} interviews found.</p>
                        </div>
                    ) : (
                        filteredExchanges.map((ex) => (
                            <div key={ex.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{ex.subject}</h3>
                                        <StatusBadge status={ex.status} />
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        With <span className="font-medium text-gray-900 dark:text-white">{ex.partnerName}</span> • {new Date(ex.scheduledTime).toLocaleString()}
                                    </p>
                                    {ex.status === 'completed' && ex.feedback && (
                                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                                            <p className="font-medium text-gray-900 dark:text-white mb-1">Feedback Received:</p>
                                            <p className="text-gray-600 dark:text-gray-300 italic">"{ex.feedback.comments}"</p>
                                            <div className="flex gap-4 mt-2 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                <span>Communication: {ex.feedback.communication}/5</span>
                                                <span>Technical: {ex.feedback.technical}/5</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2 sm:flex-col">
                                    {ex.status === 'pending' && ex.role === 'receiver' && (
                                        <>
                                            <button className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">Accept</button>
                                            <button className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50 text-sm font-medium rounded-lg transition-colors">Reject</button>
                                        </>
                                    )}
                                    {ex.status === 'accepted' && (
                                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto">
                                            Join Session
                                        </button>
                                    )}
                                    {ex.status === 'completed' && !ex.feedback && ex.role === 'requester' && (
                                        <button className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors w-full sm:w-auto">
                                            Leave Feedback
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <PeerInterviewScheduler
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onSubmit={handleScheduleSubmit}
                />
            </div>
        </div>
    );
};

export default PeerMockInterviewHub;
