import React from 'react';
import { BookmarkCheck, Play } from 'lucide-react';

const EpisodeChapterList = ({ chapters = [], currentSec = 0, onSelectChapter }) => {
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Episode Flashcard Chapters</h4>
      <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
        {chapters.map((ch, idx) => {
          const isActive = currentSec >= ch.startTime && currentSec < ch.endTime;

          return (
            <button
              key={idx}
              onClick={() => onSelectChapter(ch.startTime)}
              className={`w-full p-2.5 rounded-xl border text-left text-xs flex items-center justify-between transition-all ${
                isActive
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-white font-bold'
                  : 'bg-gray-850/50 border-gray-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isActive ? <Play size={12} className="text-indigo-400 fill-indigo-400" /> : <BookmarkCheck size={14} />}
                <span>{ch.title}</span>
              </div>
              <span className="font-mono text-[11px] text-gray-500">{formatTime(ch.startTime)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default EpisodeChapterList;
