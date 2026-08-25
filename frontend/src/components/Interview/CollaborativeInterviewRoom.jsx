import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { useInterviewSocket } from '../../hooks/useInterviewSocket';
import { CollaborativeCodeEditor } from './CollaborativeCodeEditor';
import {
  Users,
  MessageSquare,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Copy,
  Check,
  Code2,
  Send,
  LogOut,
  Shield,
  UserCheck,
  Sparkles,
} from 'lucide-react';

export function CollaborativeInterviewRoom({ roomId, role = 'candidate', user = {}, onLeave }) {
  const dispatch = null; // State handled via hook & Redux
  const [activeTab, setActiveTab] = useState('participants');
  const [chatInput, setChatInput] = useState('');
  const [copied, setCopied] = useState(false);

  const {
    code,
    language,
    output,
    isExecuting,
    participants,
    remoteCursors,
    chatMessages,
    videoEnabled,
    audioEnabled,
    error,
  } = useSelector((state) => state.interview);

  const {
    sendCodeChange,
    sendCursorMove,
    sendLanguageChange,
    runCode,
    sendChatMessage,
  } = useInterviewSocket({ roomId, role, user });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendChat = (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendChatMessage(chatInput);
    setChatInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900/90 border-b border-slate-800 backdrop-blur-xl">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-lg shadow-lg shadow-indigo-500/30">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                Collaborative Interview Space
              </h1>
              <div className="flex items-center space-x-2 text-xs text-slate-400">
                <span>Room:</span>
                <span className="font-mono text-indigo-400 font-semibold">{roomId}</span>
                <button
                  onClick={handleCopyLink}
                  className="p-1 hover:bg-slate-800 rounded transition-colors text-slate-400 hover:text-white"
                  title="Copy Room Link"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <span className="h-6 w-px bg-slate-800" />

          <div className="flex items-center space-x-2">
            <span
              className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wide border shadow-sm ${
                role === 'interviewer'
                  ? 'bg-pink-500/10 text-pink-400 border-pink-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}
            >
              {role === 'interviewer' ? <Shield className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
              <span className="capitalize">{role}</span>
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onLeave}
            className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 hover:border-rose-700/50 rounded-lg text-sm font-medium transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        </div>
      </header>

      {/* Error Alert if any */}
      {error && (
        <div className="bg-rose-900/40 border-b border-rose-800 text-rose-200 px-4 py-2 text-xs flex items-center justify-between">
          <span>{error}</span>
        </div>
      )}

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden p-4 gap-4">
        {/* Left Side: Monaco Code Editor Pane */}
        <div className="flex-1 flex flex-col min-w-0">
          <CollaborativeCodeEditor
            code={code}
            language={language}
            onChange={sendCodeChange}
            onCursorMove={sendCursorMove}
            onLanguageChange={sendLanguageChange}
            onRunCode={runCode}
            isExecuting={isExecuting}
            output={output}
            remoteCursors={remoteCursors}
          />
        </div>

        {/* Right Side: Tabbed Sidebar */}
        <div className="w-80 lg:w-96 flex flex-col bg-slate-900 rounded-xl border border-slate-800 shadow-xl overflow-hidden">
          {/* Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-slate-950/60 p-1 gap-1">
            <button
              onClick={() => setActiveTab('participants')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'participants'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Peers ({participants.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'chat'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat ({chatMessages.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'video'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video</span>
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-900/50">
            {/* Participants Tab */}
            {activeTab === 'participants' && (
              <div className="p-4 flex-1 overflow-y-auto space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Active Interviewees & Interviewers
                </div>
                {participants.length === 0 ? (
                  <div className="text-slate-500 text-xs italic py-4 text-center">
                    Connecting to room...
                  </div>
                ) : (
                  participants.map((p) => (
                    <div
                      key={p.socketId}
                      className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/50 hover:border-slate-600 transition-all"
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className="w-3 h-3 rounded-full shadow-sm"
                          style={{ backgroundColor: p.color || '#3b82f6' }}
                          title={`Cursor color: ${p.color}`}
                        />
                        <div>
                          <div className="text-sm font-semibold text-slate-200">
                            {p.name || 'Anonymous'}
                          </div>
                          <div className="text-xs text-slate-400 capitalize">{p.role}</div>
                        </div>
                      </div>

                      <span className="flex items-center space-x-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>Online</span>
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Chat Tab */}
            {activeTab === 'chat' && (
              <div className="flex flex-col h-full">
                <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  {chatMessages.map((msg) => (
                    <div key={msg.id} className="flex flex-col space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-semibold text-indigo-300">
                          {msg.user?.name || 'User'} ({msg.user?.role || 'peer'})
                        </span>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700/60 text-xs text-slate-200 leading-relaxed">
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendChat} className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="p-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            )}

            {/* Video Chat Tab */}
            {activeTab === 'video' && (
              <div className="p-4 flex-1 flex flex-col space-y-4">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Live Video Streams
                </div>

                <div className="grid grid-cols-1 gap-3 flex-1">
                  {/* Remote Peer Video Stream Placeholder */}
                  <div className="relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center min-h-[160px] group shadow-inner">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-2 text-indigo-400 group-hover:scale-105 transition-all">
                        <Video className="w-6 h-6" />
                      </div>
                      <p className="text-xs font-medium text-slate-300">Remote Participant Feed</p>
                      <p className="text-[11px] text-slate-500">Peer video active via WebRTC</p>
                    </div>
                  </div>

                  {/* Local Stream Placeholder */}
                  <div className="relative bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center min-h-[120px]">
                    <div className="text-center p-2">
                      <p className="text-xs font-medium text-slate-400">Your Video Stream (Local)</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
