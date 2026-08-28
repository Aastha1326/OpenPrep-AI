import React, { useState, useEffect } from 'react';

export default function ActiveSessionsManager() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/auth/sessions');
      if (res.ok) {
        const data = await res.json();
        setSessions(data || []);
      }
    } catch (err) {
      console.error('Failed to parse active authentication device states:', err);
    } finally {
      setLoading(false);
    }
  };

  const terminateSession = async (sessionId) => {
    setProcessingId(sessionId);
    try {
      const res = await fetch(`/api/auth/sessions/${sessionId}`, { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
      }
    } catch (err) {
      console.error('Error handling targeted device eviction metrics:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const terminateOtherDevices = async () => {
    if (!window.confirm('Are you sure you want to log out of all other active sessions and devices?')) return;
    try {
      const res = await fetch('/api/auth/sessions/other', { method: 'DELETE' });
      if (res.ok) {
        setSessions(prev => prev.filter(s => s.isCurrentDevice));
      }
    } catch (err) {
      console.error('Multi-session clear-out failure:', err);
    }
  };

  if (loading) return <div className="p-4 text-xs font-mono text-slate-500 animate-pulse">Auditing active login signatures...</div>;

  return (
    <div className="active-sessions-container p-6 bg-slate-900 border border-slate-800 text-white rounded-xl max-w-2xl shadow-xl font-sans">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-sm font-bold tracking-wide uppercase text-indigo-400">📱 Active Device Management</h2>
          <p className="text-[11px] text-slate-400 mt-0.5">Monitor and manage your currently authenticated system contexts.</p>
        </div>
        {sessions.length > 1 && (
          <button
            onClick={terminateOtherDevices}
            className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/60 border border-rose-800/40 text-rose-400 font-semibold text-xs rounded-lg transition-colors"
          >
            Log Out All Other Devices
          </button>
        )}
      </header>

      {/* --- DEVICES INVENTORY LIST MATRIX --- */}
      <div className="divide-y divide-slate-800 space-y-3">
        {sessions.map((session) => (
          <div key={session.id} className="pt-3 flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="text-xl pt-0.5" role="img" aria-label="Device Icon">
                {session.os?.toLowerCase().includes('windows') || session.os?.toLowerCase().includes('mac') ? '💻' : '📱'}
              </span>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-200">{session.os} — {session.browser}</span>
                  {session.isCurrentDevice && (
                    <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase">
                      Current Device
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  📍 {session.country || 'Unknown Geo'} | IP: {session.ipAddress}
                </p>
                <p className="text-[10px] text-slate-500">
                  Last active: {new Date(session.lastActiveAt).toLocaleString()}
                </p>
              </div>
            </div>

            {!session.isCurrentDevice && (
              <button
                onClick={() => terminateSession(session.id)}
                disabled={processingId === session.id}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-[11px] rounded transition-colors disabled:opacity-40"
              >
                Revoke
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
