import React, { useState, useEffect } from 'react';
import JobAnalyticsHUD from '../components/kanban/JobAnalyticsHUD';
import JobCard from '../components/kanban/JobCard';

// Dummy static backend to substitute API calls for demo purpose
const API_MOCK = {
    analytics: {
        totalPipelines: 12,
        conversionRateToInterview: '40.0%',
        conversionRateToOffer: '25.0%',
        averageDaysToOffer: 14,
        activeApplications: 8
    },
    board: {
        'Wishlist': [
            { id: '1', companyName: 'Stripe', roleTitle: 'Frontend Engineer', status: 'Wishlist', location: 'Remote', expectedSalary: 140000, colorTag: '#6366f1' },
            { id: '2', companyName: 'Netflix', roleTitle: 'UI Developer', status: 'Wishlist', location: 'Los Gatos, CA', expectedSalary: 160000, colorTag: '#ef4444' }
        ],
        'Applied': [
            { id: '3', companyName: 'Discord', roleTitle: 'Software Engineer', status: 'Applied', location: 'San Francisco, CA', colorTag: '#5865F2' }
        ],
        'Interviewing': [
            { id: '4', companyName: 'Vercel', roleTitle: 'Developer Success Engineer', status: 'Interviewing', location: 'Remote', colorTag: '#000000' }
        ],
        'Offered': [
            { id: '5', companyName: 'OpenAI', roleTitle: 'React Developer', status: 'Offered', location: 'San Francisco, CA', offeredSalary: 180000, colorTag: '#10a37f' }
        ],
        'Rejected': [],
        'Accepted': []
    }
};

const JobKanbanTerminal = () => {
    const [board, setBoard] = useState(API_MOCK.board);
    const [analytics, setAnalytics] = useState(API_MOCK.analytics);
    const [draggedJob, setDraggedJob] = useState(null);
    const [sourceCol, setSourceCol] = useState(null);

    // Mock fetch on mount
    useEffect(() => {
        // Normally this would fetch from /api/jobs/board and /api/jobs/analytics
    }, []);

    const COLUMNS = ['Wishlist', 'Applied', 'Interviewing', 'Offered', 'Rejected', 'Accepted'];

    const handleDragStart = (e, job, colId) => {
        setDraggedJob(job);
        setSourceCol(colId);
        e.dataTransfer.effectAllowed = 'move';
        // e.dataTransfer.setDragImage(...)
        e.dataTransfer.setData('text/plain', job.id);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, targetColId) => {
        e.preventDefault();
        const jobId = e.dataTransfer.getData('text/plain');
        if (!jobId || !draggedJob) return;

        if (sourceCol === targetColId) {
            // Reordering logic mapped to API would go here
            return;
        }

        // Optimistic UI Update
        const newBoard = { ...board };
        newBoard[sourceCol] = newBoard[sourceCol].filter(j => j.id !== jobId);

        const updatedJob = { ...draggedJob, status: targetColId };
        newBoard[targetColId] = [...newBoard[targetColId], updatedJob];

        setBoard(newBoard);
        setDraggedJob(null);
        setSourceCol(null);

        // Normally we trigger API call: moveJob API endpoint
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-8 font-sans overflow-x-auto bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]">

            {/* Header section with HUD */}
            <div className="max-w-7xl mx-auto mb-8">
                <JobAnalyticsHUD analytics={analytics} />
            </div>

            {/* Kanban Board */}
            <div className="flex gap-6 max-w-[1400px] mx-auto overflow-x-auto pb-4 snap-x">
                {COLUMNS.map(colId => (
                    <div
                        key={colId}
                        className="flex-shrink-0 w-80 bg-white/5 border border-white/10 rounded-2xl flex flex-col snap-center backdrop-blur-xl transition-colors duration-200 py-4"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, colId)}
                    >
                        <div className="px-5 mb-4 flex justify-between items-center">
                            <h3 className="font-bold text-gray-200 tracking-wider">
                                {colId}
                            </h3>
                            <span className="bg-white/10 text-xs py-1 px-3 rounded-full text-gray-400 font-mono">
                                {board[colId]?.length || 0}
                            </span>
                        </div>

                        <div className="flex-1 overflow-y-auto px-4 space-y-4 min-h-[300px]">
                            {board[colId]?.map((job, index) => (
                                <div
                                    key={job.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, job, colId)}
                                    className="cursor-grab active:cursor-grabbing"
                                >
                                    <JobCard
                                        job={job}
                                        isDragging={draggedJob?.id === job.id}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

        </div>
    );
};

export default JobKanbanTerminal;
