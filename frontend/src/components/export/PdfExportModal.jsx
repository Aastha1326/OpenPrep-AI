import React, { useState } from 'react';

export default function PdfExportModal({ quizId, onClose }) {
  const [config, setConfig] = useState({
    twoColumn: false,
    fontSize: 10,
    includeAnswerKey: true,
    watermarkText: 'OpenPrep AI Core',
    qrPlacement: 'footer_right'
  });
  const [isExporting, setIsExporting] = useState(false);

  const handleExportSubmit = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/export/exam-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId, ...config })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.setAttribute('download', `Exam_Sheet_Optimization_${quizId}.pdf`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err) {
      console.error('Failed processing server PDF compiler actions:', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-export-title"
        className="bg-slate-900 border border-slate-800 text-white rounded-xl max-w-md w-full shadow-2xl overflow-hidden font-sans"
      >
        <header className="p-4 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
          <h3 id="modal-export-title" className="text-sm font-bold text-slate-100">
            🖨️ Print Layout & Digital Rights Optimizer
          </h3>
          <button onClick={onClose} aria-label="Dismiss Modal" className="text-slate-400 hover:text-white">✕</button>
        </header>

        <div className="p-5 space-y-4 text-xs">
          {/* Column Layout Controls */}
          <div className="flex justify-between items-center">
            <label htmlFor="layoutSelect" className="font-semibold text-slate-300">Layout Sheet Density</label>
            <select
              id="layoutSelect"
              value={config.twoColumn ? '2col' : '1col'}
              onChange={(e) => setConfig(prev => ({ ...prev, twoColumn: e.target.value === '2col' }))}
              className="bg-slate-800 border border-slate-700 p-1.5 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="1col">Standard 1-Column Layout</option>
              <option value="2col">Compact 2-Column Sheet</option>
            </select>
          </div>

          {/* Font Configuration */}
          <div className="flex justify-between items-center">
            <label htmlFor="fontSelect" className="font-semibold text-slate-300">Target Typography Size</label>
            <select
              id="fontSelect"
              value={config.fontSize}
              onChange={(e) => setConfig(prev => ({ ...prev, fontSize: Number(e.target.value) }))}
              className="bg-slate-800 border border-slate-700 p-1.5 rounded focus:outline-none focus:border-blue-500"
            >
              <option value="9">9pt (Ultra Compact)</option>
              <option value="10">10pt (Standard Academic)</option>
              <option value="12">12pt (High Readability)</option>
            </select>
          </div>

          {/* Answer Key Toggle */}
          <div className="flex justify-between items-center">
            <label htmlFor="answerToggle" className="font-semibold text-slate-300">Append Correct Answer Key</label>
            <input
              type="checkbox"
              id="answerToggle"
              checked={config.includeAnswerKey}
              onChange={(e) => setConfig(prev => ({ ...prev, includeAnswerKey: e.target.checked }))}
              className="w-4 h-4 accent-blue-500 cursor-pointer"
            />
          </div>

          {/* Custom Watermark String */}
          <div className="space-y-1.5">
            <label htmlFor="watermarkInput" className="font-semibold text-slate-300 block">Security Protection Tag</label>
            <input
              type="text"
              id="watermarkInput"
              value={config.watermarkText}
              onChange={(e) => setConfig(prev => ({ ...prev, watermarkText: e.target.value }))}
              placeholder="e.g. Property of OpenPrep Academy"
              className="w-full bg-slate-800 border border-slate-700 p-2 rounded focus:outline-none focus:border-blue-500 text-slate-200 placeholder-slate-500"
            />
          </div>
        </div>

        <footer className="p-4 bg-slate-800 border-t border-slate-700 flex justify-end gap-3 font-semibold">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded text-xs text-slate-300 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleExportSubmit}
            disabled={isExporting}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded text-xs transition-colors shadow-lg"
          >
            {isExporting ? 'Compiling PDF Curves...' : 'Compile Secure PDF'}
          </button>
        </footer>
      </div>
    </div>
  );
}
