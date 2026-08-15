import React from 'react';

export default function SquadLeaderboard({ members, contributions, targetXp }) {
  // Combine members and their contributions
  const leaderboardData = members.map(member => {
    const contribution = contributions.find(c => c.userId === member.userId);
    const xp = contribution ? contribution.contributedXp : 0;
    return { ...member, xp };
  }).sort((a, b) => b.xp - a.xp);

  return (
    <div className="bg-slate-800 rounded-lg p-6 shadow-md border border-slate-700 mt-6">
      <h3 className="text-xl font-semibold mb-4 text-slate-100">Squad Leaderboard</h3>
      <div className="space-y-4">
        {leaderboardData.map((member, index) => (
          <div key={member.userId} className="flex items-center justify-between p-3 bg-slate-700 rounded-lg">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 font-bold w-6">{index + 1}.</span>
              <img 
                src={member.userRef?.avatar || '/default-avatar.png'} 
                alt={member.userRef?.name} 
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="text-slate-100 font-medium">
                  {member.userRef?.name} {member.role === 'admin' && <span className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full ml-2">Admin</span>}
                </p>
                <div className="w-full bg-slate-600 rounded-full h-1.5 mt-2 overflow-hidden w-48">
                  <div 
                    className="bg-indigo-500 h-1.5 rounded-full" 
                    style={{ width: `${Math.min(100, (member.xp / targetXp) * 100)}%` }}
                    role="progressbar"
                    aria-valuenow={member.xp}
                    aria-valuemin={0}
                    aria-valuemax={targetXp}
                  ></div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-indigo-400 font-bold">{member.xp}</span>
              <span className="text-slate-400 text-sm ml-1">XP</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
