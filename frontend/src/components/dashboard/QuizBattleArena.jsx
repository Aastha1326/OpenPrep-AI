import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Trophy, Clock, X, Zap } from 'lucide-react';
import api from '../../services/api';

/**
 * MVP Gamified Live Quiz Battle Arena (Issue #1297)
 */
const QuizBattleArena = ({ onClose }) => {
  const [gameState, setGameState] = useState('LOBBY'); // LOBBY -> MATCHMAKING -> BATTLE -> PODIUM
  const [opponent, setOpponent] = useState(null);
  
  // Battle state
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Podium State
  const [eloDiff, setEloDiff] = useState(0);

  const startMatchmaking = async () => {
    setGameState('MATCHMAKING');
    try {
      const res = await api.post('/battle/matchmake');
      if (res.data?.matchFound) {
        setOpponent(res.data.opponent);
        setGameState('BATTLE');
        startTimer();
      }
    } catch (err) {
      console.error(err);
      setGameState('LOBBY'); // Revert on fail
    }
  };

  const startTimer = () => {
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          finishMatch();
          return 0;
        }
        return prev - 1;
      });
      
      // Simulate opponent scoring
      if (Math.random() > 0.7) {
        setOpponentScore(s => s + 100);
      }
    }, 1000);
  };

  const handleAnswer = (correct) => {
    if (correct) {
      // Speed bonus based on time left
      const points = 100 + Math.floor(timeLeft * 5);
      setScore(s => s + points);
    }
  };

  const finishMatch = async () => {
    setGameState('PODIUM');
    try {
      // Mock calculating Elo based on win/loss
      const won = score >= opponentScore;
      const res = await api.post('/battle/elo', {
        won,
        myCurrentElo: 1400,
        opponentElo: 1450
      });
      if (res.data?.diff) {
        setEloDiff(res.data.diff);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
    >
      <div className="bg-stone-900 border-2 border-stone-700 w-full max-w-5xl h-[85vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl relative">
        
        {/* Dynamic Background based on state */}
        <div className={`absolute inset-0 opacity-20 pointer-events-none transition-colors duration-1000 ${
          gameState === 'BATTLE' ? 'bg-red-900' : gameState === 'PODIUM' ? 'bg-amber-900' : 'bg-indigo-900'
        }`} />
        
        {/* Header */}
        <div className="p-4 flex justify-between items-center relative z-10">
          <div className="flex items-center gap-3">
            <Swords className="w-8 h-8 text-amber-500" />
            <h2 className="text-2xl font-bold font-playfair text-white tracking-wider">RANKED BATTLE</h2>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-white p-2">
            <X className="w-8 h-8" />
          </button>
        </div>

        <div className="flex-1 relative z-10 flex flex-col items-center justify-center p-8">
          <AnimatePresence mode="wait">
            
            {/* LOBBY STATE */}
            {gameState === 'LOBBY' && (
              <motion.div 
                key="lobby"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <div className="w-32 h-32 mx-auto bg-stone-800 rounded-full flex items-center justify-center border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.3)] mb-8">
                  <Trophy className="w-16 h-16 text-amber-500" />
                </div>
                <h3 className="text-4xl font-bold text-white mb-2">Current Rank: Gold II</h3>
                <p className="text-stone-400 text-lg mb-8">Elo: 1400</p>
                
                <button 
                  onClick={startMatchmaking}
                  className="bg-amber-600 hover:bg-amber-500 text-white text-2xl font-bold px-12 py-4 rounded-full shadow-[0_0_20px_rgba(217,119,6,0.5)] transition hover:scale-105 active:scale-95"
                >
                  Find Match
                </button>
              </motion.div>
            )}

            {/* MATCHMAKING STATE */}
            {gameState === 'MATCHMAKING' && (
              <motion.div 
                key="matchmaking"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="text-center"
              >
                <div className="w-24 h-24 mx-auto rounded-full border-4 border-t-amber-500 border-r-amber-500 border-b-transparent border-l-transparent animate-spin mb-8" />
                <h3 className="text-3xl font-bold text-amber-500 animate-pulse">Searching for opponent...</h3>
                <p className="text-stone-400 mt-2">Estimated wait: 0:02</p>
              </motion.div>
            )}

            {/* BATTLE STATE */}
            {gameState === 'BATTLE' && (
              <motion.div 
                key="battle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col"
              >
                {/* Score Header */}
                <div className="flex justify-between items-center mb-8 bg-stone-950/50 p-4 rounded-2xl border border-stone-800">
                  <div className="flex items-center gap-4">
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=You" alt="You" className="w-16 h-16 rounded-full bg-stone-800" />
                    <div>
                      <p className="text-stone-400 text-sm">YOU</p>
                      <p className="text-3xl font-bold text-blue-400">{score}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-2 text-amber-500 text-2xl font-mono font-bold bg-black/50 px-6 py-2 rounded-xl">
                      <Clock className="w-6 h-6" />
                      {timeLeft}s
                    </div>
                    {/* Time Bar */}
                    <div className="w-48 h-2 bg-stone-800 rounded-full mt-3 overflow-hidden">
                      <motion.div 
                        className="h-full bg-amber-500"
                        initial={{ width: '100%' }}
                        animate={{ width: `${(timeLeft / 30) * 100}%` }}
                        transition={{ duration: 1, ease: 'linear' }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <p className="text-stone-400 text-sm">{opponent?.name?.toUpperCase()}</p>
                      <p className="text-3xl font-bold text-red-400">{opponentScore}</p>
                    </div>
                    <img src={opponent?.avatar} alt="Opponent" className="w-16 h-16 rounded-full bg-stone-800" />
                  </div>
                </div>

                {/* Question Area (Mock) */}
                <div className="flex-1 flex flex-col items-center justify-center">
                  <h3 className="text-3xl text-center text-white font-serif mb-12 max-w-2xl leading-relaxed">
                    What is the primary function of the powerhouse of the cell?
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
                    <button onClick={() => handleAnswer(false)} className="p-6 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-left text-xl text-stone-200 transition">A) Photosynthesis</button>
                    <button onClick={() => handleAnswer(true)} className="p-6 bg-blue-900/40 hover:bg-blue-600 border border-blue-500/50 rounded-xl text-left text-xl text-white transition shadow-[0_0_15px_rgba(59,130,246,0.3)]">B) ATP Production</button>
                    <button onClick={() => handleAnswer(false)} className="p-6 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-left text-xl text-stone-200 transition">C) DNA Storage</button>
                    <button onClick={() => handleAnswer(false)} className="p-6 bg-stone-800 hover:bg-stone-700 border border-stone-700 rounded-xl text-left text-xl text-stone-200 transition">D) Protein Synthesis</button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* PODIUM STATE */}
            {gameState === 'PODIUM' && (
              <motion.div 
                key="podium"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                <h2 className="text-6xl font-bold font-playfair mb-4">
                  {score >= opponentScore ? <span className="text-amber-400">VICTORY</span> : <span className="text-stone-500">DEFEAT</span>}
                </h2>
                
                <div className="flex justify-center items-end gap-8 h-48 mb-12">
                  {/* Loser */}
                  <div className="flex flex-col items-center">
                    <img src={score >= opponentScore ? opponent?.avatar : "https://api.dicebear.com/7.x/avataaars/svg?seed=You"} alt="Loser" className="w-16 h-16 rounded-full mb-2 bg-stone-800 opacity-50" />
                    <div className="w-24 h-24 bg-stone-800 rounded-t-lg flex items-center justify-center border-t border-stone-600">
                      <span className="text-2xl font-bold text-stone-500">2nd</span>
                    </div>
                  </div>
                  
                  {/* Winner */}
                  <div className="flex flex-col items-center relative -top-8">
                    <img src={score >= opponentScore ? "https://api.dicebear.com/7.x/avataaars/svg?seed=You" : opponent?.avatar} alt="Winner" className="w-20 h-20 rounded-full mb-2 bg-amber-500/20 border-4 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]" />
                    <div className="w-32 h-32 bg-amber-600 rounded-t-lg flex items-center justify-center border-t-2 border-amber-400">
                      <span className="text-4xl font-bold text-white">1st</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 text-3xl font-bold">
                  <span className="text-stone-300">Elo Rating:</span>
                  <span className={eloDiff >= 0 ? "text-emerald-400" : "text-red-400"}>
                    {eloDiff >= 0 ? '+' : ''}{eloDiff}
                  </span>
                  <Zap className="w-6 h-6 text-amber-500" />
                </div>
                
                <button 
                  onClick={() => setGameState('LOBBY')}
                  className="mt-12 bg-stone-800 hover:bg-stone-700 text-white px-8 py-3 rounded-xl transition border border-stone-600"
                >
                  Return to Lobby
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};

export default QuizBattleArena;
