/**
 * @fileoverview Lightweight 3D preview mode for embedding interactive models on flashcard reverse sides.
 */
import React, { useState } from 'react';
import ThreeDViewer from '../visualizer3d/ThreeDViewer';

const Flashcard3DModel = ({ preset }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <div
                className="w-full max-w-[250px] h-[200px] cursor-pointer transition-transform hover:scale-105"
                onClick={() => setIsExpanded(true)}
            >
                <ThreeDViewer preset={preset} width="100%" height="100%" />
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg>
                Click to interact in 3D
            </p>

            {/* Expanded Modal for full interaction */}
            {isExpanded && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setIsExpanded(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="font-bold text-gray-900 dark:text-white capitalize">{preset} 3D Model</h3>
                            <button onClick={() => setIsExpanded(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                        <div className="p-4 bg-gray-50 dark:bg-gray-900">
                            <ThreeDViewer preset={preset} width="100%" height="400px" />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Flashcard3DModel;
