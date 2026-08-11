import React, { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { PenTool, Eraser, Download, Trash2, X } from 'lucide-react';
import { motion } from 'framer-motion';

const Whiteboard = ({ roomId = 'global', onClose }) => {
  const canvasRef = useRef(null);
  const [socket, setSocket] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#d97706'); // amber-600
  const [tool, setTool] = useState('pen');

  useEffect(() => {
    // Initialize Socket.io connection
    const newSocket = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      path: '/socket.io',
      transports: ['websocket'],
    });

    setSocket(newSocket);
    newSocket.emit('join-whiteboard', roomId);

    newSocket.on('draw-line', (data) => {
      drawLine(data.x0, data.y0, data.x1, data.y1, data.color, data.isEraser, false);
    });

    newSocket.on('clear-board', () => {
      clearCanvas(false);
    });

    return () => newSocket.close();
  }, [roomId]);

  useEffect(() => {
    // Canvas setup
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    // Set proper resolution for retina displays
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * (window.devicePixelRatio || 1);
    canvas.height = rect.height * (window.devicePixelRatio || 1);
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
    
    // Initial clear to white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);

    const handleResize = () => {
      // In a real app we'd save image data, resize, and restore
      // For MVP, we'll keep it simple
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  let lastX = 0;
  let lastY = 0;

  const drawLine = (x0, y0, x1, y1, strokeColor, isEraser, emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.strokeStyle = isEraser ? '#ffffff' : strokeColor;
    ctx.lineWidth = isEraser ? 20 : 3;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.closePath();

    if (!emit || !socket) return;
    socket.emit('draw-line', {
      roomId,
      x0, y0, x1, y1,
      color: strokeColor,
      isEraser
    });
  };

  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return [0, 0];
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || (e.touches && e.touches[0].clientX)) - rect.left;
    const y = (e.clientY || (e.touches && e.touches[0].clientY)) - rect.top;
    return [x, y];
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const [x, y] = getCoordinates(e);
    lastX = x;
    lastY = y;
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const [x, y] = getCoordinates(e);
    drawLine(lastX, lastY, x, y, color, tool === 'eraser', true);
    lastX = x;
    lastY = y;
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = (emit = true) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, rect.width, rect.height);
    
    if (emit && socket) {
      socket.emit('clear-board', roomId);
    }
  };

  const downloadCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `whiteboard-${roomId}-${Date.now()}.png`;
    a.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-stone-100 dark:bg-slate-800 rounded-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden shadow-2xl border border-stone-300 dark:border-slate-700">
        
        {/* Toolbar */}
        <div className="bg-white dark:bg-slate-900 border-b border-stone-200 dark:border-slate-700 p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h3 className="font-playfair font-bold text-lg text-stone-800 dark:text-stone-100">Live Whiteboard</h3>
            <div className="h-6 w-px bg-stone-300 dark:bg-slate-700" />
            
            <div className="flex gap-2">
              <button 
                onClick={() => setTool('pen')}
                className={`p-2 rounded-lg transition ${tool === 'pen' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'}`}
                title="Pen"
              >
                <PenTool className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setTool('eraser')}
                className={`p-2 rounded-lg transition ${tool === 'eraser' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800'}`}
                title="Eraser"
              >
                <Eraser className="w-5 h-5" />
              </button>
            </div>

            <div className="h-6 w-px bg-stone-300 dark:bg-slate-700" />
            
            {/* Color Palette */}
            <div className="flex gap-2">
              {['#000000', '#ef4444', '#3b82f6', '#10b981', '#d97706'].map(c => (
                <button
                  key={c}
                  onClick={() => { setColor(c); setTool('pen'); }}
                  className={`w-6 h-6 rounded-full border-2 transition ${color === c && tool === 'pen' ? 'border-amber-400 scale-110' : 'border-transparent'}`}
                  style={{ backgroundColor: c }}
                  title="Color"
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => clearCanvas(true)}
              className="p-2 text-stone-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
              title="Clear Board"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={downloadCanvas}
              className="p-2 text-stone-500 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition"
              title="Download Snapshot"
            >
              <Download className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              className="p-2 text-stone-500 hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition ml-2"
              title="Close Whiteboard"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Canvas Area */}
        <div className="flex-1 w-full bg-stone-300 relative overflow-hidden touch-none">
          <canvas
            ref={canvasRef}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-full cursor-crosshair bg-white"
          />
        </div>
      </div>
    </motion.div>
  );
};

export default Whiteboard;
