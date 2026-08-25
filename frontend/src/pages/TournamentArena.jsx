/**
 * @fileoverview Live match arena with side-by-side scoreboards, real-time questions, and spectator features.
 */
import React, { useState, useEffect } from 'react';
import TournamentBracketView from '../components/tournaments/TournamentBracketView';
import axios from 'axios';

const TournamentArena = () => {
  const [tournament, setTournament] = useState(null);
  const [activeTab, setActiveTab] = useState('bracket'); // 'bracket' | 'live-match'
  
  // Mock live match state
  const [liveMatch, setLiveMatch] = useState({
    player1: { name: 'Squad Alpha', score: 340 },
    player2: { name: 'Squad Beta', score: 310 },
    timeLeft: 45,
    currentQuestion: 'What is the time complexity of QuickSort in the average case?',
    spectators: 124
  });

  const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  useEffect(() => {
    // Mock fetching tournament data
    const mockTournament = {
      id: 'trn_123',
      name: 'CS101 Midterm Knockout',
      bracket: [
        [
          { matchId: 'm_1_0', player1: { id: '1', name: 'Squad Alpha' }, player2: { id: '2', name: 'Squad Beta' }, winner: null, score1: 0, score2: 0, status: 'pending' },
          { matchId: 'm_1_1', player1: { id: '3', name: 'Squad Gamma' }, player2: { id: '4', name: 'Squad Delta' }, winner: { id: '3', name: 'Squad Gamma' }, score1: 400, score2: 350, status: 'completed' }
        ],
        [
          { matchId: 'm_2_0', player1: { id: 'TBD', name: 'TBD' }, player2: { id: '3', name: 'Squad Gamma' }, winner: null, score1: 0, score2: 0, status: 'pending' }
        ]
      ]
    };
    setTournament(mockTournament);

    // Mock countdown timer
    const timer = setInterval(() => {
      setLiveMatch(prev => ({
        ...prev,
        timeLeft: prev.timeLeft > 0 ? prev.timeLeft - 1 : 60
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex flex-col">
      {/* Header */}
      <header className="h-16 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-6 shrink-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {tournament?.name || 'Tournament Arena'}
        </h1>
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('bracket')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'bracket' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Bracket View
          </button>
          <button
            onClick={() => setActiveTab('live-match')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors flex items-center gap-2 ${
              activeTab === 'live-match' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            Live Match
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6 overflow-hidden">
        {activeTab === 'bracket' && tournament && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full overflow-auto">
            <TournamentBracketView bracket={tournament.bracket} />
          </div>
        )}

        {activeTab === 'live-match' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Match Arena */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-8 flex flex-col">
              {/* Scoreboard */}
              <div className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200 dark:border-gray-800">
                <div className="text-center flex-1">
                  <h2 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{liveMatch.player1.name}</h2>
                  <p className="text-4xl font-mono font-bold text-gray-900 dark:text-white mt-2">{liveMatch.player1.score}</p>
                </div>
                
                <div className="px-6 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center mx-4">
                  <p className="text-xs text-red-600 dark:text-red-400 uppercase font-bold tracking-wider mb-1">Time Left</p>
                  <p className="text-3xl font-mono font-bold text-red-700 dark:text-red-300">00:{liveMatch.timeLeft.toString().padStart(2, '0')}</p>
                </div>

                <div className="text-center flex-1">
                  <h2 className="text-2xl font-bold text-purple-600 dark:text-purple-400">{liveMatch.player2.name}</h2>
                  <p className="text-4xl font-mono font-bold text-gray-900 dark:text-white mt-2">{liveMatch.player2.score}</p>
                </div>
              </div>

              {/* Question Area */}
              <div className="flex-1 flex items-center justify-center">
                <div className="max-w-2xl text-center">
                  <span className="inline-block px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-sm font-medium mb-4">
                    Question 4 of 10
                  </span>
                  <h3 className="text-2xl font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {liveMatch.currentQuestion}
                  </h3>
                </div>
              </div>
            </div>

            {/* Spectator Sidebar */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">Spectators</h3>
                <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold rounded-full">
                  {liveMatch.spectators} Live
                </span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-3 mb-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Spectator_{i}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Let's go Squad Alpha! 🔥</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Cheer for your squad..."
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default TournamentArena;
