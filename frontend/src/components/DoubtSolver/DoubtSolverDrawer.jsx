/**
 * @fileoverview Slide-over floating chat drawer for the AI Academic Doubt Solver
 * with Socratic hints, KaTeX math rendering, syntax highlighting, and voice input.
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import 'katex/dist/katex.min.css';
import ImageUploadZone from './ImageUploadZone';
import { startDoubtSession, sendDoubtMessage, revealDoubtStep } from '../../services/api';

// ── Voice Input Hook ────────────────────────────────────────────────
const SpeechRecognition = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

function useVoiceInput() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef(null);

  useEffect(() => {
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
      setIsListening(false);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    return () => recognition.abort();
  }, []);

  const toggle = useCallback(() => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  }, [isListening]);

  return { isListening, transcript, toggle, supported: !!SpeechRecognition };
}

// ── Markdown Renderer with KaTeX + Syntax Highlighting ──────────────
const MarkdownBubble = ({ content }) => (
  <ReactMarkdown
    remarkPlugins={[remarkMath, remarkGfm]}
    rehypePlugins={[rehypeKatex]}
    components={{
      code({ className, children, ...props }) {
        const match = /language-(\w+)/.exec(className || '');
        return match ? (
          <SyntaxHighlighter
            style={oneDark}
            language={match[1]}
            PreTag="div"
            className="rounded-lg text-sm my-2"
            {...props}
          >
            {String(children).replace(/\n$/, '')}
          </SyntaxHighlighter>
        ) : (
          <code className="bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm" {...props}>
            {children}
          </code>
        );
      },
    }}
  >
    {content}
  </ReactMarkdown>
);

// ── Main Drawer Component ───────────────────────────────────────────
const DoubtSolverDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [totalHints, setTotalHints] = useState(4);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { isListening, transcript, toggle, supported } = useVoiceInput();

  // Auto-fill input when voice transcript updates
  useEffect(() => {
    if (transcript) setInput((prev) => prev + transcript);
  }, [transcript]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // ── Start a new session ─────────────────────────────────────────
  const handleStartSession = async () => {
    if (!input.trim()) return;
    const question = input.trim();
    setMessages([{ role: 'user', content: question, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('question', question);
      if (imageFile) formData.append('image', imageFile);

      const { data } = await startDoubtSession(formData);
      setSessionId(data.data.sessionId);
      setHintLevel(1);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.data.hint.content,
          hintLabel: `Hint 1/${totalHints}`,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ Error: ${err.response?.data?.message || err.message}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
      setImageFile(null);
    }
  };

  // ── Reveal next hint ────────────────────────────────────────────
  const handleRevealHint = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const { data } = await revealDoubtStep(sessionId);
      if (data.data?.hint) {
        const nextLevel = hintLevel + 1;
        setHintLevel(nextLevel);
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: data.data.hint.content,
            hintLabel: nextLevel >= totalHints ? 'Full Solution' : `Hint ${nextLevel}/${totalHints}`,
            timestamp: new Date(),
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: '✅ All hints have been revealed.', timestamp: new Date() },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${err.response?.data?.message || err.message}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Send follow-up message ──────────────────────────────────────
  const handleSendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    const text = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await sendDoubtMessage(sessionId, text);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.data.reply, timestamp: new Date() },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `⚠️ ${err.response?.data?.message || err.message}`, timestamp: new Date() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Submit handler (start or follow-up) ─────────────────────────
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sessionId) {
      handleStartSession();
    } else {
      handleSendMessage();
    }
  };

  // ── New session reset ───────────────────────────────────────────
  const handleNewSession = () => {
    setMessages([]);
    setSessionId(null);
    setHintLevel(0);
    setInput('');
    setImageFile(null);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md z-50 flex flex-col bg-white dark:bg-gray-900 shadow-2xl transition-transform">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div>
            <h2 className="text-lg font-semibold">🧠 AI Doubt Solver</h2>
            <p className="text-xs opacity-80">Socratic step-by-step guidance</p>
          </div>
          <div className="flex gap-2">
            {sessionId && (
              <button
                onClick={handleNewSession}
                className="text-xs bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full transition-colors"
              >
                New Session
              </button>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-full transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-950">
          {messages.length === 0 && (
            <div className="text-center text-gray-500 dark:text-gray-400 mt-16 space-y-3">
              <p className="text-4xl">🎓</p>
              <p className="text-lg font-semibold">Stuck on a problem?</p>
              <p className="text-sm">
                Describe your doubt (with an optional image) and I&apos;ll guide you step-by-step
                with Socratic hints.
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.hintLabel && (
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wide bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 px-2 py-0.5 rounded-full mb-2">
                    {msg.hintLabel}
                  </span>
                )}
                {msg.role === 'assistant' ? (
                  <MarkdownBubble content={msg.content} />
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
                <p className={`text-[10px] mt-1 text-right ${msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'}`}>
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Hint progress + reveal button */}
        {sessionId && hintLevel < totalHints && (
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {Array.from({ length: totalHints }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2.5 h-2.5 rounded-full ${
                      i < hintLevel ? 'bg-yellow-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
              <span className="text-xs text-yellow-700 dark:text-yellow-300 font-medium">
                Hint {hintLevel}/{totalHints}
              </span>
            </div>
            <button
              onClick={handleRevealHint}
              disabled={isLoading}
              className="text-xs bg-yellow-500 hover:bg-yellow-600 disabled:opacity-50 text-white font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              Reveal Next Hint
            </button>
          </div>
        )}

        {/* Image upload zone (only before session starts) */}
        {!sessionId && (
          <div className="px-4 pt-2">
            <ImageUploadZone onFileSelect={setImageFile} />
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex gap-2 items-center">
          {supported && (
            <button
              type="button"
              onClick={toggle}
              className={`p-2.5 rounded-full transition-colors ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title={isListening ? 'Stop recording' : 'Voice input'}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </button>
          )}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={sessionId ? 'Ask a follow-up question...' : 'Describe your doubt...'}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none disabled:opacity-50 text-sm"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </form>
      </div>
    </>
  );
};

export default DoubtSolverDrawer;
