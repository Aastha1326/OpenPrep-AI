import { Trophy } from 'lucide-react';

const BadgesList = ({ achievements = [] }) => {
  if (!achievements.length) {
    return (
      <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-200">
        <h3 className="text-lg font-bold font-playfair text-stone-900 mb-4 flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-600" />
          Achievements
        </h3>
        <p className="text-stone-500 text-sm">No badges earned yet. Keep learning!</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-sm shadow-sm border border-stone-200">
      <h3 className="text-lg font-bold font-playfair text-stone-900 mb-4 flex items-center gap-2">
        <Trophy className="w-5 h-5 text-amber-600" />
        Achievements
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {achievements.map((ach) => (
          <div key={ach.id} className="p-4 border border-amber-200 bg-amber-50 rounded-sm text-center">
            <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h4 className="font-semibold text-stone-800 text-sm">{ach.badgeName}</h4>
            <p className="text-xs text-stone-600 mt-1">{ach.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgesList;
