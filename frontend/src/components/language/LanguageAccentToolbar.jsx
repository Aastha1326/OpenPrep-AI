import React from 'react';

const accents = ['á', 'é', 'í', 'ó', 'ú', 'ñ', 'ü', '¿', '¡', 'ç', 'è', 'à'];

const LanguageAccentToolbar = ({ onSelectChar }) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider shrink-0 mr-1">
        Accent Keys:
      </span>
      {accents.map((char) => (
        <button
          key={char}
          type="button"
          onClick={() => onSelectChar(char)}
          className="w-7 h-7 bg-gray-850 hover:bg-gray-750 text-gray-200 font-bold text-xs rounded-lg border border-gray-700/60 transition-colors flex items-center justify-center shrink-0"
        >
          {char}
        </button>
      ))}
    </div>
  );
};

export default LanguageAccentToolbar;
