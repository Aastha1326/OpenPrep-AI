import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { CollaborativeInterviewRoom } from '../components/Interview/CollaborativeInterviewRoom';
import { Code2, Shield, UserCheck, Sparkles, ArrowRight } from 'lucide-react';

export function InterviewRoomPage() {
  const { roomId: urlRoomId } = useParams();
  const navigate = useNavigate();
  const authUser = useSelector((state) => state.auth?.user);

  const [roomIdInput, setRoomIdInput] = useState(urlRoomId || '');
  const [role, setRole] = useState('candidate');
  const [nameInput, setNameInput] = useState(authUser?.name || '');
  const [isJoined, setIsJoined] = useState(Boolean(urlRoomId));

  const handleCreateNewRoom = () => {
    const generatedId = `interview-${Math.random().toString(36).substring(2, 9)}`;
    setRoomIdInput(generatedId);
  };

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    if (!roomIdInput.trim()) return;

    const targetRoomId = roomIdInput.trim();
    setIsJoined(true);
    navigate(`/interview/${targetRoomId}`, { replace: true });
  };

  const handleLeaveRoom = () => {
    setIsJoined(false);
    navigate('/interview', { replace: true });
  };

  if (isJoined && (urlRoomId || roomIdInput)) {
    const activeRoomId = urlRoomId || roomIdInput;
    return (
      <CollaborativeInterviewRoom
        roomId={activeRoomId}
        role={role}
        user={{ name: nameInput || authUser?.name || 'Anonymous User', id: authUser?.id }}
        onLeave={handleLeaveRoom}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Dynamic Background Glows */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-lg bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-2xl relative z-10">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/30">
            <Code2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-300 bg-clip-text text-transparent">
              Live Coding Interview Room
            </h1>
            <p className="text-xs text-slate-400">
              Pair-program in real time with shared Monaco editor & instant output execution.
            </p>
          </div>
        </div>

        <form onSubmit={handleJoinSubmit} className="space-y-5">
          {/* User Name */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Your Name
            </label>
            <input
              type="text"
              required
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="e.g. Alex Rivera"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('candidate')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                  role === 'candidate'
                    ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-md shadow-blue-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>Candidate</span>
              </button>

              <button
                type="button"
                onClick={() => setRole('interviewer')}
                className={`flex items-center justify-center space-x-2 py-3 px-4 rounded-xl text-xs font-bold border transition-all ${
                  role === 'interviewer'
                    ? 'bg-pink-600/20 border-pink-500 text-pink-300 shadow-md shadow-pink-500/10'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <Shield className="w-4 h-4" />
                <span>Interviewer</span>
              </button>
            </div>
          </div>

          {/* Room ID Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Interview Room Code
              </label>
              <button
                type="button"
                onClick={handleCreateNewRoom}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-medium flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>Generate New Code</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={roomIdInput}
              onChange={(e) => setRoomIdInput(e.target.value)}
              placeholder="e.g. interview-room-789"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono text-sm text-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 active:scale-98"
          >
            <span>Enter Collaborative Room</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default InterviewRoomPage;
