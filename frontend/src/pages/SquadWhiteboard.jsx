/**
 * @fileoverview Main page integrating the collaborative whiteboard and mind-mapping canvas.
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import MindMapEngine from '../components/whiteboard/MindMapEngine';
import { io } from 'socket.io-client';

const SquadWhiteboard = () => {
    const { squadId } = useParams();
    const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'mindmap'
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
            query: { userId: 'mock-user-123', username: 'Student_A' }
        });
        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [squadId]);

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
            {/* Header */}
            <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Squad Workspace</h1>
                    <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                        <button
                            onClick={() => setActiveTab('canvas')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'canvas' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            Freehand Canvas
                        </button>
                        <button
                            onClick={() => setActiveTab('mindmap')}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'mindmap' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
                                }`}
                        >
                            Mind Map
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">3 members online</span>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 overflow-hidden">
                {activeTab === 'canvas' ? (
                    <WhiteboardCanvas
                        socket={socket}
                        squadId={squadId}
                        userId="mock-user-123"
                        username="Student_A"
                    />
                ) : (
                    <MindMapEngine socket={socket} squadId={squadId} />
                )}
            </main>
        </div>
    );
};

export default SquadWhiteboard;
