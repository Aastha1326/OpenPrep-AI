import React from 'react';
import { FaUserGraduate } from 'react-icons/fa';

export default function ExaminerAvatar({ status = 'idle' }) {
  // status can be: 'idle', 'speaking', 'listening'
  return (
    <div className="flex flex-col items-center justify-center space-y-4 bg-neutral-900 border border-neutral-850 p-6 rounded-3xl w-full max-w-sm shadow-xl">
      <div className="relative">
        {/* Stylized background glowing effect */}
        <div className={`absolute inset-0 rounded-full blur-xl opacity-40 transition-all duration-700 ${
          status === 'speaking' ? 'bg-indigo-500 scale-110 animate-pulse' :
          status === 'listening' ? 'bg-emerald-500 scale-105 animate-pulse' :
          'bg-neutral-700'
        }`} />

        {/* Examiner Circle */}
        <div className={`relative w-28 h-28 rounded-full border-2 flex items-center justify-center bg-stone-950 transition-colors duration-500 ${
          status === 'speaking' ? 'border-indigo-500' :
          status === 'listening' ? 'border-emerald-500' :
          'border-neutral-800'
        }`}>
          <FaUserGraduate className={`text-5xl transition-transform duration-500 ${
            status === 'speaking' ? 'text-indigo-400 scale-105' :
            status === 'listening' ? 'text-emerald-400' :
            'text-neutral-500'
          }`} />

          {/* Eye blinking overlay simulator */}
          <div className="absolute top-10 flex gap-4 pointer-events-none">
            <span className="w-1.5 h-1 bg-stone-900 rounded-full animate-bounce" />
            <span className="w-1.5 h-1 bg-stone-900 rounded-full animate-bounce" style={{ animationDelay: '100ms' }} />
          </div>
        </div>
      </div>

      {/* Speaking/listening indicators */}
      <div className="text-center">
        <h4 className="text-stone-200 font-extrabold text-sm uppercase tracking-wider">AI Examiner Persona</h4>
        <p className="text-[10px] font-bold text-stone-500 mt-1 flex items-center justify-center gap-2">
          {status === 'speaking' && (
            <span className="flex items-center gap-1 text-indigo-400">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              SPEAKING
            </span>
          )}
          {status === 'listening' && (
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              LISTENING
            </span>
          )}
          {status === 'idle' && <span className="text-neutral-600">IDLE / WAITING</span>}
        </p>
      </div>

      {/* Stylized Audio Wave animation for Speaking */}
      {status === 'speaking' && (
        <div className="flex items-end justify-center gap-1 h-6">
          <span className="w-1 bg-indigo-500 rounded-full animate-bounce h-2" style={{ animationDelay: '100ms', animationDuration: '0.6s' }} />
          <span className="w-1 bg-indigo-500 rounded-full animate-bounce h-4" style={{ animationDelay: '200ms', animationDuration: '0.4s' }} />
          <span className="w-1 bg-indigo-500 rounded-full animate-bounce h-6" style={{ animationDelay: '300ms', animationDuration: '0.5s' }} />
          <span className="w-1 bg-indigo-500 rounded-full animate-bounce h-3" style={{ animationDelay: '400ms', animationDuration: '0.7s' }} />
          <span className="w-1 bg-indigo-500 rounded-full animate-bounce h-5" style={{ animationDelay: '500ms', animationDuration: '0.3s' }} />
        </div>
      )}
      {status !== 'speaking' && <div className="h-6" />}
    </div>
  );
}
