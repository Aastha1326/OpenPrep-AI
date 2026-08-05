import React, { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, MessageSquare, Send, LogOut, Code, Copy, Check, Info, RefreshCw, AlertCircle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { socket } from '../services/socket';
import LeatherBoard from '../components/dashboard/LeatherBoard';
import VintagePaper from '../components/dashboard/VintagePaper';

const StudyGroupChat = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  // Connection and Room state
  const [roomIdInput, setRoomIdInput] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joined, setJoined] = useState(false);
  const [participants, setParticipants] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  
  // UI States
  const [copied, setCopied] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const messagesEndRef = useRef(null);
  const stopTypingTimerRef = useRef(null);
  const typingClearTimersRef = useRef({});

  useEffect(() => {
    // Connect socket on mount
    socket.connect();

    // Event listeners
    socket.on('chat_room_update', (data) => {
      setParticipants(data.users || []);
    });

    socket.on('new_chat_message', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('user:typing', ({ username, isTyping }) => {
      clearTimeout(typingClearTimersRef.current[username]);
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[username] = true;
        else delete next[username];
        return next;
      });

      if (isTyping) {
        typingClearTimersRef.current[username] = setTimeout(() => {
          setTypingUsers((prev) => {
            const next = { ...prev };
            delete next[username];
            return next;
          });
        }, 3000);
      }
    });

    return () => {
      // Cleanup on unmount
      socket.off('chat_room_update');
      socket.off('new_chat_message');
      socket.off('user:typing');
      clearTimeout(stopTypingTimerRef.current);
      socket.emit('user:typing', { roomId, isTyping: false });
      socket.disconnect();
    };
  }, []);

  // Autoscroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleJoin = (e) => {
    e.preventDefault();
    const cleanRoomId = roomIdInput.trim().toUpperCase();
    if (cleanRoomId) {
      setRoomId(cleanRoomId);
      socket.emit('join_chat_room', { roomId: cleanRoomId, username: user?.name || 'Anonymous' });
      setJoined(true);
    }
  };

  const handleCreateRoom = () => {
    const generatedId = Math.random().toString(36).substring(2, 8).toUpperCase();
    setRoomId(generatedId);
    socket.emit('join_chat_room', { roomId: generatedId, username: user?.name || 'Anonymous' });
    setJoined(true);
  };

  const handleLeave = () => {
    clearTimeout(stopTypingTimerRef.current);
    socket.emit('user:typing', { roomId, isTyping: false });
    socket.emit('leave_chat_room', { roomId });
    setJoined(false);
    setRoomId('');
    setRoomIdInput('');
    setMessages([]);
    setParticipants([]);
    setTypingUsers({});
  };

  const handleSendMessage = (e) => {
    e?.preventDefault();
    if (inputText.trim()) {
      socket.emit('send_chat_message', { roomId, messageText: inputText });
      socket.emit('user:typing', { roomId, isTyping: false });
      setInputText('');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputText(value);

    if (value.trim()) {
      socket.emit('user:typing', { roomId, isTyping: true });
    } else {
      socket.emit('user:typing', { roomId, isTyping: false });
    }

    clearTimeout(stopTypingTimerRef.current);
    stopTypingTimerRef.current = setTimeout(() => {
      socket.emit('user:typing', { roomId, isTyping: false });
    }, 2000);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const insertCodeTemplate = () => {
    const codeTemplate = '\n```javascript\n// Write your code here\n\n```';
    setInputText((prev) => prev + codeTemplate);
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <LeatherBoard>
      <div className="pl-4 md:pl-8 pr-4 py-8 max-w-6xl mx-auto h-[90vh] flex flex-col">
        {/* --- HEADER --- */}
        <div className="flex justify-between items-center border-b border-black/20 pb-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gold-foil font-playfair flex items-center gap-2">
              <MessageSquare className="w-8 h-8 text-yellow-600" />
              Peer Study Rooms
            </h1>
            <p className="text-amber-100/60 text-sm font-serif italic mt-0.5">
              Live collaboration, notes sharing, and interactive coding sessions.
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-4 py-2 border border-yellow-700/50 hover:bg-neutral-800 text-yellow-500 rounded-sm font-semibold transition-all text-sm font-serif"
          >
            Back to Dashboard
          </button>
        </div>

        {/* --- MAIN AREA --- */}
        <div className="flex-1 flex flex-col justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {!joined ? (
              /* --- JOIN ROOM SCREEN --- */
              <motion.div
                key="join-screen"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="w-full max-w-md mx-auto"
              >
                <VintagePaper className="p-8 border-t-4 border-t-yellow-600 shadow-2xl flex flex-col gap-6">
                  <div className="text-center">
                    <Users className="w-12 h-12 text-yellow-700 mx-auto mb-3" />
                    <h2 className="text-2xl font-playfair font-bold text-neutral-800">Join or Create a Room</h2>
                    <p className="text-xs text-neutral-500 italic font-serif mt-1">Study collaboratively with peers in real-time.</p>
                  </div>

                  <form onSubmit={handleJoin} className="space-y-4">
                    <div>
                      <label htmlFor="roomId" className="block text-sm font-semibold text-neutral-700 mb-1">
                        Enter Room ID
                      </label>
                      <input
                        id="roomId"
                        type="text"
                        placeholder="e.g. MATH101"
                        value={roomIdInput}
                        onChange={(e) => setRoomIdInput(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-600 uppercase font-mono text-center tracking-wider text-neutral-800"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white rounded font-semibold shadow-md transition-all uppercase tracking-wider text-xs"
                    >
                      Join Existing Room
                    </button>
                  </form>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-neutral-300"></div>
                    <span className="flex-shrink mx-4 text-xs font-semibold text-neutral-400 uppercase tracking-widest font-serif">OR</span>
                    <div className="flex-grow border-t border-neutral-300"></div>
                  </div>

                  <button
                    onClick={handleCreateRoom}
                    className="w-full py-2.5 bg-neutral-800 text-yellow-500 hover:bg-neutral-700 rounded border border-yellow-700/50 font-semibold shadow-md transition-all uppercase tracking-wider text-xs flex items-center justify-center gap-1.5"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Create New Study Room
                  </button>
                </VintagePaper>
              </motion.div>
            ) : (
              /* --- CHAT INTERFACE --- */
              <motion.div
                key="chat-interface"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full h-full flex flex-col md:flex-row gap-6 overflow-hidden"
              >
                {/* Left Panel: Partners */}
                <div className="w-full md:w-64 flex flex-col gap-4">
                  <VintagePaper className="p-4 flex flex-col gap-4 flex-1">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 font-serif">Active Room</h3>
                      <div className="flex items-center justify-between p-2.5 bg-neutral-50 border border-neutral-200 rounded font-mono text-sm font-bold text-neutral-800">
                        <span>{roomId}</span>
                        <button
                          onClick={copyRoomId}
                          className="p-1 hover:bg-neutral-200 rounded transition-colors text-neutral-500 hover:text-neutral-800"
                          title="Copy Room ID"
                        >
                          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 flex flex-col min-h-[150px] overflow-hidden">
                      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-neutral-500 mb-2 font-serif">
                        <Users className="w-4 h-4 text-yellow-700" />
                        <span>Online Partners ({participants.length})</span>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
                        {participants.map((partner, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 p-2 bg-neutral-100/50 border border-neutral-200/50 rounded-sm"
                          >
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <span className="text-sm font-semibold text-neutral-700 font-sans truncate">{partner}</span>
                            {partner === user?.name && <span className="text-[10px] text-neutral-400 font-serif italic">(You)</span>}
                          </div>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={handleLeave}
                      className="w-full py-2 border border-red-200 hover:bg-red-50 text-red-700 font-semibold rounded-sm shadow-sm transition-all flex items-center justify-center gap-1.5 text-xs uppercase font-serif"
                    >
                      <LogOut className="w-4 h-4" />
                      Leave Chat Room
                    </button>
                  </VintagePaper>
                </div>

                {/* Right Panel: Chat Log */}
                <div className="flex-1 flex flex-col min-h-0">
                  <VintagePaper className="flex-1 flex flex-col min-h-0 p-0 shadow-xl overflow-hidden border border-black/10">
                    {/* Chat Area */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4">
                      {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-neutral-400 gap-2">
                          <MessageSquare className="w-12 h-12 opacity-30" />
                          <p className="text-sm italic font-serif">Welcome to the study room. Type a message below to start collaborating!</p>
                          <p className="text-xs max-w-xs text-center text-neutral-500">You can use Markdown syntax for bold, italics, tables, and lists. Code blocks are automatically highlighted.</p>
                        </div>
                      ) : (
                        messages.map((msg) => {
                          const isOwnMessage = msg.sender === user?.name;
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col max-w-[85%] ${isOwnMessage ? 'self-end items-end ml-auto' : 'self-start items-start'}`}
                            >
                              <div className="flex items-baseline gap-1.5 mb-1 px-1">
                                <span className="text-xs font-bold text-neutral-600 font-sans">{msg.sender}</span>
                                <span className="text-[10px] text-neutral-400 font-mono">{formatTime(msg.timestamp)}</span>
                              </div>
                              <div
                                className={`p-4 rounded-md shadow-sm border ${
                                  isOwnMessage
                                    ? 'bg-[#f6ebd4] border-yellow-800/10 text-neutral-800'
                                    : 'bg-white border-neutral-300/60 text-neutral-800'
                                }`}
                              >
                                <div className="prose prose-sm max-w-none prose-neutral font-sans break-words prose-p:leading-relaxed prose-pre:p-0">
                                  <ReactMarkdown
                                    components={{
                                      code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || '');
                                        return !inline && match ? (
                                          <SyntaxHighlighter
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            className="rounded-sm my-2 text-xs shadow-inner"
                                            {...props}
                                          >
                                            {String(children).replace(/\n$/, '')}
                                          </SyntaxHighlighter>
                                        ) : (
                                          <code className="bg-neutral-100 px-1.5 py-0.5 rounded text-red-600 text-xs font-mono font-bold" {...props}>
                                            {children}
                                          </code>
                                        );
                                      }
                                    }}
                                  >
                                    {msg.text}
                                  </ReactMarkdown>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Quick Tools */}
                    <div className="px-6 py-2 border-t border-b border-neutral-200 bg-neutral-50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={insertCodeTemplate}
                          className="px-2.5 py-1 text-xs bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 rounded-sm font-semibold flex items-center gap-1 transition-colors"
                          title="Insert Markdown Code Block"
                        >
                          <Code className="w-3.5 h-3.5" />
                          Code Block
                        </button>
                      </div>
                      <div className="text-[10px] text-neutral-400 font-serif italic flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Supports Markdown
                      </div>
                    </div>

                    {/* Live typing indicator */}
                    {Object.keys(typingUsers).filter((name) => name !== user?.name).length > 0 && (
                      <div className="px-6 pt-3 text-xs text-yellow-700 font-serif italic flex items-center gap-1.5">
                        <span>
                          {Object.keys(typingUsers).filter((name) => name !== user?.name).join(', ')} is typing
                        </span>
                        <span className="inline-flex items-center">
                          {[0, 1, 2].map((dot) => (
                            <span
                              key={dot}
                              className="w-1 h-1 bg-yellow-600 rounded-full animate-bounce mr-0.5"
                              style={{ animationDelay: `${dot * 150}ms` }}
                            />
                          ))}
                        </span>
                      </div>
                    )}

                    {/* Input Area */}
                    <form onSubmit={handleSendMessage} className="p-4 bg-white flex gap-3 items-end">
                      <div className="flex-1">
                        <textarea
                          placeholder="Type your markdown study notes, formulas, or code snippet here..."
                          value={inputText}
                          onChange={handleInputChange}
                          onKeyDown={handleKeyDown}
                          rows={2}
                          className="w-full p-3 bg-white border border-neutral-300 rounded focus:outline-none focus:ring-2 focus:ring-yellow-600 text-sm font-sans resize-none text-neutral-800"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={!inputText.trim()}
                        className="p-3 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded shadow-md hover:shadow-lg transition-all flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed h-[44px] w-[44px]"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </form>
                  </VintagePaper>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </LeatherBoard>
  );
};

export default StudyGroupChat;
