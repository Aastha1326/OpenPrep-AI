/**
 * @fileoverview Interactive player component that syncs video playback with timestamped summaries.
 */
import React, { useState } from 'react';

const VideoSummaryPlayer = ({ videoId, summaryData, onExport }) => {
    const [activePoint, setActivePoint] = useState(null);

    const handlePointClick = (seconds) => {
        setActivePoint(seconds);
        // In a real implementation, this would use the YouTube IFrame API to seek:
        // player.seekTo(seconds, true);
        // For this UI demo, we reload the iframe with the start parameter.
    };

    if (!summaryData) return null;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
            {/* Video Player Area */}
            <div className="lg:col-span-2 space-y-4">
                <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
                    <iframe
                        key={activePoint !== null ? activePoint : 'initial'}
                        src={`https://www.youtube.com/embed/${videoId}?start=${activePoint || 0}&rel=0`}
                        title="Lecture Video"
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                </div>
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">{summaryData.title}</h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{summaryData.overview}</p>
                    </div>
                    <button
                        onClick={onExport}
                        className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 font-medium rounded-lg transition-colors flex items-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Export Notes
                    </button>
                </div>
            </div>

            {/* Timestamped Summary Sidebar */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col h-[500px] lg:h-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        Key Points
                    </h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {summaryData.keyPoints.map((point, index) => (
                        <button
                            key={index}
                            onClick={() => handlePointClick(point.seconds)}
                            className={`w-full text-left p-3 rounded-lg transition-all duration-200 group ${activePoint === point.seconds
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${activePoint === point.seconds
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-700 dark:group-hover:text-blue-300'
                                    }`}>
                                    {point.timestamp}
                                </span>
                                <span className="font-semibold text-sm text-gray-900 dark:text-white">{point.heading}</span>
                            </div>
                            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed pl-1">
                                {point.summary}
                            </p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default VideoSummaryPlayer;
