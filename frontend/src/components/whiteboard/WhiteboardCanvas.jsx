/**
 * @fileoverview Interactive HTML5 Canvas component for collaborative whiteboard drawing, shapes, and KaTeX.
 * Supports infinite pan, zoom, peer cursors, undo/redo, shape-snapping, and OCR.
 */
import React, { useRef, useEffect, useState } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import ShapeMagicTool, { recognizeAndSnapShape } from './ShapeMagicTool';
import axios from 'axios';

const WhiteboardCanvas = ({ socket, squadId, roomId = 'global_squad', userId = 'user_anon', username = 'Anonymous' }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);

  // Canvas Viewport State (Infinite Pan & Zoom)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Drawing State
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState('pen'); // 'pen', 'line', 'rectangle', 'circle', 'text', 'highlighter', 'eraser'
  const [color, setColor] = useState('#6366F1');
  const [lineWidth, setLineWidth] = useState(3);
  const [isMagicPen, setIsMagicPen] = useState(false);

  // Collaborative Data State
  const [strokes, setStrokes] = useState([]);
  const [katexBlocks, setKatexBlocks] = useState([]); // { id, x, y, text } in world coordinates
  const [cursors, setCursors] = useState(new Map()); // userId -> { x, y, username, color, points }

  // Undo/Redo Stacks
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // OCR state
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [textInput, setTextInput] = useState(null); // { x, y, value } for active typing

  // Current drawing stroke
  const currentPointsRef = useRef([]);

  // Convert screen coordinates to canvas world coordinates
  const toWorldCoords = (screenX, screenY) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const canvasX = screenX - rect.left;
    const canvasY = screenY - rect.top;
    return {
      x: (canvasX - pan.x) / zoom,
      y: (canvasY - pan.y) / zoom,
    };
  };

  // Convert world coordinates to screen/viewport coordinates
  const toScreenCoords = (worldX, worldY) => {
    return {
      x: worldX * zoom + pan.x,
      y: worldY * zoom + pan.y,
    };
  };

  // Fetch initial state from backend database
  useEffect(() => {
    const fetchState = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const res = await axios.get(`/api/whiteboard/${roomId}/state`, { headers });
        if (res.data && res.data.success && res.data.data) {
          const board = res.data.data;
          if (board.state) {
            setStrokes(board.state.strokes || []);
            setKatexBlocks(board.state.nodes || []);
          }
        }
      } catch (err) {
        console.error('Failed to load initial whiteboard state:', err);
      }
    };
    fetchState();
  }, [roomId]);

  // Save current state snapshot to backend (throttled/autosave)
  const saveSnapshot = async (updatedStrokes, updatedKatex) => {
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const canvas = canvasRef.current;
      const previewUrl = canvas ? canvas.toDataURL('image/png', 0.2) : null;

      await axios.post(
        `/api/whiteboard/${roomId}/snapshot`,
        {
          state: {
            strokes: updatedStrokes,
            nodes: updatedKatex,
            edges: [],
          },
          previewUrl,
        },
        { headers }
      );
    } catch (err) {
      console.error('Failed to auto-save snapshot:', err);
    }
  };

  // Setup WebSockets
  useEffect(() => {
    if (!socket) return;

    socket.emit('whiteboard:join', { roomId, userId, username });

    socket.on('whiteboard:sync', ({ strokes: syncedStrokes, nodes: syncedNodes }) => {
      if (syncedStrokes) setStrokes(syncedStrokes);
      if (syncedNodes) setKatexBlocks(syncedNodes);
    });

    socket.on('whiteboard:stroke-received', (newStroke) => {
      setStrokes((prev) => [...prev, newStroke]);
    });

    socket.on('whiteboard:element-mutated', (mutation) => {
      if (mutation.type === 'katex-add') {
        setKatexBlocks((prev) => [...prev, mutation.payload]);
      } else if (mutation.type === 'katex-delete') {
        setKatexBlocks((prev) => prev.filter((b) => b.id !== mutation.payload));
      }
    });

    socket.on('whiteboard:history-acted', (action) => {
      if (action.type === 'undo') {
        setStrokes((prev) => {
          const next = [...prev];
          if (next.length > 0) next.pop();
          return next;
        });
      } else if (action.type === 'redo') {
        setStrokes((prev) => [...prev, action.payload]);
      }
    });

    socket.on('whiteboard:cursor-moved', ({ userId: moverId, x, y, points }) => {
      setCursors((prev) => {
        const next = new Map(prev);
        const current = next.get(moverId) || { username: 'Peer', color: '#10B981' };
        next.set(moverId, { ...current, x, y, points });
        return next;
      });
    });

    socket.on('whiteboard:cursor-joined', ({ userId: joinerId, username: name, color: clr }) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(joinerId, { username: name, color: clr, x: 0, y: 0, points: [] });
        return next;
      });
    });

    socket.on('whiteboard:cursor-left', ({ userId: leaverId }) => {
      setCursors((prev) => {
        const next = new Map(prev);
        next.delete(leaverId);
        return next;
      });
    });

    return () => {
      socket.off('whiteboard:sync');
      socket.off('whiteboard:stroke-received');
      socket.off('whiteboard:element-mutated');
      socket.off('whiteboard:history-acted');
      socket.off('whiteboard:cursor-moved');
      socket.off('whiteboard:cursor-joined');
      socket.off('whiteboard:cursor-left');
    };
  }, [socket, roomId, userId, username]);

  // Draw loops on canvas update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Clean canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply pan & zoom transformations
    ctx.translate(pan.x, pan.y);
    ctx.scale(zoom, zoom);

    // Draw background grid
    drawGrid(ctx, canvas.width, canvas.height);

    // Render strokes
    strokes.forEach((stroke) => {
      drawStroke(ctx, stroke);
    });

    ctx.restore();
  }, [strokes, pan, zoom]);

  const drawGrid = (ctx, width, height) => {
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 0.5 / zoom;
    const gridSize = 40;

    // Grid boundary boundaries taking zoom & pan into account
    const startX = -pan.x / zoom;
    const startY = -pan.y / zoom;
    const endX = (width - pan.x) / zoom;
    const endY = (height - pan.y) / zoom;

    ctx.beginPath();
    for (let x = Math.floor(startX / gridSize) * gridSize; x <= endX; x += gridSize) {
      ctx.moveTo(x, startY);
      ctx.lineTo(x, endY);
    }
    for (let y = Math.floor(startY / gridSize) * gridSize; y <= endY; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(endX, y);
    }
    ctx.stroke();
  };

  const drawStroke = (ctx, stroke) => {
    if (stroke.points.length === 0) return;

    ctx.beginPath();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
    ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1.0;

    if (stroke.type === 'circle') {
      ctx.arc(stroke.cx, stroke.cy, stroke.r, 0, 2 * Math.PI);
      ctx.lineWidth = stroke.lineWidth;
      ctx.stroke();
    } else if (stroke.type === 'ellipse') {
      ctx.ellipse(stroke.cx, stroke.cy, stroke.rx, stroke.ry, 0, 0, 2 * Math.PI);
      ctx.lineWidth = stroke.lineWidth;
      ctx.stroke();
    } else if (stroke.type === 'rectangle') {
      ctx.lineWidth = stroke.lineWidth;
      ctx.strokeRect(stroke.x, stroke.y, stroke.w, stroke.h);
    } else if (stroke.type === 'triangle') {
      ctx.lineWidth = stroke.lineWidth;
      const v = stroke.vertices;
      ctx.moveTo(v[0].x, v[0].y);
      ctx.lineTo(v[1].x, v[1].y);
      ctx.lineTo(v[2].x, v[2].y);
      ctx.closePath();
      ctx.stroke();
    } else if (stroke.type === 'axes') {
      ctx.lineWidth = stroke.lineWidth;
      // Draw standard coordinate cross
      ctx.moveTo(stroke.minX, stroke.cy);
      ctx.lineTo(stroke.maxX, stroke.cy);
      ctx.moveTo(stroke.cx, stroke.minY);
      ctx.lineTo(stroke.cx, stroke.maxY);
      ctx.stroke();
    } else if (stroke.type === 'line') {
      ctx.lineWidth = stroke.lineWidth;
      ctx.moveTo(stroke.x1, stroke.y1);
      ctx.lineTo(stroke.x2, stroke.y2);
      ctx.stroke();
    } else {
      // Freehand drawing points rendering
      ctx.lineWidth = stroke.tool === 'highlighter' ? 20 : stroke.tool === 'eraser' ? 30 : stroke.lineWidth;
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1.0;
  };

  // Handle Resize
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      if (canvas && containerRef.current) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Mouse / Touch Events
  const getCoordinates = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return toWorldCoords(clientX, clientY);
  };

  const startDrawingOrPan = (e) => {
    // Check if middle click or space key is pressed or in panning tool
    if (e.button === 1 || tool === 'pan') {
      setIsPanning(true);
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      setPanStart({ x: clientX - pan.x, y: clientY - pan.y });
      return;
    }

    if (tool === 'text') {
      const point = getCoordinates(e);
      setTextInput({ x: point.x, y: point.y, value: '' });
      return;
    }

    setIsDrawing(true);
    const point = getCoordinates(e);
    currentPointsRef.current = [point];

    const newStroke = {
      id: `${Date.now()}-${userId}`,
      tool,
      color,
      lineWidth,
      points: [point],
    };

    setStrokes((prev) => [...prev, newStroke]);
  };

  const drawOrPan = (e) => {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    if (isPanning) {
      setPan({ x: clientX - panStart.x, y: clientY - panStart.y });
      return;
    }

    if (!isDrawing) {
      // Send cursor coordinates update
      const point = getCoordinates(e);
      if (socket) {
        socket.emit('whiteboard:cursor-move', { x: point.x, y: point.y, points: currentPointsRef.current.slice(-10) });
      }
      return;
    }

    const point = getCoordinates(e);
    currentPointsRef.current.push(point);

    // Render locally immediately
    setStrokes((prev) => {
      const next = [...prev];
      const current = next[next.length - 1];
      if (current) {
        if (tool === 'line') {
          current.x1 = current.points[0].x;
          current.y1 = current.points[0].y;
          current.x2 = point.x;
          current.y2 = point.y;
        } else if (tool === 'rectangle') {
          current.x = Math.min(current.points[0].x, point.x);
          current.y = Math.min(current.points[0].y, point.y);
          current.w = Math.abs(current.points[0].x - point.x);
          current.h = Math.abs(current.points[0].y - point.y);
          current.type = 'rectangle';
        } else if (tool === 'circle') {
          const dx = point.x - current.points[0].x;
          const dy = point.y - current.points[0].y;
          current.cx = current.points[0].x;
          current.cy = current.points[0].y;
          current.r = Math.sqrt(dx * dx + dy * dy);
          current.type = 'circle';
        } else {
          current.points = [...currentPointsRef.current];
        }
      }
      return next;
    });

    // Broadcast low latency coordinates
    if (socket) {
      socket.emit('whiteboard:cursor-move', { x: point.x, y: point.y, points: currentPointsRef.current.slice(-15) });
    }
  };

  const stopDrawingOrPan = () => {
    if (isPanning) {
      setIsPanning(false);
      return;
    }

    if (!isDrawing) return;
    setIsDrawing(false);

    setStrokes((prev) => {
      const next = [...prev];
      const lastStroke = next[next.length - 1];

      if (lastStroke) {
        // Run Magic Pen shape snapping recognition if active
        if (isMagicPen && tool === 'pen') {
          const snapped = recognizeAndSnapShape(lastStroke.points);
          if (snapped) {
            Object.assign(lastStroke, snapped);
          }
        }

        // Broadcast complete stroke
        if (socket) {
          socket.emit('whiteboard:stroke', lastStroke);
        }

        // Add to undo history
        setUndoStack((prevStack) => [...prevStack, lastStroke]);
        setRedoStack([]); // clear redo stack

        saveSnapshot(next, katexBlocks);
      }
      return next;
    });
  };

  // Undo Functionality
  const triggerUndo = () => {
    if (strokes.length === 0) return;
    const nextStrokes = [...strokes];
    const removed = nextStrokes.pop();

    setStrokes(nextStrokes);
    setRedoStack((prev) => [...prev, removed]);

    if (socket) {
      socket.emit('whiteboard:history-action', { type: 'undo' });
    }

    saveSnapshot(nextStrokes, katexBlocks);
  };

  // Redo Functionality
  const triggerRedo = () => {
    if (redoStack.length === 0) return;
    const nextRedo = [...redoStack];
    const item = nextRedo.pop();

    setStrokes((prev) => [...prev, item]);
    setRedoStack(nextRedo);

    if (socket) {
      socket.emit('whiteboard:history-action', { type: 'redo', payload: item });
    }

    saveSnapshot([...strokes, item], katexBlocks);
  };

  // Zoom controls
  const handleZoom = (factor) => {
    setZoom((z) => Math.max(0.1, Math.min(5, z * factor)));
  };

  // Save Text Block
  const saveTextInput = () => {
    if (!textInput || !textInput.value.trim()) {
      setTextInput(null);
      return;
    }

    const newBlock = {
      id: `${Date.now()}-${userId}`,
      x: textInput.x,
      y: textInput.y,
      text: textInput.value,
    };

    const updatedBlocks = [...katexBlocks, newBlock];
    setKatexBlocks(updatedBlocks);
    setTextInput(null);

    if (socket) {
      socket.emit('whiteboard:element-mutate', { type: 'katex-add', payload: newBlock });
    }

    saveSnapshot(strokes, updatedBlocks);
  };

  // Trigger Gemini Vision Equations OCR
  const handleTriggerOCR = async () => {
    setIsOcrLoading(true);
    try {
      const canvas = canvasRef.current;
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      const base64Image = canvas.toDataURL('image/png');
      const res = await axios.post('/api/whiteboard/ocr', { image: base64Image }, { headers });

      if (res.data && res.data.success && res.data.latex) {
        // Place OCR KaTeX block at viewport center
        const center = toWorldCoords(canvas.width / 2, canvas.height / 2);
        const ocrBlock = {
          id: `ocr-${Date.now()}`,
          x: center.x,
          y: center.y,
          text: res.data.latex,
        };

        const updated = [...katexBlocks, ocrBlock];
        setKatexBlocks(updated);

        if (socket) {
          socket.emit('whiteboard:element-mutate', { type: 'katex-add', payload: ocrBlock });
        }
        saveSnapshot(strokes, updated);
      }
    } catch (err) {
      console.error('OCR analysis failed:', err);
      alert('Handwriting formula analysis failed or no clear equation detected.');
    } finally {
      setIsOcrLoading(false);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-50 dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 flex flex-col">
      {/* Upper Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        {/* Draw toolbar */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 pointer-events-auto">
          {['pan', 'pen', 'line', 'rectangle', 'circle', 'text', 'highlighter', 'eraser'].map((t) => (
            <button
              key={t}
              onClick={() => setTool(t)}
              className={`p-2 rounded-xl transition-all ${
                tool === t
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
              title={t.charAt(0).toUpperCase() + t.slice(1)}
            >
              {t === 'pan' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              {t === 'pen' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
              {t === 'line' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 4L4 20" /></svg>}
              {t === 'rectangle' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect width="18" height="14" x="3" y="5" rx="2" strokeWidth={2} /></svg>}
              {t === 'circle' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={2} /></svg>}
              {t === 'text' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
              {t === 'highlighter' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.243 4.243a4 4 0 015.657 5.657l-12 12H3.243v-5.657l12-12z" /></svg>}
              {t === 'eraser' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
            </button>
          ))}
          <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
          {/* Color Picker */}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent"
          />
        </div>

        {/* AI & Shape Recognition Tools */}
        <div className="p-1.5 bg-white/90 dark:bg-slate-800/90 backdrop-blur rounded-2xl shadow-xl border border-slate-200/50 dark:border-slate-700/50 pointer-events-auto">
          <ShapeMagicTool
            isMagicPen={isMagicPen}
            setIsMagicPen={setIsMagicPen}
            onTriggerOCR={handleTriggerOCR}
            isOcrLoading={isOcrLoading}
          />
        </div>
      </div>

      {/* History and Viewport Actions */}
      <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2 pointer-events-auto bg-white/95 dark:bg-slate-800/95 backdrop-blur rounded-2xl p-1.5 shadow-xl border border-slate-200/50 dark:border-slate-700/50">
        <button
          onClick={triggerUndo}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
          title="Undo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" /></svg>
        </button>
        <button
          onClick={triggerRedo}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
          title="Redo"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" /></svg>
        </button>
        <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-0.5"></div>
        <button
          onClick={() => handleZoom(0.85)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold"
          title="Zoom Out"
        >
          -
        </button>
        <span className="text-xs text-slate-500 font-mono px-1">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => handleZoom(1.15)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-bold"
          title="Zoom In"
        >
          +
        </button>
      </div>

      {/* Main Workspace Frame */}
      <div ref={containerRef} className="relative flex-1 w-full h-full cursor-crosshair">
        {/* HTML5 Canvas */}
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawingOrPan}
          onMouseMove={drawOrPan}
          onMouseUp={stopDrawingOrPan}
          onMouseLeave={stopDrawingOrPan}
          onTouchStart={startDrawingOrPan}
          onTouchMove={drawOrPan}
          onTouchEnd={stopDrawingOrPan}
          className="absolute inset-0 w-full h-full bg-transparent touch-none"
        />

        {/* Text Area input for Text Tool */}
        {textInput && (
          <div
            className="absolute z-30 p-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl shadow-lg"
            style={{
              left: textInput.x * zoom + pan.x,
              top: textInput.y * zoom + pan.y,
            }}
          >
            <textarea
              autoFocus
              value={textInput.value}
              onChange={(e) => setTextInput({ ...textInput, value: e.target.value })}
              onBlur={saveTextInput}
              placeholder="Type equation (e.g. \int x dx)..."
              className="w-48 h-20 text-xs bg-slate-50 dark:bg-slate-900 border-0 outline-none p-1 text-slate-800 dark:text-slate-100"
            />
          </div>
        )}

        {/* Render KaTeX Overlay Blocks */}
        {katexBlocks.map((block) => {
          const screen = toScreenCoords(block.x, block.y);
          return (
            <div
              key={block.id}
              className="absolute pointer-events-auto bg-white/70 dark:bg-slate-800/70 px-2 py-1 rounded border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
              style={{
                left: screen.x,
                top: screen.y,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: katex.renderToString(block.text, { throwOnError: false }),
                }}
              />
              <button
                onClick={() => {
                  setKatexBlocks((prev) => prev.filter((b) => b.id !== block.id));
                  if (socket) {
                    socket.emit('whiteboard:element-mutate', { type: 'katex-delete', payload: block.id });
                  }
                  saveSnapshot(strokes, katexBlocks.filter((b) => b.id !== block.id));
                }}
                className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] shadow"
              >
                ×
              </button>
            </div>
          );
        })}

        {/* Peer Cursors and Trails */}
        {Array.from(cursors.entries()).map(([moverId, { x, y, username: peerName, color: peerColor, points: trailPoints }]) => {
          const screen = toScreenCoords(x, y);
          return (
            <React.Fragment key={moverId}>
              {/* Fade cursor points trail path */}
              {trailPoints && trailPoints.length > 1 && (
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <polyline
                    fill="none"
                    stroke={peerColor}
                    strokeWidth="2"
                    strokeOpacity="0.4"
                    points={trailPoints
                      .map((p) => {
                        const s = toScreenCoords(p.x, p.y);
                        return `${s.x},${s.y}`;
                      })
                      .join(' ')}
                  />
                </svg>
              )}

              {/* Cursor Pointer + Name Badge */}
              <div
                className="absolute pointer-events-none transition-all duration-75 ease-out z-40 flex flex-col items-start"
                style={{
                  left: screen.x,
                  top: screen.y,
                }}
              >
                <svg className="w-5 h-5 drop-shadow-md" style={{ color: peerColor }} fill="currentColor" viewBox="0 0 24 24">
                  <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z" />
                </svg>
                <div
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold text-white shadow-sm -mt-1 ml-3"
                  style={{ backgroundColor: peerColor }}
                >
                  {peerName}
                </div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default WhiteboardCanvas;
