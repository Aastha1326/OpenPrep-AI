import React from 'react';

export default function CollaboratorAvatars({ collaborators = [] }) {
  if (collaborators.length === 0) return null;

  return (
    <div className="flex items-center space-x-2 bg-neutral-900/60 border border-neutral-850 px-3 py-1.5 rounded-2xl">
      <div className="flex -space-x-1.5 overflow-hidden">
        {collaborators.map((user, idx) => {
          const initials = user.username ? user.username.slice(0, 2).toUpperCase() : 'U';
          const borderCol = user.color || '#6366f1';

          return (
            <div
              key={user.userId || idx}
              style={{ borderColor: borderCol }}
              className="inline-block h-6 w-6 rounded-full border-2 bg-neutral-800 flex items-center justify-center text-[10px] font-black text-stone-200"
              title={`${user.username} is editing`}
            >
              {initials}
            </div>
          );
        })}
      </div>
      <span className="text-[10px] font-bold text-stone-400">
        {collaborators.length} editing
      </span>
    </div>
  );
}
