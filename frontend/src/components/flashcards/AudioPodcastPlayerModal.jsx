import React, { useRef, useState, useEffect } from 'react';
import {
  FaPlay,
  FaPause,
  FaUndoAlt,
  FaDownload,
  FaVolumeUp,
  FaTimes,
  FaAudioDescription,
} from 'react-icons/fa';

export default function AudioPodcastPlayerModal({ isOpen, onClose, episodeData, subjectName, flashcards = [] }) {
  if (!isOpen) return null;

  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [volume, setVolume] = useState(0.8);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Format time (mm:ss)
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handlePlayPause = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => console.error('Audio play failed:', err));
    }
  };

  const handleRewind = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 15);
  };

  const handleTimeUpdate = () => {
    if (!audioRef.current) return;
    setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (!audioRef.current) return;
    setDuration(audioRef.current.duration || episodeData.durationSeconds || 0);
  };

  const handleSeek = (e) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleDownload = () => {
    if (!episodeData?.audioUrl) return;
    const link = document.createElement('a');
    link.href = episodeData.audioUrl;
    link.download = `${subjectName}_Revision_Podcast.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="podcast-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <div className="bg-neutral-900 border border-neutral-850 rounded-3xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-neutral-850 pb-4 mb-4">
          <div className="flex items-center gap-2 text-indigo-400">
            <FaAudioDescription className="text-xl" />
            <div>
              <h2 id="podcast-modal-title" className="text-stone-100 font-extrabold font-playfair text-lg leading-tight">
                {episodeData?.title || 'Study Podcast'}
              </h2>
              <p className="text-stone-400 text-xs mt-0.5">{subjectName} Deck Revision</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-750 text-stone-300 hover:text-stone-100 rounded-full transition cursor-pointer"
            aria-label="Close audio podcast player"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        {/* Hidden Native Audio Element */}
        <audio
          ref={audioRef}
          src={episodeData?.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Player Body */}
        <div className="space-y-6 flex-1 overflow-y-auto pr-1">
          {/* Progress Seek Bar */}
          <div className="space-y-1.5">
            <input
              type="range"
              min={0}
              max={duration || 100}
              value={currentTime}
              onChange={handleSeek}
              className="w-full h-1.5 bg-neutral-850 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              aria-label="Seek audio position"
            />
            <div className="flex justify-between text-[10px] text-stone-400 font-bold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Player controls */}
          <div className="flex justify-center items-center gap-6">
            {/* Speed modifier */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-stone-400 uppercase tracking-widest font-black mb-1">Speed</span>
              <select
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="bg-neutral-800 border border-neutral-700 text-stone-300 text-xs rounded-lg px-2 py-1 outline-none"
                aria-label="Adjust playback speed multiplier"
              >
                <option value={0.8}>0.8x</option>
                <option value={1.0}>1.0x (Normal)</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
              </select>
            </div>

            {/* Rewind 15s */}
            <button
              onClick={handleRewind}
              className="p-3 bg-neutral-800 hover:bg-neutral-750 text-stone-200 hover:text-stone-50 border border-neutral-750 rounded-full transition cursor-pointer"
              aria-label="Rewind 15 seconds"
            >
              <FaUndoAlt className="text-sm" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              className="p-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
              aria-label={isPlaying ? 'Pause podcast' : 'Play podcast'}
            >
              {isPlaying ? <FaPause className="text-lg" /> : <FaPlay className="text-lg ml-0.5" />}
            </button>

            {/* Download MP3 */}
            <button
              onClick={handleDownload}
              className="p-3 bg-neutral-800 hover:bg-neutral-750 text-stone-200 hover:text-stone-50 border border-neutral-750 rounded-full transition cursor-pointer"
              aria-label="Download MP3 version for offline revision"
            >
              <FaDownload className="text-sm" />
            </button>

            {/* Volume adjustments */}
            <div className="flex flex-col items-center">
              <span className="text-[9px] text-stone-400 uppercase tracking-widest font-black mb-1">Volume</span>
              <div className="flex items-center gap-1.5">
                <FaVolumeUp className="text-stone-400 text-xs" />
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.1}
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                  className="w-16 h-1 bg-neutral-850 accent-indigo-500"
                  aria-label="Adjust playback volume level"
                />
              </div>
            </div>
          </div>

          {/* Interactive live captions/transcripts */}
          <div className="border-t border-neutral-850 pt-4 space-y-3">
            <h3 className="text-stone-300 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5">
              <span>📝 Revise Caption Transcripts</span>
            </h3>
            <div className="bg-stone-950/60 rounded-2xl p-4 border border-neutral-850/80 max-h-40 overflow-y-auto text-xs space-y-3.5">
              {flashcards.map((card, idx) => (
                <div key={idx} className="border-b border-neutral-850/50 pb-2.5 last:border-b-0 last:pb-0">
                  <span className="text-indigo-400 font-bold uppercase tracking-wider text-[9px]">Card {idx + 1}</span>
                  <p className="text-stone-200 font-semibold mt-0.5">Q: {card.front}</p>
                  <p className="text-stone-400 mt-1">A: {card.back}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
