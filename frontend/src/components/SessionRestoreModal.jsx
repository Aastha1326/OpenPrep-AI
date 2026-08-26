import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { RotateCcw, Trash2, Clock, CheckCircle2, Bookmark } from 'lucide-react';

export function SessionRestoreModal({ savedSession, onClose }) {
  const navigate = useNavigate();
  const [isRestoring, setIsRestoring] = useState(false);

  if (!savedSession || !savedSession.payload) return null;

  const { payload } = savedSession;
  const savedRoute = payload.currentRoute || '/dashboard';
  const savedAt = payload.savedAt ? new Date(payload.savedAt).toLocaleString() : 'Recent';

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      // Restore quiz progress into localStorage if available
      if (payload.quizProgress && typeof payload.quizProgress === 'object') {
        Object.entries(payload.quizProgress).forEach(([key, val]) => {
          localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
        });
      }

      // Call API to mark session restored
      await API.post('/session/restore', {
        sessionId: savedSession.id,
        action: 'restore',
      });

      onClose();
      navigate(savedRoute, { replace: true });
    } catch (err) {
      console.warn('Failed to restore session:', err.message);
      onClose();
    } finally {
      setIsRestoring(false);
    }
  };

  const handleDiscard = async () => {
    try {
      await API.post('/session/restore', {
        sessionId: savedSession.id,
        action: 'discard',
      });
    } catch (err) {
      console.warn('Failed to discard session:', err.message);
    } finally {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md font-sans"
      data-testid="session-restore-modal"
    >
      <div className="bg-slate-900 border border-indigo-500/40 rounded-2xl p-6 max-w-md w-full shadow-2xl text-slate-100 relative">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Bookmark className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Unsaved Study Session Found</h2>
            <p className="text-xs text-slate-400">Restore your in-progress state from your previous session.</p>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 mb-5 space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">Saved Route:</span>
            <span className="font-mono text-indigo-400 font-semibold">{savedRoute}</span>
          </div>

          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-500">Saved At:</span>
            <span className="flex items-center space-x-1 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>{savedAt}</span>
            </span>
          </div>

          {payload.reason && (
            <div className="flex items-center justify-between text-slate-300">
              <span className="text-slate-500">Trigger Reason:</span>
              <span className="text-slate-400 font-mono text-[11px]">{payload.reason}</span>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleDiscard}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all flex items-center justify-center space-x-1.5"
          >
            <Trash2 className="w-4 h-4 text-slate-400" />
            <span>Discard</span>
          </button>

          <button
            type="button"
            onClick={handleRestore}
            disabled={isRestoring}
            className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center space-x-1.5 disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isRestoring ? 'Restoring...' : 'Restore Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SessionRestoreModal;
