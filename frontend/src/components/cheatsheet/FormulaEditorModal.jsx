import React, { useState } from 'react';
import { X, Plus, Check, Sparkles } from 'lucide-react';
import MathSymbolPalette from './MathSymbolPalette';

const FormulaEditorModal = ({ isOpen, onClose, onSave }) => {
  const [label, setLabel] = useState('');
  const [latex, setLatex] = useState('');

  if (!isOpen) return null;

  const handleInsertSymbol = (symbolLatex) => {
    setLatex((prev) => `${prev} ${symbolLatex}`.trim());
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!latex.trim()) return;
    onSave({ label: label || 'Formula', latex });
    setLabel('');
    setLatex('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="text-amber-400" size={20} />
          LaTeX Formula Editor
        </h3>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">Formula Label / Name</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Fundamental Theorem of Calculus"
              className="w-full bg-gray-850 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">LaTeX Math Expression</label>
            <textarea
              rows={3}
              value={latex}
              onChange={(e) => setLatex(e.target.value)}
              placeholder="e.g. \int_{a}^{b} f'(x) dx = f(b) - f(a)"
              className="w-full bg-gray-850 border border-gray-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Symbol Palette */}
          <MathSymbolPalette onSelectSymbol={handleInsertSymbol} />

          <button
            type="submit"
            className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs rounded-xl shadow-lg transition-all"
          >
            Insert Formula Block
          </button>
        </form>
      </div>
    </div>
  );
};

export default FormulaEditorModal;
