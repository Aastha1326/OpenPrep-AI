import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Type, Sparkles, X, LayoutTemplate, PenTool } from 'lucide-react';
import api from '../../services/api';

/**
 * MVP AI Rich Text Editor (Issue #1296)
 * Simulates a block-based editor AST with real-time AI Ghost Text autocompletion.
 */
const RichTextEditor = ({ onClose }) => {
  const [content, setContent] = useState("Newton's second law is");
  const [ghostText, setGhostText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef(null);

  // Auto-resize textarea
  const textareaRef = useRef(null);

  const fetchAiSuggestion = async (currentText) => {
    try {
      const res = await api.post('/editor/suggest', { context: currentText });
      if (res.data?.suggestion) {
        setGhostText(res.data.suggestion);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleInput = (e) => {
    const val = e.target.value;
    setContent(val);
    setGhostText(""); // Clear ghost text on type
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }

    // Debounce AI suggestion
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // Only suggest if they paused typing at the end of a word
      if (val.trim().length > 0 && val.endsWith(' ')) {
        fetchAiSuggestion(val.trim());
      } else if (val.endsWith('is') || val.endsWith('the')) {
        fetchAiSuggestion(val);
      }
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && ghostText) {
      e.preventDefault();
      setContent(prev => prev + ghostText);
      setGhostText("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
    >
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 w-full max-w-4xl h-[80vh] rounded-2xl overflow-hidden flex flex-col shadow-2xl">
        
        {/* Editor Toolbar */}
        <div className="p-3 border-b border-stone-200 dark:border-stone-800 flex justify-between items-center bg-stone-50 dark:bg-stone-950">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-500 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-500/20">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-bold">AI Copilot Active</span>
            </div>
            
            {/* Mock Toolbar Icons */}
            <div className="h-6 w-px bg-stone-300 dark:bg-stone-700 mx-2" />
            <button className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 rounded"><Type className="w-5 h-5" /></button>
            <button className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 rounded"><LayoutTemplate className="w-5 h-5" /></button>
            <button className="p-1.5 text-stone-500 hover:text-stone-900 dark:hover:text-stone-200 hover:bg-stone-200 dark:hover:bg-stone-800 rounded"><PenTool className="w-5 h-5" /></button>
          </div>
          
          <button onClick={onClose} className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white p-2">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Editor Canvas */}
        <div className="flex-1 overflow-y-auto p-12 bg-white dark:bg-stone-900 relative">
          
          {/* Title block */}
          <input 
            type="text" 
            placeholder="Document Title" 
            className="w-full text-5xl font-bold font-playfair bg-transparent text-stone-900 dark:text-stone-100 outline-none mb-8 placeholder-stone-300 dark:placeholder-stone-700"
            defaultValue="Physics Notes"
          />

          {/* Block Editor Mock Area */}
          <div className="relative text-lg font-serif leading-relaxed text-stone-800 dark:text-stone-300">
            
            {/* 
              In a real AST Editor (ProseMirror), this is highly managed DOM. 
              For the MVP, we use a controlled relative container to overlay the ghost text.
            */}
            <div className="relative font-serif">
              {/* Invisible mirror to measure text width for ghost text alignment */}
              <div className="absolute inset-0 pointer-events-none opacity-0 whitespace-pre-wrap break-words" aria-hidden="true">
                {content}
                {/* The ghost text attaches to the end of the content in the DOM flow */}
                <span className="opacity-100 text-transparent">_</span>
              </div>
              
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={handleInput}
                  onKeyDown={handleKeyDown}
                  className="w-full bg-transparent outline-none resize-none overflow-hidden relative z-10 break-words"
                  placeholder="Type '/' for commands..."
                  rows={1}
                  spellCheck="false"
                />
                
                {/* Ghost Text Overlay */}
                {ghostText && !isTyping && (
                  <div 
                    className="absolute inset-0 pointer-events-none whitespace-pre-wrap break-words" 
                    aria-hidden="true"
                  >
                    <span className="opacity-0">{content}</span>
                    <span className="text-stone-400 dark:text-stone-500 italic bg-amber-50 dark:bg-amber-900/20 px-1 rounded">
                      {ghostText}
                    </span>
                    <span className="block mt-4 text-xs font-sans text-amber-600 dark:text-amber-500 font-bold opacity-70">
                      Press Tab to accept
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Mock LaTeX Block */}
            <div className="mt-8 p-6 bg-stone-50 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 rounded-xl relative group">
              <div className="absolute -top-3 left-4 bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 text-xs px-2 py-0.5 rounded font-mono">
                Formula / MathJax
              </div>
              <div className="text-center font-serif text-xl tracking-wider py-4">
                <span className="italic">F</span> = <span className="italic">m</span> &times; <span className="italic">a</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default RichTextEditor;
