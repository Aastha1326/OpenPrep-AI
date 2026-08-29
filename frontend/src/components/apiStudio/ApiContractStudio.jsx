import React, { useState } from 'react';
import { Server, Plus, Play, Activity, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import TrafficInspectorTimeline from './TrafficInspectorTimeline';
import MockRouteCard from './MockRouteCard';

const defaultEndpoints = [
  {
    id: 'ep_1',
    name: 'Get Current User Profile',
    path: '/api/v1/users/me',
    method: 'GET',
    statusCode: 200,
    delayMs: 120,
    responseSchema: { id: 'string:id', name: 'string:name', email: 'string:email', active: true },
    callCount: 14,
  },
  {
    id: 'ep_2',
    name: 'Submit Study Quiz Attempt',
    path: '/api/v1/quizzes/submit',
    method: 'POST',
    statusCode: 201,
    delayMs: 250,
    responseSchema: { submissionId: 'string:id', score: 85, passed: true },
    callCount: 8,
  },
];

const ApiContractStudio = () => {
  const [endpoints, setEndpoints] = useState(defaultEndpoints);
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'traffic'
  const [selectedResponse, setSelectedResponse] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTestDispatch = (ep) => {
    setLoading(true);
    setTimeout(() => {
      setSelectedResponse({
        status: ep.statusCode,
        delay: ep.delayMs,
        data: {
          ...ep.responseSchema,
          _meta: { timestamp: new Date().toISOString(), latency: `${ep.delayMs}ms` },
        },
      });
      setEndpoints((prev) =>
        prev.map((item) => (item.id === ep.id ? { ...item, callCount: item.callCount + 1 } : item))
      );
      setLoading(false);
    }, Math.min(ep.delayMs, 500));
  };

  return (
    <div className="bg-gray-900/70 p-6 rounded-3xl border border-gray-800 backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-violet-500/10 text-violet-400 rounded-2xl border border-violet-500/20">
            <Server size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">API Contract Studio & Mock Server</h3>
            <p className="text-xs text-gray-400">Define REST Endpoints, Emulate Network Latency & Inspect Traffic</p>
          </div>
        </div>

        <div className="flex bg-gray-850 p-1 rounded-xl border border-gray-700">
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'studio' ? 'bg-violet-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            Mock Routes ({endpoints.length})
          </button>
          <button
            onClick={() => setActiveTab('traffic')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'traffic' ? 'bg-violet-500 text-white shadow' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity size={13} /> Traffic Timeline
          </button>
        </div>
      </div>

      {activeTab === 'studio' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Endpoints List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Endpoints</span>
            </div>

            {endpoints.map((ep) => (
              <MockRouteCard
                key={ep.id}
                endpoint={ep}
                onTest={() => handleTestDispatch(ep)}
                isLoading={loading}
              />
            ))}
          </div>

          {/* Test Response Console */}
          <div className="bg-gray-950 p-5 rounded-2xl border border-gray-800 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white">Live Response Output</h4>
                {selectedResponse && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    HTTP {selectedResponse.status} • {selectedResponse.delay}ms
                  </span>
                )}
              </div>

              {selectedResponse ? (
                <pre className="p-4 rounded-xl bg-gray-900 border border-gray-800 text-xs font-mono text-violet-300 overflow-x-auto select-all max-h-72">
                  {JSON.stringify(selectedResponse.data, null, 2)}
                </pre>
              ) : (
                <div className="text-center py-12 text-gray-500 text-xs">
                  Click "Send Test Request" on any route to execute mock dispatch.
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <TrafficInspectorTimeline />
      )}
    </div>
  );
};

export default ApiContractStudio;
