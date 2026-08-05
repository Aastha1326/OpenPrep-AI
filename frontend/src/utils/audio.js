// Audio and haptics utility using Web Audio API

const playTone = (frequency, type, duration) => {
  const isSoundEnabled = localStorage.getItem('soundEnabled') !== 'false';
  if (!isSoundEnabled) return;

  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
  } catch (err) {
    console.error('Web Audio API not supported', err);
  }
};

export const playSelectSound = () => {
  playTone(440, 'sine', 0.1); // A4
  triggerHaptic(50);
};

export const playSuccessSound = () => {
  playTone(880, 'sine', 0.15); // A5
  setTimeout(() => playTone(1108.73, 'sine', 0.3), 100); // C#6
  triggerHaptic([50, 50, 100]);
};

export const playTimerCompleteSound = () => {
  playTone(523.25, 'triangle', 0.2); // C5
  setTimeout(() => playTone(659.25, 'triangle', 0.2), 200); // E5
  setTimeout(() => playTone(783.99, 'triangle', 0.4), 400); // G5
  triggerHaptic([200, 100, 200, 100, 400]);
};

export const triggerHaptic = (pattern) => {
  const isHapticsEnabled = localStorage.getItem('hapticsEnabled') !== 'false';
  if (!isHapticsEnabled) return;

  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};
