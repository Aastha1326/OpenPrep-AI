import React from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

/**
 * MathRenderer: Parses text containing inline ($...$) and block ($$...$$) LaTeX
 * math formulas and renders them using KaTeX with light/dark high-contrast styles.
 */
const MathRenderer = ({ text = '', className = '' }) => {
  if (typeof text !== 'string' || !text) return null;

  // Split by block math first ($$...$$) and then inline math ($...$)
  const parts = text.split(/(\$\$[\s\S]+?\$\$|\$.+?\$)/g);

  return (
    <span className={`math-renderer inline ${className}`}>
      {parts.map((part, idx) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const rawMath = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(rawMath, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={idx}
                className="block my-4 overflow-x-auto text-center font-medium max-w-full text-slate-800 dark:text-slate-100 select-all"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (err) {
            console.error('KaTeX error:', err);
            return (
              <code key={idx} className="block my-2 p-2 bg-slate-100 dark:bg-slate-800 text-red-500 rounded font-mono text-sm">
                {part}
              </code>
            );
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const rawMath = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(rawMath, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={idx}
                className="inline-block px-1 font-medium text-slate-800 dark:text-slate-100 select-all"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (err) {
            console.error('KaTeX error:', err);
            return (
              <code key={idx} className="px-1 py-0.5 bg-slate-100 dark:bg-slate-800 text-red-500 rounded font-mono text-sm">
                {part}
              </code>
            );
          }
        }
        return <span key={idx}>{part}</span>;
      })}
    </span>
  );
};

export default MathRenderer;
