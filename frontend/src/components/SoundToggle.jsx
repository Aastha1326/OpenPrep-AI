import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

const SoundToggle = ({ className = '' }) => {
  const [soundEnabled, setSoundEnabled] = useState(
    localStorage.getItem('soundEnabled') !== 'false'
  );

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    localStorage.setItem('soundEnabled', newState);
  };

  return (
    <button
      onClick={toggleSound}
      className={`p-2 rounded-lg bg-amber-100/50 hover:bg-amber-100 dark:bg-slate-800 dark:hover:bg-slate-700/80 transition ${className}`}
      aria-label="Toggle sound and haptics"
    >
      {soundEnabled ? (
        <Volume2 className="h-5 w-5 text-amber-700 dark:text-amber-400" />
      ) : (
        <VolumeX className="h-5 w-5 text-stone-500" />
      )}
    </button>
  );
};

export default SoundToggle;
