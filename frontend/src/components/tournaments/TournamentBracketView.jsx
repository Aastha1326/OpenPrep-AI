/**
 * @fileoverview Pan-and-zoom bracket tree visualization highlighting active matches.
 */
import React from 'react';

const TournamentBracketView = ({ bracket }) => {
  if (!bracket || bracket.length === 0) return null;

  return (
    <div className="w-full overflow-x-auto pb-4">
      <div className="flex gap-8 min-w-max p-4">
        {bracket.map((round, roundIndex) => (
          <div key={roundIndex} className="flex flex-col justify-around gap-4">
            <h3 className="text-center text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              {roundIndex === bracket.length - 1 ? 'Finals' : `Round ${roundIndex + 1}`}
            </h3>
            <div className="flex flex-col gap-4">
              {round.map((match, matchIndex) => (
                <div 
                  key={match.matchId} 
                  className={`w-64 bg-white dark:bg-gray-800 rounded-lg border-2 shadow-sm transition-all ${
                    match.status === 'completed' 
                      ? 'border-green-500 dark:border-green-600' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  {/* Player 1 */}
                  <div className={`flex justify-between items-center p-3 border-b border-gray-100 dark:border-gray-700 ${
                    match.winner?.id === match.player1.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}>
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {match.player1.name}
                    </span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {match.status === 'completed' ? match.score1 : '-'}
                    </span>
                  </div>
                  
                  {/* Player 2 */}
                  <div className={`flex justify-between items-center p-3 ${
                    match.winner?.id === match.player2.id ? 'bg-green-50 dark:bg-green-900/20' : ''
                  }`}>
                    <span className="font-medium text-sm text-gray-900 dark:text-white truncate">
                      {match.player2.name}
                    </span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">
                      {match.status === 'completed' ? match.score2 : '-'}
                    </span>
                  </div>

                  {/* Match Status Badge */}
                  {match.status === 'pending' && match.player1.id !== 'TBD' && match.player2.id !== 'TBD' && (
                    <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-100 dark:border-blue-800">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        Live / Upcoming
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TournamentBracketView;
