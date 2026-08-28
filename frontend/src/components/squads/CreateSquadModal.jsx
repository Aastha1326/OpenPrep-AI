import React, { useState } from 'react';

export default function CreateSquadModal({ isOpen, onClose, onCreate, onJoin }) {
  const [mode, setMode] = useState('create');
  const [name, setName] = useState('');
  const [sharedWhiteboardUrl, setSharedWhiteboardUrl] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md text-slate-100">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Study Squads</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">&times;</button>
        </div>
        
        <div className="flex gap-4 mb-6 border-b border-slate-700 pb-2">
          <button 
            className={`pb-1 ${mode === 'create' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}
            onClick={() => setMode('create')}
          >
            Create Squad
          </button>
          <button 
            className={`pb-1 ${mode === 'join' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}
            onClick={() => setMode('join')}
          >
            Join Squad
          </button>
        </div>

        {mode === 'create' ? (
          <div>
            <label className="block mb-2 text-sm font-medium">Squad Name</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 mb-4"
              placeholder="e.g. Exam Crushers"
            />
            <label className="block mb-2 text-sm font-medium">Shared Whiteboard Link (Optional)</label>
            <input 
              type="text" 
              value={sharedWhiteboardUrl} 
              onChange={(e) => setSharedWhiteboardUrl(e.target.value)}
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 mb-4"
              placeholder="e.g. https://excalidraw.com/..."
            />
            <button 
              onClick={() => onCreate(name, sharedWhiteboardUrl)}
              disabled={!name.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded"
            >
              Create Squad
            </button>
          </div>
        ) : (
          <div>
            <label className="block mb-2 text-sm font-medium">Invite Code</label>
            <input 
              type="text" 
              value={inviteCode} 
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              maxLength={6}
              className="w-full p-2 rounded bg-slate-700 border border-slate-600 mb-4 uppercase tracking-widest text-center"
              placeholder="6-CHAR CODE"
            />
            <button 
              onClick={() => onJoin(inviteCode)}
              disabled={inviteCode.length !== 6}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium py-2 px-4 rounded"
            >
              Join Squad
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
