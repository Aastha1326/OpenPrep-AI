/**
 * @fileoverview Split-screen UI for reviewing and editing segmented PDF questions.
 */
import React, { useState } from 'react';

const QuestionSegmentationReviewer = ({ segments }) => {
    const [editedSegments, setEditedSegments] = useState(segments);
    const [selectedId, setSelectedId] = useState(segments[0]?.id);

    const handleTextChange = (id, field, value) => {
        setEditedSegments(prev => prev.map(seg =>
            seg.id === id ? { ...seg, [field]: value } : seg
        ));
    };

    const selectedSegment = editedSegments.find(s => s.id === selectedId);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            {/* Left: PDF Preview Mock */}
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">PDF Preview</h3>
                <div className="bg-white dark:bg-gray-900 p-8 rounded shadow-sm min-h-[500px] relative">
                    {editedSegments.map((seg) => (
                        <div
                            key={seg.id}
                            onClick={() => setSelectedId(seg.id)}
                            className={`absolute border-2 cursor-pointer transition-colors ${selectedId === seg.id
                                    ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-900/20'
                                    : 'border-green-400 hover:border-green-500'
                                }`}
                            style={{
                                left: seg.boundingBox.x,
                                top: seg.boundingBox.y,
                                width: seg.boundingBox.width,
                                height: seg.boundingBox.height
                            }}
                        >
                            <span className="absolute -top-6 left-0 bg-blue-600 text-white text-xs px-2 py-0.5 rounded">
                                {seg.id.toUpperCase()}
                            </span>
                        </div>
                    ))}
                    <p className="text-gray-400 text-center mt-20">[ Mock PDF Page 1 Rendering ]</p>
                </div>
            </div>

            {/* Right: Editable Question Card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 overflow-y-auto">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Edit Question</h3>
                {selectedSegment ? (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Question Text (LaTeX supported)</label>
                            <textarea
                                value={selectedSegment.questionText}
                                onChange={(e) => handleTextChange(selectedSegment.id, 'questionText', e.target.value)}
                                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                rows={4}
                            />
                        </div>

                        {selectedSegment.hasDiagram && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Extracted Diagram</label>
                                <img src={selectedSegment.diagramUrl} alt="Diagram" className="w-full max-w-xs rounded border border-gray-200 dark:border-gray-600" />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">OCR: {selectedSegment.ocrText}</p>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Options</label>
                            {selectedSegment.options.map((opt, idx) => (
                                <input
                                    key={idx}
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                        const newOptions = [...selectedSegment.options];
                                        newOptions[idx] = e.target.value;
                                        handleTextChange(selectedSegment.id, 'options', newOptions);
                                    }}
                                    className="w-full px-3 py-2 mb-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            ))}
                        </div>

                        <button className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors">
                            Save & Add to Quiz Bank
                        </button>
                    </div>
                ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center mt-10">Select a bounding box to edit.</p>
                )}
            </div>
        </div>
    );
};

export default QuestionSegmentationReviewer;
