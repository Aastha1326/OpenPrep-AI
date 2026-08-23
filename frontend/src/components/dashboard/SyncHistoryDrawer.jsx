import React from 'react';
import { History, CheckCircle, RefreshCw } from 'lucide-react';

const SyncHistoryDrawer = ({ history = [] }) => {
  const defaultHistory = history.length > 0 ? history : [
    { id: '1', destination: 'Google Calendar', itemsCount: 4, timestamp: '10 mins ago', status: 'SUCCESS' },
    { id: '2', destination: 'Notion Database', itemsCount: 4, timestamp: 'Yesterday', status: 'SUCCESS' },
  ];

  return (
    <div className="bg-gray-900/60 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-md font-bold text-white flex items-center gap-2">
          <History size={18} className="text-purple-400" />
          Recent Sync Activity
        </h4>
        <button className="text-gray-400 hover:text-white transition-colors" title="Refresh">
          <RefreshCw size={15} />
        </button>
      </div>

      <div className="space-y-3">
        {defaultHistory.map((item) => (
          <div
            key={item.id}
            className="p-3 bg-gray-850/70 border border-gray-800 rounded-2xl flex items-center justify-between text-xs"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle size={16} className="text-emerald-400" />
              <div>
                <div className="font-bold text-white">{item.destination}</div>
                <div className="text-gray-400">{item.itemsCount} study blocks synced</div>
              </div>
            </div>
            <span className="text-gray-500 font-medium">{item.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SyncHistoryDrawer;
