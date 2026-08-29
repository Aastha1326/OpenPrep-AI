import React, { useState, useEffect, useCallback, useRef } from 'react';
import API from '../services/api';

const StudyCompanionChat = () => {
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(scrollToBottom, [messages]);

  const fetchSessions = useCallback(async () => {
    try { const res = await API.get('/chat/sessions'); if (res.data.success) setSessions(res.data.data); } catch (e) { /* ignore */ }
  }, []);

  const fetchStats = useCallback(async () => {
    try { const res = await API.get('/chat/stats'); if (res.data.success) setStats(res.data.data); } catch (e) { /* ignore */ }
  }, []);

  useEffect(() => { fetchSessions(); fetchStats(); }, [fetchSessions, fetchStats]);

  const loadSession = async (sessionId) => {
    setActiveSession(sessionId);
    try {
      const res = await API.get(`/chat/${sessionId}/messages`);
      if (res.data.success) setMessages(res.data.data);
    } catch (e) { setError('Failed to load chat history'); }
    if (window.innerWidth < 768) setShowSidebar(false);
  };

  const startNewSession = async () => {
    try {
      const res = await API.post('/chat/sessions');
      if (res.data.success) {
        const sid = res.data.data.sessionId;
        setActiveSession(sid);
        setMessages([]);
        fetchSessions();
      }
    } catch (e) { setError('Failed to create session'); }
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !activeSession) return;
    const msg = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, role: 'user', content: msg, createdAt: new Date().toISOString() }]);
    setSending(true);
    try {
      const res = await API.post(`/chat/${activeSession}/messages`, { message: msg });
      if (res.data.success) {
        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => !m.id.startsWith('temp-'));
          return [...withoutTemp, { role: 'user', content: msg, createdAt: new Date().toISOString() }, res.data.data];
        });
      }
    } catch (err) { setError(err.response?.data?.error || 'Failed to send'); }
    finally { setSending(false); inputRef.current?.focus(); }
  };

  const handleRate = async (msgId, helpful) => {
    try { await API.put(`/chat/messages/${msgId}/rate`, { helpful }); setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, helpful } : m)); } catch (e) { /* ignore */ }
  };

  const QUICK_PROMPTS = ['Explain a concept to me', 'Give me study tips', 'How do I improve my scores?', 'Quiz me on a topic', 'Summarize what I should review'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar */}
      <div className={`${showSidebar ? 'w-72' : 'w-0'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all overflow-hidden shrink-0`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-bold text-gray-900 dark:text-white mb-3">💬 Study Companion</h2>
          <button onClick={startNewSession} className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-all">
            + New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.map((s) => (
            <button key={s.sessionId} onClick={() => loadSession(s.sessionId)}
              className={`w-full text-left p-3 rounded-lg mb-1 transition-all ${activeSession === s.sessionId ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <p className="text-sm text-gray-900 dark:text-white truncate">{s.lastMessage || 'New conversation'}</p>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(s.lastAt).toLocaleDateString()} · {s.messageCount} msgs</p>
            </button>
          ))}
        </div>
        {stats && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
            <p>💬 {stats.totalMessages} messages · 📋 {stats.totalSessions} sessions</p>
          </div>
        )}
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setShowSidebar(!showSidebar)} className="md:hidden text-gray-500 hover:text-gray-700">☰</button>
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-sm font-bold">AI</div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Study Companion</h3>
            <p className="text-xs text-gray-500">Ask anything about your studies</p>
          </div>
        </div>

        {error && <div className="bg-red-50 border-b border-red-200 px-4 py-2 text-red-700 text-sm">{error}</div>}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && !sending && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl mx-auto mb-4">🤖</div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Hi! I'm your Study Companion</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">I can help you understand concepts, prepare for exams, and stay motivated. Ask me anything!</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
                {QUICK_PROMPTS.map((p) => (
                  <button key={p} onClick={() => { setInput(p); setTimeout(() => handleSend(), 100); }}
                    className="px-4 py-2 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-all border border-blue-200 dark:border-blue-800">
                    {p}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                ? 'bg-blue-600 text-white rounded-br-md'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white rounded-bl-md shadow-sm'}`}>
                <div className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                {msg.role === 'assistant' && msg.id && !msg.id.startsWith('temp-') && (
                  <div className="flex gap-2 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={() => handleRate(msg.id, true)} className={`text-xs ${msg.helpful === true ? 'text-green-600' : 'text-gray-400 hover:text-green-600'}`}>👍 Helpful</button>
                    <button onClick={() => handleRate(msg.id, false)} className={`text-xs ${msg.helpful === false ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}>👎</button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {sending && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} /><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} /></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          {!activeSession ? (
            <div className="text-center text-gray-500 text-sm py-2">Start a new chat or select an existing conversation</div>
          ) : (
            <div className="flex gap-3">
              <input ref={inputRef} type="text" value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                placeholder="Ask me anything about your studies..."
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={sending} />
              <button onClick={handleSend} disabled={sending || !input.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-all">
                {sending ? '...' : '➤'}</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyCompanionChat;
