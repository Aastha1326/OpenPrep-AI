import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * AmbientAudioPlayer — lo-fi background sound player for the Pomodoro timer.
 *
 * Uses HTML5 <audio> with looping ambient tracks. Handles browser autoplay
 * policy by showing a gentle "click to enable" prompt.
 */

const AMBIENT_SOUNDS = [
  {
    id: 'lofi',
    label: 'Lo-Fi Beats',
    icon: '🎵',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_73d47d12f3.mp3',
  },
  {
    id: 'rain',
    label: 'Rain',
    icon: '🌧️',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3',
  },
  {
    id: 'whitenoise',
    label: 'White Noise',
    icon: '🌬️',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_73d47d12f3.mp3',
  },
  {
    id: 'coffee',
    label: 'Coffee Shop',
    icon: '☕',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_dc39b4b0eb.mp3',
  },
];

const AmbientAudioPlayer = ({ isPlaying = false, className = '' }) => {
  const [selectedSound, setSelectedSound] = useState('lofi');
  const [volume, setVolume] = useState(0.3);
  const [isMuted, setIsMuted] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const audioRef = useRef(null);

  const currentSound = AMBIENT_SOUNDS.find((s) => s.id === selectedSound) || AMBIENT_SOUNDS[0];

  // ── Sync playback state ────────────────────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying && !isMuted) {
      audio.play().catch(() => {
        setAutoplayBlocked(true);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, isMuted, selectedSound]);

  // ── Sync volume ────────────────────────────────────────────────────
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // ── Sound change ───────────────────────────────────────────────────
  const handleSoundChange = useCallback((soundId) => {
    setSelectedSound(soundId);
    setShowDropdown(false);
    setAutoplayBlocked(false);
  }, []);

  // ── Enable audio (after autoplay block) ────────────────────────────
  const handleEnableAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().then(() => {
      setAutoplayBlocked(false);
    }).catch(() => {
      setAutoplayBlocked(true);
    });
  }, []);

  // ── Volume slider ──────────────────────────────────────────────────
  const handleVolumeChange = useCallback((e) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (val > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => !m);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Hidden audio element */}
      <audio ref={audioRef} loop preload="auto" src={currentSound.url} />

      {/* Autoplay blocked prompt */}
      {autoplayBlocked && isPlaying && (
        <button
          type="button"
          onClick={handleEnableAudio}
          className="mb-2 w-full rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-300 cursor-pointer"
        >
          🔊 Click to enable ambient audio
        </button>
      )}

      <div className="flex items-center gap-2">
        {/* Sound selector dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition"
            aria-label={`Select ambient sound: ${currentSound.label}`}
          >
            <span>{currentSound.icon}</span>
            <span className="hidden sm:inline">{currentSound.label}</span>
            <svg className={`h-3 w-3 transition-transform ${showDropdown ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showDropdown && (
            <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl">
              {AMBIENT_SOUNDS.map((sound) => (
                <button
                  key={sound.id}
                  type="button"
                  onClick={() => handleSoundChange(sound.id)}
                  className={`flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition cursor-pointer ${
                    selectedSound === sound.id
                      ? 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 font-medium'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  <span>{sound.icon}</span>
                  <span>{sound.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Volume control */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleMute}
            className="rounded-md p-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition"
            aria-label={isMuted ? 'Unmute ambient audio' : 'Mute ambient audio'}
          >
            {isMuted || volume === 0 ? (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6l-4 4H4v4h4l4 4V6z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-1 w-16 cursor-pointer accent-amber-500"
            aria-label="Ambient audio volume"
          />
        </div>
      </div>
    </div>
  );
};

AmbientAudioPlayer.propTypes = {
  isPlaying: PropTypes.bool,
  className: PropTypes.string,
};

export default AmbientAudioPlayer;
export { AMBIENT_SOUNDS };
