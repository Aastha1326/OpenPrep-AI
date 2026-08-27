/**
 * @fileoverview Interactive audio player synchronized with clickable transcript lines.
 */
import React, { useState, useRef } from 'react';

const AudioTranscriptPlayer = ({ audioUrl, segments }) => {
    const audioRef = useRef(null);
    const [currentTime, setCurrentTime] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const jumpToTime = (time) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            audioRef.current.play();
            setIsPlaying(true);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Audio Controls */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <audio
                    ref={audioRef}
                    src={audioUrl}
                    onTimeUpdate={handleTimeUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    className="w-full"
                    controls
                />
            </div>

            {/* Synchronized Transcript */}
            <div className="max-h-96 overflow-y-auto p-4 space-y-3">
                {segments.map((segment, index) => {
                    const isActive = currentTime >= segment.start && currentTime < segment.end;
                    return (
                        <div
                            key={index}
                            onClick={() => jumpToTime(segment.start)}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                                    }`}>
                                    {formatTime(segment.start)}
                                </span>
                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">
                                    {segment.speaker}
                                </span>
                            </div>
                            <p className={`text-sm leading-relaxed ${isActive ? 'text-blue-900 dark:text-blue-100 font-medium' : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                {segment.text}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default AudioTranscriptPlayer;
