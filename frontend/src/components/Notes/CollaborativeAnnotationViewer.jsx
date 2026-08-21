/**
 * @fileoverview Viewer component that overlays collaborative annotations on top of a note image.
 */
import React, { useState } from 'react';

const CollaborativeAnnotationViewer = ({ noteUrl, initialAnnotations }) => {
    const [annotations, setAnnotations] = useState(initialAnnotations || []);
    const [isAdding, setIsAdding] = useState(false);
    const [newAnnotation, setNewAnnotation] = useState({ x: 0, y: 0, text: '' });
    const [activeAnnotation, setActiveAnnotation] = useState(null);

    const handleImageClick = (e) => {
        if (!isAdding) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;

        setNewAnnotation({ ...newAnnotation, x, y });
    };

    const saveAnnotation = () => {
        if (!newAnnotation.text.trim()) return;

        const annotation = {
            id: `ann_${Date.now()}`,
            userId: 'current-user',
            x: newAnnotation.x,
            y: newAnnotation.y,
            text: newAnnotation.text,
            timestamp: new Date().toISOString(),
        };

        setAnnotations([...annotations, annotation]);
        setIsAdding(false);
        setNewAnnotation({ x: 0, y: 0, text: '' });
        // TODO: API call to save annotation
    };

    const deleteAnnotation = (id) => {
        setAnnotations(annotations.filter(ann => ann.id !== id));
        setActiveAnnotation(null);
        // TODO: API call to delete annotation
    };

    return (
        <div className="relative w-full bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* Toolbar */}
            <div className="absolute top-4 left-4 z-20 flex gap-2">
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className={`px-4 py-2 rounded-lg font-medium text-sm shadow-md transition-colors ${isAdding
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600'
                        }`}
                >
                    {isAdding ? 'Cancel' : '+ Add Note'}
                </button>
            </div>

            {/* Image Container */}
            <div
                className={`relative w-full min-h-[400px] ${isAdding ? 'cursor-crosshair' : 'cursor-default'}`}
                onClick={handleImageClick}
            >
                <img src={noteUrl} alt="Shared Note" className="w-full h-auto object-contain" />

                {/* Render Existing Annotations */}
                {annotations.map((ann) => (
                    <div
                        key={ann.id}
                        className="absolute z-10 group"
                        style={{ left: `${ann.x}%`, top: `${ann.y}%`, transform: 'translate(-50%, -50%)' }}
                    >
                        <div
                            onClick={(e) => { e.stopPropagation(); setActiveAnnotation(activeAnnotation === ann.id ? null : ann.id); }}
                            className="w-6 h-6 bg-yellow-400 border-2 border-white dark:border-gray-800 rounded-full shadow-md cursor-pointer hover:scale-110 transition-transform"
                        ></div>

                        {activeAnnotation === ann.id && (
                            <div className="absolute top-8 left-1/2 -translate-x-1/2 w-64 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-30">
                                <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">{ann.text}</p>
                                <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-700 pt-2">
                                    <span>{new Date(ann.timestamp).toLocaleDateString()}</span>
                                    {ann.userId === 'current-user' && (
                                        <button
                                            onClick={() => deleteAnnotation(ann.id)}
                                            className="text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Delete
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* New Annotation Input */}
                {isAdding && newAnnotation.x > 0 && (
                    <div
                        className="absolute z-30 w-64 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-xl border border-blue-300 dark:border-blue-700"
                        style={{ left: `${newAnnotation.x}%`, top: `${newAnnotation.y}%`, transform: 'translate(-50%, -50%)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <textarea
                            autoFocus
                            value={newAnnotation.text}
                            onChange={(e) => setNewAnnotation({ ...newAnnotation, text: e.target.value })}
                            placeholder="Type your note here..."
                            className="w-full px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none mb-2"
                            rows={3}
                        />
                        <button
                            onClick={saveAnnotation}
                            className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                        >
                            Save Note
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CollaborativeAnnotationViewer;
