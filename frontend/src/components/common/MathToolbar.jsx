import React from 'react';
import PropTypes from 'prop-types';

/**
 * Quick-insert toolbar buttons for common math symbols and LaTeX snippets.
 * Each button calls `onInsert(snippet)` so the parent editor can place the
 * snippet at the current cursor position.
 */
const TOOLBAR_ITEMS = [
  { label: '∫', title: 'Integral', snippet: '\\int_{a}^{b}' },
  { label: '∑', title: 'Summation', snippet: '\\sum_{i=1}^{n}' },
  { label: 'α', title: 'Alpha', snippet: '\\alpha' },
  { label: 'β', title: 'Beta', snippet: '\\beta' },
  { label: '√', title: 'Square root', snippet: '\\sqrt{x}' },
  { label: 'frac', title: 'Fraction', snippet: '\\frac{a}{b}' },
  { label: '^', title: 'Superscript', snippet: '^{}' },
  { label: '_', title: 'Subscript', snippet: '_{}' },
  { label: '×', title: 'Times', snippet: '\\times' },
  { label: '∞', title: 'Infinity', snippet: '\\infty' },
  { label: 'π', title: 'Pi', snippet: '\\pi' },
  { label: 'θ', title: 'Theta', snippet: '\\theta' },
  { label: 'H₂O', title: 'Chemical formula (mhchem)', snippet: '\\ce{H2O}' },
];

const MathToolbar = ({ onInsert, className = '' }) => {
  return (
    <div
      role="toolbar"
      aria-label="Math symbols toolbar"
      className={`flex flex-wrap items-center gap-1 px-2 py-1.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 ${className}`}
    >
      {TOOLBAR_ITEMS.map((item) => (
        <button
          key={item.snippet}
          type="button"
          title={item.title}
          aria-label={`Insert ${item.title}`}
          onClick={() => onInsert?.(item.snippet)}
          className="min-w-[28px] h-7 px-1.5 rounded-md text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 dark:hover:bg-slate-600 dark:hover:text-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-500 transition cursor-pointer"
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

MathToolbar.propTypes = {
  onInsert: PropTypes.func.isRequired,
  className: PropTypes.string,
};

export default MathToolbar;