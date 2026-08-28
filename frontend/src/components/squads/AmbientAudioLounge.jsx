/**
 * @fileoverview Multi-channel ambient audio mixer for personalized soundscapes.
 */
import React, { useState } from 'react';

const sounds = [
    { id: 'lofi', name: 'Lo-Fi Study Beats', icon: '🎵' },
    { id: 'rain', name: 'Rain on Window', icon: '🌧️' },
    { id: 'cafe', name: 'Coffee Shop Murmur', icon: '☕' },
    { id: 'white', name: 'White Noise', icon: '🌊' },
    { id: 'forest', name: 'Forest Breeze', icon: '🌲' },
];

const AmbientAudioLounge = () => {
    const [volumes, setVolumes] = useState({ lofi: 0, rain: 0, cafe: 0, white: 0, forest: 0 });

    const handleVolumeChange = (id, value) => {
        setVolumes(prev => ({ ...prev, [id]: value }));
        // In production, update HTML5 Audio element volume here
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="text-2xl">🎧</span> Ambient Sound Mixer
            </h3>
            <div className="space-y-6">
                {sounds.map((sound) => (
                    <div key={sound.id} className="flex items-center gap-4">
                        <span className="text-2xl w-8 text-center">{sound.icon}</span>
                        <div className="flex-1">
                            <div className="flex justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{sound.name}</span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{volumes[sound.id]}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={volumes[sound.id]}
                                onChange={(e) => handleVolumeChange(sound.id, Number(e.target.value))}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AmbientAudioLounge;
