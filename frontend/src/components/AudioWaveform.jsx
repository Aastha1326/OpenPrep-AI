import React from 'react';
import { motion } from 'framer-motion';

const AudioWaveform = ({ status }) => {
  const isActive = status === 'LISTENING' || status === 'PROCESSING' || status === 'SPEAKING';
  
  // Different animation speeds based on status
  const duration = status === 'SPEAKING' ? 0.4 : (status === 'PROCESSING' ? 0.2 : 0.8);
  const numBars = 5;

  if (status === 'IDLE' || status === 'ERROR') return null;

  return (
    <div className="flex items-center justify-center gap-1 h-6 px-2" aria-hidden="true">
      {Array.from({ length: numBars }).map((_, i) => (
        <motion.div
          key={i}
          className={`w-1 rounded-full ${status === 'SPEAKING' ? 'bg-green-500' : 'bg-primary-500'}`}
          initial={{ height: 4 }}
          animate={{ height: isActive ? [4, 16, 4] : 4 }}
          transition={{
            repeat: Infinity,
            duration,
            delay: i * 0.1,
            ease: 'easeInOut'
          }}
        />
      ))}
    </div>
  );
};

export default AudioWaveform;
