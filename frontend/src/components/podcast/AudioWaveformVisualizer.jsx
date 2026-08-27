import React from 'react';
import { motion } from 'framer-motion';

const AudioWaveformVisualizer = ({ isPlaying = false }) => {
  const bars = Array.from({ length: 32 }, (_, i) => i);

  return (
    <div className="h-20 bg-gray-950/80 rounded-2xl border border-gray-800 flex items-center justify-center gap-1.5 px-4 overflow-hidden">
      {bars.map((bar) => {
        const randomHeight = Math.floor(Math.sin(bar * 0.4) * 25 + 35);

        return (
          <motion.div
            key={bar}
            animate={
              isPlaying
                ? {
                    height: [
                      `${Math.max(10, randomHeight - 15)}px`,
                      `${Math.min(65, randomHeight + 20)}px`,
                      `${Math.max(10, randomHeight - 10)}px`,
                    ],
                  }
                : { height: '12px' }
            }
            transition={{
              duration: 0.6 + (bar % 5) * 0.1,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: 'easeInOut',
            }}
            className="w-1.5 rounded-full bg-gradient-to-t from-indigo-500 to-purple-400 opacity-80"
          />
        );
      })}
    </div>
  );
};

export default AudioWaveformVisualizer;
