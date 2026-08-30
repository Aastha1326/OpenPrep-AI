import React from 'react';
import { Activity, ArrowRight, Clock } from 'lucide-react';

const mockLogs = [
  { id: '1', method: 'GET', path: '/api/v1/users/me', status: 200, duration: '120ms', time: '18:42:10' },
  { id: '2', method: 'POST', path: '/api/v1/quizzes/submit', status: 201, duration: '245ms', time: '18:42:15' },
  { id: '3', method: 'GET', path: '/api/v1/recommendations', status: 200, duration: '180ms', time: '18:42:22' },
  { id: '4', method: 'DELETE', path: '/api/v1/flashcards/card_982', status: 204, duration: '95ms', time: '18:42:30' },
];

const TrafficInspectorTimeline = () => {
  return (
    <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
          <Activity size={16} className="text-violet-400" />
          Real-Time Request Traffic Waterfall
        </h4>
        <span className="text-xs font-mono text-gray-400">Total Calls: {mockLogs.length}</span>
      </div>

      <div className="space-y-2">
        {mockLogs.map((log) => (
          <div
            key={log.id}
            className="p-3 bg-gray-900 rounded-xl border border-gray-850 flex items-center justify-between text-xs font-mono"
          >
            <div className="flex items-center gap-3">
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                log.method === 'GET' ? 'bg-blue-500/20 text-blue-400' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {log.method}
              </span>
              <span className="text-white">{log.path}</span>
            </div>

            <div className="flex items-center gap-4 text-gray-400">
              <span className="text-emerald-400 font-bold">HTTP {log.status}</span>
              <span className="flex items-center gap-1 text-gray-400">
                <Clock size={12} /> {log.duration}
              </span>
              <span className="text-[10px] text-gray-500">{log.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrafficInspectorTimeline;
