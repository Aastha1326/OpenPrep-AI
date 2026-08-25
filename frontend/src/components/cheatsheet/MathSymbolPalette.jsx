import React from 'react';

const symbols = [
  { label: '∫', latex: '\\int' },
  { label: '∑', latex: '\\sum_{i=1}^{n}' },
  { label: 'lim', latex: '\\lim_{x \\to 0}' },
  { label: '√x', latex: '\\sqrt{x}' },
  { label: 'a/b', latex: '\\frac{a}{b}' },
  { label: '∂', latex: '\\partial' },
  { label: 'α', latex: '\\alpha' },
  { label: 'β', latex: '\\beta' },
  { label: 'θ', latex: '\\theta' },
  { label: 'λ', latex: '\\lambda' },
  { label: 'π', latex: '\\pi' },
  { label: '∞', latex: '\\infty' },
  { label: '≠', latex: '\\neq' },
  { label: '≤', latex: '\\leq' },
  { label: '≥', latex: '\\geq' },
  { label: '±', latex: '\\pm' },
];

const MathSymbolPalette = ({ onSelectSymbol }) => {
  return (
    <div className="space-y-1.5">
      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quick Math Palette</span>
      <div className="flex flex-wrap gap-1.5 bg-gray-850/80 p-2 rounded-xl border border-gray-800">
        {symbols.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => onSelectSymbol(s.latex)}
            className="px-2.5 py-1 bg-gray-800 hover:bg-gray-700 text-gray-200 font-mono text-xs rounded-lg border border-gray-700/60 transition-colors"
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default MathSymbolPalette;
