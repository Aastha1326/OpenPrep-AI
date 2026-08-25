import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, PenTool, X, GripVertical, Minimize2, Maximize2 } from 'lucide-react';
import ScientificCalculator from './ScientificCalculator';
import CanvasScratchpad from './CanvasScratchpad';

const STORAGE_KEY = 'openprep-drawer-position';

/**
 * FloatingUtilityDrawer
 * A draggable floating drawer containing a scientific calculator
 * and canvas scratchpad, accessible from any page.
 * Remembers position in localStorage.
 */
export default function FloatingUtilityDrawer({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('calculator');
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : { x: null, y: null };
    } catch {
      return { x: null, y: null };
    }
  });

  const drawerRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0, posX: 0, posY: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Save position to localStorage
  useEffect(() => {
    if (position.x !== null) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(position));
    }
  }, [position]);

  // Drag handlers
  const handleDragStart = useCallback(
    (e) => {
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragStart.current = {
        x: clientX,
        y: clientY,
        posX: position.x ?? window.innerWidth - 380,
        posY: position.y ?? 80,
      };
      setIsDragging(true);
    },
    [position]
  );

  const handleDrag = useCallback(
    (e) => {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const newX = dragStart.current.posX + (clientX - dragStart.current.x);
      const newY = dragStart.current.posY + (clientY - dragStart.current.y);
      setPosition({
        x: Math.max(0, Math.min(window.innerWidth - 100, newX)),
        y: Math.max(0, Math.min(window.innerHeight - 100, newY)),
      });
    },
    [isDragging]
  );

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleDrag);
      window.addEventListener('touchend', handleDragEnd);
      return () => {
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
        window.removeEventListener('touchmove', handleDrag);
        window.removeEventListener('touchend', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  // Set default position on first open
  useEffect(() => {
    if (isOpen && position.x === null) {
      setPosition({
        x: Math.max(20, window.innerWidth - 400),
        y: 80,
      });
    }
  }, [isOpen, position.x]);

  const handleInsertToScratchpad = useCallback((text) => {
    setActiveTab('scratchpad');
  }, []);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={drawerRef}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed z-50 select-none"
          style={{
            left: position.x ?? 'auto',
            top: position.y ?? 80,
            right: position.x === null ? 20 : 'auto',
          }}
        >
          <div
            className={`bg-stone-900/95 backdrop-blur-xl border border-stone-700/50 rounded-2xl shadow-2xl overflow-hidden transition-all ${
              isMinimized ? 'w-14' : 'w-[360px]'
            }`}
            style={{ height: isMinimized ? 56 : 520 }}
          >
            {/* Drag Handle / Header */}
            <div
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
              className={`flex items-center gap-2 px-3 py-2.5 border-b border-stone-700/40 cursor-grab active:cursor-grabbing ${
                isDragging ? 'bg-stone-800/80' : ''
              }`}
            >
              <GripVertical className="w-4 h-4 text-stone-600 shrink-0" />

              {!isMinimized && (
                <>
                  {/* Tabs */}
                  <button
                    onClick={() => setActiveTab('calculator')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeTab === 'calculator'
                        ? 'bg-indigo-600/60 text-indigo-200'
                        : 'text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Calculator
                  </button>
                  <button
                    onClick={() => setActiveTab('scratchpad')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                      activeTab === 'scratchpad'
                        ? 'bg-violet-600/60 text-violet-200'
                        : 'text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    <PenTool className="w-3.5 h-3.5" />
                    Scratchpad
                  </button>
                </>
              )}

              <div className="flex-1" />

              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded-md text-stone-500 hover:text-stone-300 hover:bg-stone-800 transition"
                aria-label={isMinimized ? 'Expand drawer' : 'Minimize drawer'}
              >
                {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={onClose}
                className="p-1 rounded-md text-stone-500 hover:text-rose-400 hover:bg-stone-800 transition"
                aria-label="Close drawer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Content */}
            {!isMinimized && (
              <div className="p-3" style={{ height: 'calc(100% - 44px)' }}>
                {activeTab === 'calculator' ? (
                  <ScientificCalculator onInsertToScratchpad={handleInsertToScratchpad} />
                ) : (
                  <CanvasScratchpad />
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
