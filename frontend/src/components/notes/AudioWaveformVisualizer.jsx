import React, { useRef, useEffect } from 'react';

const AudioWaveformVisualizer = ({ 
  recording, 
  analyser, 
  width = 350, 
  height = 80, 
  isPlayback = false 
}) => {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (isPlayback) {
      // Draw static waveform for playback preview
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const peaksCount = 40;
      const barWidth = canvas.width / peaksCount;
      
      ctx.fillStyle = '#b45309'; // amber-700
      for (let i = 0; i < peaksCount; i++) {
        const h = 10 + Math.random() * (canvas.height - 20);
        const y = (canvas.height - h) / 2;
        ctx.fillRect(i * barWidth + 2, y, barWidth - 4, h);
      }
      return;
    }

    if (recording && analyser) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!recording) return;
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'transparent';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          barHeight = dataArray[i] / 2;

          const grad = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
          grad.addColorStop(0, '#d97706'); // amber-600
          grad.addColorStop(1, '#f59e0b'); // amber-500

          ctx.fillStyle = grad;
          ctx.fillRect(x, canvas.height - barHeight, barWidth - 2, barHeight);

          x += barWidth;
        }
      };
      draw();
    } else {
      // Clear when not recording and not playback
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [recording, analyser, isPlayback]);

  return (
    <canvas 
      ref={canvasRef} 
      width={width} 
      height={height} 
      className={`rounded ${isPlayback ? 'border border-neutral-200 bg-white' : ''} max-w-xs w-full`} 
    />
  );
};

export default AudioWaveformVisualizer;
