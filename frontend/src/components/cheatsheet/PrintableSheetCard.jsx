import React from 'react';
import { Plus } from 'lucide-react';

const PrintableSheetCard = ({ section, onAddFormula }) => {
  return (
    <div className="p-4 rounded-2xl bg-gray-850/70 border border-gray-800 space-y-3 print:bg-white print:border-black print:text-black">
      <div className="flex items-center justify-between pb-2 border-b border-gray-800 print:border-gray-300">
        <h4 className="font-extrabold text-sm text-white flex items-center gap-2 print:text-black">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: section.color || '#10B981' }} />
          {section.title}
        </h4>
        <button
          onClick={onAddFormula}
          className="print:hidden p-1 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors"
          title="Add Formula"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="space-y-2">
        {section.items.map((item, idx) => (
          <div
            key={idx}
            className="p-2.5 rounded-xl bg-gray-900/90 border border-gray-800/80 space-y-1 print:bg-gray-50 print:border-gray-200"
          >
            <div className="text-[11px] font-bold text-gray-400 print:text-gray-600">{item.label}</div>
            <div className="text-xs font-mono text-amber-200 print:text-black overflow-x-auto select-all">
              {item.latex}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PrintableSheetCard;
