import React, { useCallback, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import MathRenderer from './MathRenderer';
import MathToolbar from './MathToolbar';

/**
 * MathMarkdownEditor: A reusable Markdown + KaTeX live editor with a
 * "Write" / "Preview" tabbed view and a quick-insert math toolbar.
 *
 * - Toolbar buttons insert LaTeX snippets at the current cursor position.
 * - Preview renders inline/block math and mhchem chemical formulas via
 *   MathRenderer (remark-math + rehype-katex + DOMPurify).
 * - Malformed LaTeX renders a graceful inline error indicator in preview.
 */
const MathMarkdownEditor = ({
  value = '',
  onChange,
  placeholder = 'Type Markdown or LaTeX math here...',
  label = '',
  id,
  rows = 4,
  className = '',
  ariaLabel,
}) => {
  const [mode, setMode] = useState('write'); // 'write' | 'preview'
  const textareaRef = useRef(null);

  const handleInsert = useCallback(
    (snippet) => {
      const el = textareaRef.current;
      if (!el) return;
      const start = el.selectionStart ?? value.length;
      const end = el.selectionEnd ?? value.length;
      const next = value.slice(0, start) + snippet + value.slice(end);
      onChange?.(next);
      // Restore focus and place the caret after the inserted snippet.
      requestAnimationFrame(() => {
        el.focus();
        const caret = start + snippet.length;
        el.setSelectionRange(caret, caret);
      });
    },
    [value, onChange]
  );

  const handleChange = useCallback(
    (e) => onChange?.(e.target.value),
    [onChange]
  );

  return (
    <div
      className={`rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden ${className}`}
    >
      {label && (
        <label
          htmlFor={id}
          className="block px-3 pt-2.5 pb-1 text-sm font-semibold text-neutral-700 dark:text-neutral-300"
        >
          {label}
        </label>
      )}

      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
        <div
          role="tablist"
          aria-label="Editor mode"
          className="flex items-center gap-1 px-2 py-1.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'write'}
            onClick={() => setMode('write')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
              mode === 'write'
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Write
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'preview'}
            onClick={() => setMode('preview')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition cursor-pointer ${
              mode === 'preview'
                ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300'
                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            Preview
          </button>
        </div>
      </div>

      {mode === 'write' ? (
        <>
          <MathToolbar onInsert={handleInsert} />
          <textarea
            ref={textareaRef}
            id={id}
            value={value}
            onChange={handleChange}
            placeholder={placeholder}
            rows={rows}
            aria-label={ariaLabel || label || 'Math Markdown editor'}
            className="w-full px-3 py-2 text-sm text-neutral-900 dark:text-neutral-100 bg-transparent resize-y focus:outline-none font-mono leading-relaxed"
          />
        </>
      ) : (
        <div className="px-3 py-2.5 min-h-[96px] text-sm text-neutral-800 dark:text-neutral-100 overflow-x-auto">
          {value.trim() ? (
            <MathRenderer text={value} />
          ) : (
            <span className="text-slate-400 dark:text-slate-500 italic">
              Nothing to preview yet.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

MathMarkdownEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
  label: PropTypes.string,
  id: PropTypes.string,
  rows: PropTypes.number,
  className: PropTypes.string,
  ariaLabel: PropTypes.string,
};

export default MathMarkdownEditor;