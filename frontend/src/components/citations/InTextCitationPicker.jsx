import React from 'react';
import { BookMarked } from 'lucide-react';

const InTextCitationPicker = ({ onOpenManager }) => {
  return (
    <button
      onClick={onOpenManager}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 text-xs font-bold transition-all shadow-sm"
      title="Open Citation Manager & Insert Academic Reference"
    >
      <BookMarked size={15} />
      <span>Insert Citation</span>
    </button>
  );
};

export default InTextCitationPicker;
