import React from 'react';
import { Send, Clock } from 'lucide-react';

const MockRouteCard = ({ endpoint, onTest, isLoading }) => {
  return (
    <div className="p-4 rounded-2xl bg-gray-950 border border-gray-800 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono text-xs">
          <span className={`px-2 py-0.5 rounded font-extrabold text-[10px] ${
            endpoint.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {endpoint.method}
          </span>
          <span className="font-bold text-white">{endpoint.path}</span>
        </div>
        <span className="text-[11px] font-mono text-gray-400 flex items-center gap-1">
          <Clock size={12} /> {endpoint.delayMs}ms delay
        </span>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-xs text-gray-400">{endpoint.name}</span>
        <button
          onClick={onTest}
          disabled={isLoading}
          className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
        >
          <Send size={12} /> Test Request
        </button>
      </div>
    </div>
  );
};

export default MockRouteCard;
