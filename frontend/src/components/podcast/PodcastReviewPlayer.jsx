import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Headphones, Volume2, Moon, Clock, Sparkles } from 'lucide-react';
import AudioWaveformVisualizer from './AudioWaveformVisualizer';
import EpisodeChapterList from './EpisodeChapterList';

const PodcastReviewPlayer = ({ episode }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [thinkTime, setThinkTime] = useState(5);
  const [sleepTimer, setSleepTimer] = useState(null);
  const intervalRef = useRef(null);

  const sampleEpisode = episode || {
    title: 'Operating Systems: Concurrency & Semaphores',
    subject: 'Computer Science',
    durationSeconds: 320,
    chapters: [
      { title: 'Critical Section Problem', startTime: 10, endTime: 45 },
      { title: 'Mutex Locks vs Semaphores', startTime: 45, endTime: 90 },
      { title: 'Dining Philosophers Solution', startTime: 90, endTime: 150 },
    ],
  };

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentSec((prev) => {
          if (prev >= sampleEpisode.durationSeconds) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [isPlaying, sampleEpisode.durationSeconds]);

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeekChapter = (startTime) => {
    setCurrentSec(startTime);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="bg-gradient-to-br from-indigo-950/50 via-gray-900 to-gray-900 p-6 rounded-3xl border border-indigo-500/20 backdrop-blur-xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
            <Headphones size={24} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{sampleEpisode.title}</h3>
            <p className="text-xs text-gray-400">{sampleEpisode.subject} • Hands-Free Spaced Audio Review</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20 flex items-center gap-1">
            <Sparkles size={14} /> AI Voice Studio
          </span>
        </div>
      </div>

      {/* Waveform Visualization */}
      <AudioWaveformVisualizer isPlaying={isPlaying} />

      {/* Progress & Time */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs font-semibold text-gray-400 font-mono">
          <span>{formatTime(currentSec)}</span>
          <span>{formatTime(sampleEpisode.durationSeconds)}</span>
        </div>
        <div className="w-full bg-gray-800 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-300"
            style={{ width: `${(currentSec / sampleEpisode.durationSeconds) * 100}%` }}
          />
        </div>
      </div>

      {/* Media Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-400 flex items-center gap-1">
            <Clock size={14} /> Think Pause:
          </label>
          <select
            value={thinkTime}
            onChange={(e) => setThinkTime(Number(e.target.value))}
            className="bg-gray-850 border border-gray-700 text-xs text-white rounded-lg px-2 py-1 focus:outline-none"
          >
            <option value={3}>3 seconds</option>
            <option value={5}>5 seconds</option>
            <option value={8}>8 seconds</option>
            <option value={12}>12 seconds</option>
          </select>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentSec((prev) => Math.max(0, prev - 15))}
            className="text-gray-400 hover:text-white transition-colors p-2"
            title="Skip back 15s"
          >
            <SkipBack size={20} />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all"
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
          </button>

          <button
            onClick={() => setCurrentSec((prev) => Math.min(sampleEpisode.durationSeconds, prev + 15))}
            className="text-gray-400 hover:text-white transition-colors p-2"
            title="Skip forward 15s"
          >
            <SkipForward size={20} />
          </button>
        </div>

        <button
          onClick={() => setSleepTimer(sleepTimer ? null : 30)}
          className={`flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl border transition-all ${
            sleepTimer ? 'bg-purple-500/20 text-purple-300 border-purple-500/40' : 'bg-gray-850 text-gray-400 border-gray-700'
          }`}
          title="Sleep Timer"
        >
          <Moon size={14} />
          {sleepTimer ? `${sleepTimer}m timer` : 'Sleep timer'}
        </button>
      </div>

      {/* Chapters */}
      <EpisodeChapterList
        chapters={sampleEpisode.chapters}
        currentSec={currentSec}
        onSelectChapter={handleSeekChapter}
      />
    </div>
  );
};

export default PodcastReviewPlayer;
