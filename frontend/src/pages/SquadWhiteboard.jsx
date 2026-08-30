/**
 * @fileoverview Main page integrating the collaborative whiteboard and mind-mapping canvas.
 */
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import WhiteboardCanvas from '../components/whiteboard/WhiteboardCanvas';
import MindMapEngine from '../components/whiteboard/MindMapEngine';
import { socket, connectSocket } from '../services/socket';

const SquadWhiteboard = () => {
  const { squadId } = useParams();
  const [activeTab, setActiveTab] = useState('canvas'); // 'canvas' | 'mindmap'
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Connect shared socket and authenticate
    connectSocket();
    
    return () => {
      // We don't disconnect the global socket, but we can emit a leave if needed.
    };
  }, [squadId]);

  const currentUserId = user?.id || 'mock-user-123';
  const currentUsername = user?.username || 'Student_A';

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-6 shrink-0 shadow-sm">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Squad Workspace</h1>
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('canvas')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'canvas'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Freehand Canvas
            </button>
            <button
              onClick={() => setActiveTab('mindmap')}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                activeTab === 'mindmap'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              Mind Map
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-sm text-slate-600 dark:text-slate-400">Collaboration active</span>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 overflow-hidden">
        {activeTab === 'canvas' ? (
          <WhiteboardCanvas
            socket={socket}
            squadId={squadId}
            roomId={squadId || 'global_squad'}
            userId={currentUserId}
            username={currentUsername}
          />
        ) : (
          <MindMapEngine socket={socket} squadId={squadId} />
        )}
      </main>
    </div>
  );
};

export default SquadWhiteboard;
