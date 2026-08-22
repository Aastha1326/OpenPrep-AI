import React, { useState } from 'react';
import { Users, PlusCircle, LogIn, Copy, Check, Sparkles, Clock, HelpCircle, ShieldAlert } from 'lucide-react';

export default function RoomJoin({ onCreateRoom, onJoinRoom, onStartQuiz, roomState, currentUserId, isConnecting }) {
  const [activeTab, setActiveTab] = useState('join');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [quizTitle, setQuizTitle] = useState('Collaborative Study Challenge');
  const [timePerQuestion, setTimePerQuestion] = useState(20);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleJoinSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!joinRoomId.trim()) {
      setErrorMsg('Please enter a valid Room Code');
      return;
    }
    onJoinRoom(joinRoomId.trim().toUpperCase());
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    onCreateRoom({
      quizTitle,
      timePerQuestion: parseInt(timePerQuestion, 10),
    });
  };

  const handleCopyCode = () => {
    if (roomState?.roomId) {
      navigator.clipboard.writeText(roomState.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isHost = roomState?.hostUserId === currentUserId;

  return (
    <div className="max-w-2xl mx-auto p-6 md:p-8 bg-slate-900/90 border border-slate-800/80 rounded-2xl shadow-2xl backdrop-blur-xl text-white">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 text-amber-400">
          <Users className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200 bg-clip-text text-transparent">
          Realtime Collaborative Quiz
        </h2>
        <p className="text-slate-400 text-sm mt-2 max-w-md mx-auto">
          Study together in real time. Join a live quiz room with peers, answer synchronized questions, and track scores live.
        </p>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-sm flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Active Room Lobby View */}
      {roomState?.roomId ? (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-center">
            <span className="text-xs uppercase tracking-wider font-bold text-amber-400">Room Code</span>
            <div className="flex items-center justify-center gap-3 mt-2">
              <span className="font-mono text-4xl font-extrabold tracking-widest text-white">{roomState.roomId}</span>
              <button
                type="button"
                onClick={handleCopyCode}
                className="p-2.5 rounded-xl bg-slate-700/80 hover:bg-slate-600/80 text-amber-400 transition-colors"
                title="Copy Room Code"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">Share this code with your study group to let them join!</p>
          </div>

          {/* Participant Counter */}
          <div className="p-5 rounded-2xl bg-slate-800/40 border border-slate-700/40">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                Joined Participants ({roomState.participants?.length || 0})
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-medium">
                Live Lobby
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
              {roomState.participants?.map((p, idx) => (
                <div
                  key={p.userId || idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-500 to-orange-400 text-slate-950 font-bold flex items-center justify-center text-xs">
                      {p.username ? p.username.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <span className="text-sm font-medium text-slate-200">{p.username || 'Learner'}</span>
                  </div>
                  {p.isHost && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Host Controls */}
          {isHost ? (
            <button
              type="button"
              onClick={onStartQuiz}
              disabled={isConnecting}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-base shadow-lg shadow-amber-500/25 transition-all transform active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Start Collaborative Session
            </button>
          ) : (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-center text-sm font-medium animate-pulse">
              Waiting for the room host to start the quiz...
            </div>
          )}
        </div>
      ) : (
        /* Create / Join Tabs */
        <div>
          <div className="flex p-1.5 rounded-xl bg-slate-800/80 border border-slate-700/60 mb-6">
            <button
              type="button"
              onClick={() => setActiveTab('join')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'join'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LogIn className="w-4 h-4" />
              Join Room
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                activeTab === 'create'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PlusCircle className="w-4 h-4" />
              Create Room
            </button>
          </div>

          {activeTab === 'join' ? (
            <form onSubmit={handleJoinSubmit} className="space-y-5">
              <div>
                <label htmlFor="room-code-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Enter 6-Digit Room Code
                </label>
                <input
                  id="room-code-input"
                  type="text"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                  placeholder="e.g. QZ-8492"
                  maxLength={10}
                  className="w-full px-4 py-3.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 font-mono text-lg tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                Join Collaborative Session
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label htmlFor="quiz-title-input" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Quiz Topic / Title
                </label>
                <input
                  id="quiz-title-input"
                  type="text"
                  value={quizTitle}
                  onChange={(e) => setQuizTitle(e.target.value)}
                  placeholder="e.g. Computer Science Fundamentals"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              <div>
                <label htmlFor="time-per-q-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  Time Per Question
                </label>
                <select
                  id="time-per-q-select"
                  value={timePerQuestion}
                  onChange={(e) => setTimePerQuestion(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700/80 text-white text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                >
                  <option value={15}>15 Seconds (Fast)</option>
                  <option value={20}>20 Seconds (Standard)</option>
                  <option value={30}>30 Seconds (Relaxed)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isConnecting}
                className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                Create New Quiz Room
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
