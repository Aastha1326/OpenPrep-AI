/**
 * @fileoverview Main page for browsing and interacting with 3D educational presets.
 */
import React, { useState } from 'react';
import ThreeDViewer from '../components/visualizer3d/ThreeDViewer';

const PRESETS_LIST = [
    { id: 'methane', name: 'Methane (CH₄)', category: 'Chemistry', description: 'Tetrahedral molecular geometry with 109.5° bond angles.' },
    { id: 'tetrahedron', name: 'Regular Tetrahedron', category: 'Mathematics', description: 'Platonic solid composed of four triangular faces.' },
];

const ConceptVisualizer = () => {
    const [selectedPreset, setSelectedPreset] = useState('methane');

    const activePresetData = PRESETS_LIST.find(p => p.id === selectedPreset);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">3D Concept Visualizer</h1>
                    <p className="text-gray-600 dark:text-gray-400">Interact with molecular structures and geometric shapes to enhance spatial understanding.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sidebar: Preset Selector */}
                    <div className="lg:col-span-1 space-y-4">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Educational Presets</h2>
                        {PRESETS_LIST.map((preset) => (
                            <button
                                key={preset.id}
                                onClick={() => setSelectedPreset(preset.id)}
                                className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${selectedPreset === preset.id
                                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="font-bold text-gray-900 dark:text-white">{preset.name}</span>
                                    <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                        {preset.category}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{preset.description}</p>
                            </button>
                        ))}
                    </div>

                    {/* Main Viewport */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-2">
                            <ThreeDViewer preset={selectedPreset} width="100%" height="500px" />
                        </div>

                        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                Study Tip
                            </h3>
                            <p className="text-blue-800 dark:text-blue-300 text-sm leading-relaxed">
                                Use your mouse or touch gestures to rotate the model. Observe the spatial relationships between atoms or vertices.
                                This interactive view is particularly useful for understanding steric hindrance in organic chemistry or vector projections in calculus.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ConceptVisualizer;
