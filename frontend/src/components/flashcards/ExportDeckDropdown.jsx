import React, { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText, Database, ChevronDown } from 'lucide-react';
import API from '../../services/api';

const ExportDeckDropdown = ({ subjectId = null }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    setIsOpen(false);
    setIsExporting(true);
    try {
      const query = subjectId ? `?subjectId=${subjectId}&format=${format}` : `?format=${format}`;
      const response = await API.get(`/flashcards/export${query}`, {
        responseType: format === 'json' ? 'json' : 'blob',
      });
      
      let blob;
      if (format === 'json') {
        const jsonString = JSON.stringify(response.data, null, 2);
        blob = new Blob([jsonString], { type: 'application/json' });
      } else {
        blob = new Blob([response.data]);
      }
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `flashcards.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (err) {
      console.error('Failed to export flashcards:', err);
      alert('Failed to export flashcards');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        className="inline-flex justify-center items-center w-full rounded-lg border border-gray-300 dark:border-slate-700 shadow-sm px-4 py-2 bg-white dark:bg-slate-800 text-sm font-medium text-gray-700 dark:text-neutral-200 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none transition-colors"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
      >
        <Download className="w-4 h-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export Deck'}
        <ChevronDown className="w-4 h-4 ml-2" />
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-slate-800 ring-1 ring-black ring-opacity-5 dark:ring-slate-700 z-50 overflow-hidden">
          <div className="py-1">
            <button
              onClick={() => handleExport('csv')}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-slate-700"
            >
              <FileText className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
              Plain CSV
            </button>
            <button
              onClick={() => handleExport('json')}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-slate-700"
            >
              <FileJson className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
              Structured JSON
            </button>
            <button
              onClick={() => handleExport('apkg')}
              className="group flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-neutral-200 dark:hover:bg-slate-700"
            >
              <Database className="mr-3 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
              Anki (.apkg)
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportDeckDropdown;
