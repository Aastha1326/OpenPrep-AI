/**
 * @fileoverview Canvas-based interactive whiteboard component.
 * Syncs drawing strokes with other users via WebSockets.
 */
import React, { useRef, useEffect, useState } from 'react';

const InteractiveWhiteboard = ({ socket, roomId, isHost }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [tool, setTool] = useState('pen'); // 'pen' or 'eraser'
    const [color, setColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(3);
    const [strokes, setStrokes] = useState([]);

    // Initialize canvas and handle resizing
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight || 500;
            redrawCanvas();
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    // Listen for incoming strokes from other users
    useEffect(() => {
        if (!socket) return;

        const handleReceiveStroke = ({ strokeData }) => {
            setStrokes((prev) => [...prev, strokeData]);
            drawStroke(strokeData);
        };

        const handleClear = () => {
            setStrokes([]);
            clearCanvas();
        };

        socket.on('receive_stroke', handleReceiveStroke);
        socket.on('whiteboard_cleared', handleClear);

        return () => {
            socket.off('receive_stroke', handleReceiveStroke);
            socket.off('whiteboard_cleared', handleClear);
        };
    }, [socket]);

    const redrawCanvas = () => {
        clearCanvas();
        strokes.forEach(stroke => drawStroke(stroke));
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const drawStroke = (stroke) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        ctx.beginPath();
        ctx.moveTo(stroke.x, stroke.y);
        ctx.lineTo(stroke.x, stroke.y); // For single dots
        ctx.strokeStyle = stroke.isEraser ? '#FFFFFF' : stroke.color;
        ctx.lineWidth = stroke.isEraser ? stroke.width * 3 : stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };
    };

    const startDrawing = (e) => {
        setIsDrawing(true);
        const { x, y } = getCoordinates(e);
        const strokeData = { x, y, color, width: lineWidth, tool, isEraser: tool === 'eraser' };

        setStrokes((prev) => [...prev, strokeData]);
        drawStroke(strokeData);

        if (socket && roomId) {
            socket.emit('draw_stroke', { roomId, strokeData });
        }
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        const strokeData = { x, y, color, width: lineWidth, tool, isEraser: tool === 'eraser' };

        setStrokes((prev) => [...prev, strokeData]);
        drawStroke(strokeData);

        if (socket && roomId) {
            socket.emit('draw_stroke', { roomId, strokeData });
        }
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const handleClear = () => {
        clearCanvas();
        setStrokes([]);
        if (socket && roomId) {
            socket.emit('clear_whiteboard', { roomId });
        }
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-4 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setTool('pen')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        title="Pen"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                    </button>
                    <button
                        onClick={() => setTool('eraser')}
                        className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                        title="Eraser"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-300 dark:bg-gray-600"></div>

                <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    disabled={tool === 'eraser'}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                    title="Color Picker"
                />

                <input
                    type="range"
                    min="1"
                    max="10"
                    value={lineWidth}
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                    className="w-24 accent-blue-600"
                    title="Line Width"
                />

                <div className="flex-1"></div>

                {isHost && (
                    <button
                        onClick={handleClear}
                        className="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                    >
                        Clear Board
                    </button>
                )}
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-white dark:bg-gray-800 cursor-crosshair">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="absolute inset-0 w-full h-full"
                />
            </div>
        </div>
    );
};

export default InteractiveWhiteboard;
