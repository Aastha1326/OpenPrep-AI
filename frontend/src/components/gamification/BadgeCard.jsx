import { Award, Lock } from 'lucide-react';

const BadgeCard = ({ badgeCode = '', title = '', description = '', isUnlocked = false, unlockedAt = null }) => {
  return (
    <div
      className={`border rounded-xl p-4 flex gap-3.5 items-center relative overflow-hidden transition-all duration-300 ${
        isUnlocked
          ? 'bg-neutral-800/90 border-amber-500/30 text-stone-100 shadow-[0_4px_12px_rgba(245,158,11,0.1)] hover:scale-[1.02]'
          : 'bg-neutral-900/60 border-neutral-850 text-stone-500 opacity-60'
      }`}
    >
      <div
        className={`p-3 rounded-full border shrink-0 ${
          isUnlocked
            ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
            : 'bg-neutral-850 border-neutral-800 text-stone-600'
        }`}
      >
        {isUnlocked ? <Award className="w-8 h-8 fill-current animate-pulse" /> : <Lock className="w-8 h-8" />}
      </div>

      <div className="flex-1 min-w-0">
        <h5 className={`font-bold text-sm tracking-tight ${isUnlocked ? 'text-stone-100' : 'text-stone-400'}`}>
          {title || 'Locked Badge'}
        </h5>
        <p className="text-xs text-stone-400 mt-1 leading-relaxed">{description || 'Unlock by completing study goals.'}</p>
        {isUnlocked && unlockedAt && (
          <p className="text-[10px] text-amber-500/70 font-mono mt-1">
            Unlocked: {new Date(unlockedAt).toLocaleDateString()}
          </p>
        )}
      </div>
    </div>
  );
};

export default BadgeCard;
