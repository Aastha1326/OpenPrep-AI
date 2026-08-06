import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

const QuizSession = ({ initialDuration = 600, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(initialDuration);

  useEffect(() => {
    // Check if we have an active attempt timestamp in sessionStorage
    const sessionKey = 'quiz_attempt_start';
    let startTime = sessionStorage.getItem(sessionKey);
    
    if (!startTime) {
      startTime = Date.now().toString();
      sessionStorage.setItem(sessionKey, startTime);
    }

    const calculateRemaining = () => {
      const elapsed = Math.floor((Date.now() - parseInt(startTime, 10)) / 1000);
      const remaining = Math.max(initialDuration - elapsed, 0);
      return remaining;
    };

    setTimeLeft(calculateRemaining());

    const timerInterval = setInterval(() => {
      const remaining = calculateRemaining();
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(timerInterval);
        sessionStorage.removeItem(sessionKey);
        if (onComplete) onComplete();
      }
    }, 1000);

    // Cleanup timer on unmount
    return () => {
      clearInterval(timerInterval);
    };
  }, [initialDuration, onComplete]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="flex items-center space-x-2 text-stone-700 bg-stone-100 px-3 py-1.5 rounded-full border border-stone-200">
      <Clock className="w-4 h-4 text-amber-700" />
      <span className="font-mono font-medium">
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
    </div>
  );
};

export default QuizSession;
