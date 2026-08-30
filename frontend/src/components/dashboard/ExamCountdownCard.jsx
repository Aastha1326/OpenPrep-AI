import React, { useState, useEffect } from 'react';

export default function ExamCountdownCard({ targetExamName = 'JEE Main', examDateString = '2027-01-24T09:00:00' }) {
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  function calculateTimeLeft() {
    const difference = +new Date(examDateString) - +new Date();
    let timeLeft = {};

    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    } else {
      timeLeft = { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }
    return timeLeft;
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(timer);
  }, [examDateString]);

  return (
    <div className="exam-countdown-card p-5 bg-slate-900 border border-slate-800 rounded-xl max-w-sm shadow-xl font-sans">
      <header className="mb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-full">
          ⏱️ Active Milestone Tracker
        </span>
        <h3 className="text-sm font-bold text-white mt-2">Countdown to {targetExamName}</h3>
      </header>

      <div className="grid grid-cols-4 gap-2 text-center">
        {Object.entries(timeLeft).map(([unit, value]) => (
          <div key={unit} className="p-2 bg-slate-950 border border-slate-800 rounded-lg">
            <span className="block text-xl font-mono font-bold text-white">
              {String(value).padStart(2, '0')}
            </span>
            <span className="text-[9px] font-medium text-slate-500 uppercase tracking-wider block mt-0.5">
              {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
