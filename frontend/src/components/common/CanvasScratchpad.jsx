import { useRef, useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eraser, Undo2, Trash2, Download, Palette } from 'lucide-react';

const COLORS = [
  { name: 'White', value: '#e7e5e4' },
  { name: 'Amber', value: '#f59e0b' },
  { name: 'Emerald', value: '#22c55e' },
  { name: 'Sky', value: '#0ea5e9' },
  { name: 'Rose', value: '#f43f5e' },
  { name: 'Violet', value: '#a855f7' },
];

const BRUSH_SIZES = [2, 4, 6, 10];

/**
 * CanvasScratchpad
 * HTML5 canvas drawing component with mouse/touch support,
 * undo stack, color picker, brush sizes, and export.
 */
export default function CanvasScratchpad({ className = '' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState(COLORS[0].value);
  const [brushSize, setBrushSize] = useState(4);
  const [showColors, setShowColors] = useState(false);
  const [undoStack, setUndoStack] = useState([]);
  const lastPos = useRef(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    canvas.width = parent.clientWidth;
    canvas.height = parent.clientHeight;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Draw grid
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, []);

  const saveState = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const data = canvas.toDataURL();
    setUndoStack((prev) => [...prev.slice(-19), data]);
  }, []);

  const getPos = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const startDraw = useCallback(
    (e) => {
      e.preventDefault();
      saveState();
      const pos = getPos(e);
      lastPos.current = pos;
      setIsDrawing(true);
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, brushSize / 2, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    },
    [getPos, saveState, color, brushSize]
  );

  const draw = useCallback(
    (e) => {
      if (!isDrawing) return;
      e.preventDefault();
      const pos = getPos(e);
      const ctx = canvasRef.current.getContext('2d');
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = brushSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPos.current = pos;
    },
    [isDrawing, getPos, color, brushSize]
  );

  const stopDraw = useCallback(() => {
    setIsDrawing(false);
    lastPos.current = null;
  }, []);

  const undo = useCallback(() => {
    if (undoStack.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
    };
    img.src = undoStack[undoStack.length - 1];
    setUndoStack((prev) => prev.slice(0, -1));
  }, [undoStack]);

  const clearCanvas = useCallback(() => {
    saveState();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // Redraw grid
    ctx.strokeStyle = '#292524';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < canvas.width; x += 20) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += 20) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
  }, [saveState]);

  const exportCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = `scratchpad-${Date.now()}.png`;
    link.href = canvas.toDataURL();
    link.click();
  }, []);

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1.5 mb-2 px-1 flex-wrap">
        {/* Color picker */}
        <div className="relative">
          <button
            onClick={() => setShowColors(!showColors)}
            className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-stone-800 border border-stone-700/40 text-xs text-stone-300 hover:bg-stone-700 transition"
          >
            <Palette className="w-3.5 h-3.5" />
            <span
              className="w-3 h-3 rounded-full border border-stone-600"
              style={{ backgroundColor: color }}
            />
          </button>
          {showColors && (
            <div className="absolute top-full left-0 mt-1 bg-stone-900 border border-stone-700/60 rounded-lg p-2 shadow-xl z-10 flex gap-1.5">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => { setColor(c.value); setShowColors(false); }}
                  className={`w-6 h-6 rounded-full border-2 transition ${
                    color === c.value ? 'border-white scale-110' : 'border-stone-600 hover:border-stone-400'
                  }`}
                  style={{ backgroundColor: c.value }}
                  aria-label={c.name}
                />
              ))}
            </div>
          )}
        </div>

        {/* Brush sizes */}
        {BRUSH_SIZES.map((size) => (
          <button
            key={size}
            onClick={() => setBrushSize(size)}
            className={`flex items-center justify-center w-7 h-7 rounded-lg transition ${
              brushSize === size
                ? 'bg-indigo-600/60 border border-indigo-500/40'
                : 'bg-stone-800 border border-stone-700/40 hover:bg-stone-700'
            }`}
          >
            <span
              className="rounded-full bg-stone-200"
              style={{ width: size, height: size }}
            />
          </button>
        ))}

        <div className="flex-1" />

        <button
          onClick={undo}
          disabled={undoStack.length === 0}
          className="p-1.5 rounded-lg bg-stone-800 border border-stone-700/40 text-stone-400 hover:bg-stone-700 transition disabled:opacity-30"
          aria-label="Undo"
        >
          <Undo2 className="w-4 h-4" />
        </button>
        <button
          onClick={clearCanvas}
          className="p-1.5 rounded-lg bg-stone-800 border border-stone-700/40 text-rose-400 hover:bg-stone-700 transition"
          aria-label="Clear canvas"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button
          onClick={exportCanvas}
          className="p-1.5 rounded-lg bg-stone-800 border border-stone-700/40 text-stone-400 hover:bg-stone-700 transition"
          aria-label="Export as PNG"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative rounded-xl overflow-hidden border border-stone-700/40 cursor-crosshair">
        <canvas
          ref={canvasRef}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
          className="w-full h-full touch-none"
        />
      </div>
    </div>
  );
}
