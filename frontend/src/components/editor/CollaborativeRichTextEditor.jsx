/**
 * @fileoverview Rich-text editor component with simulated real-time collaboration and cursor tracking.
 */
import React, { useState, useEffect, useRef } from 'react';

const CollaborativeRichTextEditor = ({ initialContent, onContentChange, remoteCursors }) => {
    const [content, setContent] = useState(initialContent);
    const [isBold, setIsBold] = useState(false);
    const textareaRef = useRef(null);

    useEffect(() => {
        setContent(initialContent);
    }, [initialContent]);

    const handleInput = (e) => {
        const newContent = e.target.value;
        setContent(newContent);

        // In a real implementation, calculate the diff and send an OT/CRDT operation
        // For this mock, we send the full content update (debounced in production)
        onContentChange(newContent);
    };

    const applyFormat = (format) => {
        // Mock formatting logic
        if (format === 'bold') setIsBold(!isBold);
        // In production, use document.execCommand or a library like Slate.js/Draft.js
    };

    return (
        <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Toolbar */}
            <div className="flex items-center gap-2 p-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <button
                    onClick={() => applyFormat('bold')}
                    className={`p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors ${isBold ? 'bg-gray-200 dark:bg-gray-700 font-bold' : ''}`}
                    title="Bold"
                >
                    B
                </button>
                <button
                    onClick={() => applyFormat('italic')}
                    className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors italic"
                    title="Italic"
                >
                    I
                </button>
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2"></div>
                <button className="p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" title="Bullet List">
                    • List
                </button>
            </div>

            {/* Editor Area */}
            <div className="relative flex-1 overflow-hidden">
                <textarea
                    ref={textareaRef}
                    value={content}
                    onChange={handleInput}
                    className={`w-full h-full p-4 resize-none outline-none bg-transparent text-gray-900 dark:text-gray-100 leading-relaxed ${isBold ? 'font-bold' : ''}`}
                    placeholder="Start collaborating..."
                    spellCheck="false"
                />

                {/* Remote Cursors Overlay */}
                {remoteCursors.map((cursor) => (
                    <div
                        key={cursor.userId}
                        className="absolute pointer-events-none transition-all duration-100 ease-out"
                        style={{ top: cursor.y, left: cursor.x }}
                    >
                        <div className="relative">
                            <div className="w-0.5 h-5 bg-blue-500"></div>
                            <div className="absolute top-0 left-2 px-2 py-0.5 bg-blue-500 text-white text-xs rounded whitespace-nowrap">
                                {cursor.username}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CollaborativeRichTextEditor;
