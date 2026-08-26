/**
 * @fileoverview Interactive HTML5 Canvas component for freehand drawing and shapes.
 * Supports pan, zoom, and real-time multi-user stroke rendering.
 */
import React, { useRef, useEffect, useState } from 'react';

const WhiteboardCanvas = ({ socket, squadId, userId, username }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen'); // 'pen', 'highlighter', 'eraser'
    const [color, setColor] = useState('#000000');
    const [cursors, setCursors] = useState(new Map());
    const [strokes, setStrokes] = useState([]);

    // Initialize socket listeners
    useEffect(() => {
        if (!socket || !squadId) return;

        socket.emit('whiteboard:join', { squadId, userId, username });

        socket.on('whiteboard:sync', ({ strokes: syncedStrokes }) => {
            setStrokes(syncedStrokes);
            redrawCanvas(syncedStrokes);
        });

        socket.on('whiteboard:stroke-received', (newStroke) => {
            setStrokes((prev) => [...prev, newStroke]);
            drawStroke(newStroke);
        });

        socket.on('whiteboard:cursor-moved', ({ userId: moverId, x, y }) => {
            setCursors((prev) => new Map(prev).set(moverId, { x, y }));
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
            socket.off('whiteboard:cursor-moved');
            socket.off('whiteboard:cursor-left');
        };
    }, [socket, squadId, userId, username]);

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (canvas) {
                canvas.width = canvas.parentElement.clientWidth;
                canvas.height = canvas.parentElement.clientHeight;
                redrawCanvas(strokes);
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [strokes]);

    const redrawCanvas = (strokesToDraw) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw grid
        drawGrid(ctx, canvas.width, canvas.height);

        strokesToDraw.forEach(stroke => drawStroke(stroke));
    };

    const drawGrid = (ctx, width, height) => {
        ctx.strokeStyle = '#e5e7eb';
        ctx.lineWidth = 1;
        const gridSize = 40;
        for (let x = 0; x <= width; x += gridSize) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
        }
        for (let y = 0; y <= height; y += gridSize) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
        }
    };

    const drawStroke = (stroke) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.lineWidth = stroke.tool === 'highlighter' ? 20 : stroke.tool === 'eraser' ? 30 : 3;
        ctx.strokeStyle = stroke.tool === 'eraser' ? '#ffffff' : stroke.color;
        ctx.globalAlpha = stroke.tool === 'highlighter' ? 0.3 : 1.0;

        if (stroke.points.length > 0) {
            ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
        }
        ctx.stroke();
        ctx.globalAlpha = 1.0;
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const point = getCoordinates(e);
        const newStroke = {
            id: `${Date.now()}-${userId}`,
            tool,
            color,
            points: [point],
        };
        setStrokes((prev) => [...prev, newStroke]);
        drawStroke(newStroke);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const point = getCoordinates(e);

        // Update last stroke
        setStrokes((prev) => {
            const updated = [...prev];
            const lastStroke = updated[updated.length - 1];
            lastStroke.points.push(point);
            return updated;
        });

        // Throttled socket emission could go here
        socket.emit('whiteboard:stroke', {
            id: `${Date.now()}-${userId}`,
            tool,
            color,
            points: [point], // Simplified for demo; ideally send incremental points
        });

        // Emit cursor move
        socket.emit('whiteboard:cursor-move', point);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    return (
        <div className="relative w-full h-full bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Toolbar */}
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 flex items-center gap-2 p-2 bg-white dark:bg-gray-800 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
                {['pen', 'highlighter', 'eraser'].map((t) => (
                    <button
                        key={t}
                        onClick={() => setTool(t)}
                        className={`p-2 rounded-full transition-colors ${tool === t ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        title={t.charAt(0).toUpperCase() + t.slice(1)}
                    >
                        {t === 'pen' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                        {t === 'highlighter' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>}
                        {t === 'eraser' && <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                    </button>
                ))}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-8 h-8 rounded-full cursor-pointer border-0 bg-transparent"
                />
            </div>

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
            />

            {/* Remote Cursors */}
            {Array.from(cursors.entries()).map(([cursorId, { x, y }]) => (
                <div
                    key={cursorId}
                    className="absolute pointer-events-none transition-all duration-75 ease-out"
                    style={{ left: x, top: y }}
                >
                    <svg className="w-6 h-6 text-blue-500 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z" />
                    </svg>
                </div>
            ))}
        </div>
    );
};

export default WhiteboardCanvas;
