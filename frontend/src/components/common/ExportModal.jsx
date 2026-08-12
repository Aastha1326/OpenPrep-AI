import { useState } from 'react';
import {
  X,
  FileText,
  BookOpen,
  LayoutGrid,
  List,
  Columns2,
  Download,
  Loader2,
} from 'lucide-react';
import { LAYOUTS } from '../../utils/exportDocs';

const LAYOUT_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: LayoutGrid, description: '2×4 cards per page' },
  { value: 'list', label: 'List', icon: List, description: 'One card per row' },
  { value: 'compact', label: 'Compact', icon: Columns2, description: 'Two-column cheat sheet' },
];

const FORMAT_OPTIONS = [
  { value: 'pdf', label: 'PDF', icon: FileText, description: 'Printable, KaTeX math' },
  { value: 'epub', label: 'EPUB', icon: BookOpen, description: 'For tablets & e-readers' },
];

export default function ExportModal({
  isOpen,
  onClose,
  contentType = 'flashcards',
  title = 'Export',
  itemCount = 0,
  onExport,
}) {
  const [format, setFormat] = useState('pdf');
  const [layout, setLayout] = useState('grid');
  const [includeAnswerKey, setIncludeAnswerKey] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleExport = async () => {
    if (!onExport || exporting) return;
    setExporting(true);
    setError(null);
    try {
      await onExport({ format, layout, includeAnswerKey });
      onClose();
    } catch (err) {
      setError(err?.message || 'Export failed. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-xl shadow-2xl border border-neutral-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <Download className="w-5 h-5 text-primary-500" />
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-100 transition-colors"
            aria-label="Close export modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-5">
          {itemCount > 0 ? `${itemCount} item${itemCount === 1 ? '' : 's'} ready to export.` : 'Choose your export settings.'}
        </p>

        {/* Format */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
            Format
          </label>
          <div className="grid grid-cols-2 gap-2">
            {FORMAT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = format === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormat(opt.value)}
                  className={`flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    active
                      ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500'
                      : 'border-neutral-200 dark:border-slate-600 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {opt.label}
                  <span className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Layout */}
        <div className="mb-5">
          <label className="block text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-2">
            Layout
          </label>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = layout === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setLayout(opt.value)}
                  className={`flex flex-col items-center gap-1 px-2 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                    active
                      ? 'bg-primary-50 border-primary-500 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 dark:border-primary-500'
                      : 'border-neutral-200 dark:border-slate-600 text-neutral-600 dark:text-neutral-300 hover:border-neutral-300 dark:hover:border-slate-500'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {opt.label}
                  <span className="text-[10px] font-normal text-neutral-400 dark:text-neutral-500 text-center">
                    {opt.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Answer key (flashcards only) */}
        {contentType === 'flashcards' && (
          <label className="flex items-center gap-2.5 mb-5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeAnswerKey}
              onChange={(e) => setIncludeAnswerKey(e.target.checked)}
              className="w-4 h-4 accent-primary-500"
            />
            <span className="text-sm text-neutral-700 dark:text-neutral-200">
              Include answer key at the bottom
            </span>
          </label>
        )}

        {error && (
          <div className="mb-4 px-3 py-2 rounded bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={exporting}
            className="px-4 py-2 text-sm font-semibold text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-slate-600 rounded-lg hover:bg-neutral-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || itemCount === 0}
            className="px-4 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg flex items-center gap-2 transition-colors"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Export {format.toUpperCase()}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
