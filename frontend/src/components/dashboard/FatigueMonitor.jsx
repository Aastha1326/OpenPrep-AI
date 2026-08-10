import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Coffee, X } from 'lucide-react';
import api from '../../services/api';

const FatigueMonitor = ({ sessionStartTime }) => {
  const [fatigueData, setFatigueData] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!sessionStartTime) return;

    const checkFatigue = async () => {
      try {
        const sessionDurationMinutes = (Date.now() - sessionStartTime) / (1000 * 60);
        // Mocking quiz accuracy for MVP
        const quizAccuracy = Math.max(0.4, 1 - (sessionDurationMinutes * 0.01)); 

        const res = await api.post('/study/evaluate', {
          sessionDurationMinutes,
          quizAccuracy,
          interactionsPerMinute: 3
        });

        if (res.data.isFatigued) {
          setFatigueData(res.data);
          setIsVisible(true);
        }
      } catch (err) {
        console.error('Failed to evaluate cognitive load', err);
      }
    };

    // Check every 5 minutes
    const intervalId = setInterval(checkFatigue, 5 * 60 * 1000);
    
    // For demo purposes, check after 10 seconds initially
    const demoId = setTimeout(checkFatigue, 10000);

    return () => {
      clearInterval(intervalId);
      clearTimeout(demoId);
    };
  }, [sessionStartTime]);

  return (
    <AnimatePresence>
      {isVisible && fatigueData && (
        <motion.div
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md bg-stone-900 text-stone-50 p-5 rounded-2xl shadow-2xl border border-amber-500/30 flex gap-4 items-start"
        >
          <div className="p-3 bg-amber-500/20 rounded-xl text-amber-400">
            <Brain className="w-8 h-8 animate-pulse" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-playfair font-bold text-xl text-amber-400 mb-1">
              Cognitive Load High
            </h3>
            <p className="text-sm text-stone-300 mb-4 leading-relaxed">
              {fatigueData.message}
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsVisible(false)}
                className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded-lg flex items-center justify-center gap-2 transition"
              >
                <Coffee className="w-4 h-4" />
                Take 5m Break
              </button>
              <button 
                onClick={() => setIsVisible(false)}
                className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 font-medium rounded-lg transition"
              >
                Dismiss
              </button>
            </div>
          </div>

          <button onClick={() => setIsVisible(false)} className="text-stone-500 hover:text-stone-300">
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default FatigueMonitor;
