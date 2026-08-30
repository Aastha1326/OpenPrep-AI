/**
 * @fileoverview Main page for discovering study partners and accessing the shared resource hub.
 */
import React, { useState, useEffect } from 'react';
import PartnerMatchCard from '../components/Partners/PartnerMatchCard';
import axios from 'axios';

const StudyPartnerHub = () => {
    const [activeTab, setActiveTab] = useState('discover'); // 'discover' | 'hub'
    const [matches, setMatches] = useState([]);
    const [sharedHub, setSharedHub] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const matchesRes = await axios.get(`${API_URL}/study-partners/matches`);
                if (matchesRes.data.success) {
                    setMatches(matchesRes.data.data);
                }
            } catch (error) {
                console.error('Failed to fetch matches:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleRequestSent = async (partnerId) => {
        try {
            await axios.post(`${API_URL}/study-partners/request`, { targetUserId: partnerId });
            // In a real app, this would trigger a state update or notification
        } catch (error) {
            console.error('Failed to send request:', error);
        }
    };

    const loadSharedHub = async () => {
        setIsLoading(true);
        try {
            // Mock partner ID for demonstration
            const res = await axios.get(`${API_URL}/study-partners/user_1/hub`);
            if (res.data.success) {
                setSharedHub(res.data.data);
            }
        } catch (error) {
            console.error('Failed to load shared hub:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-5xl mx-auto">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Study Partner Hub</h1>
                        <p className="text-gray-600 dark:text-gray-400">Find compatible study partners and collaborate effectively.</p>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-200 dark:border-gray-700 mb-8">
                    <button
                        onClick={() => setActiveTab('discover')}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'discover'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Discover Partners
                    </button>
                    <button
                        onClick={() => { setActiveTab('hub'); loadSharedHub(); }}
                        className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'hub'
                                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        Shared Resource Hub
                    </button>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : activeTab === 'discover' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {matches.map(partner => (
                            <PartnerMatchCard
                                key={partner.id}
                                partner={partner}
                                onRequestSent={handleRequestSent}
                            />
                        ))}
                    </div>
                ) : (
                    sharedHub ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Joint Task Board */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>
                                    Joint Task Board
                                </h3>
                                <div className="space-y-3">
                                    {sharedHub.tasks.map(task => (
                                        <div key={task.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
                                            <input
                                                type="checkbox"
                                                checked={task.completed}
                                                readOnly
                                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <p className={`text-sm font-medium ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {task.title}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Assigned: {task.assignedTo}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resource Link Sharing */}
                            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                    Shared Resources
                                </h3>
                                <div className="space-y-3">
                                    {sharedHub.resources.map(resource => (
                                        <div key={resource.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer">
                                            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                                {resource.type === 'link' ? (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                ) : (
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{resource.title}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{resource.type}</p>
                                            </div>
                                        </div>
                                    ))}
                                    <button className="w-full py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg hover:border-blue-500 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-colors text-sm font-medium">
                                        + Add New Resource
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                            <p className="text-gray-500 dark:text-gray-400">No active partner connections found.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
};

export default StudyPartnerHub;
