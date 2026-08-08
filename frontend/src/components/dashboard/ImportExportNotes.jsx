import { useState, useEffect, useRef } from 'react';
import { Download, Upload, Loader, AlertCircle, X } from 'lucide-react';
import API from '../../services/api';

const downloadBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

const ImportExportNotes = ({ onImported }) => {
  const [exporting, setExporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [files, setFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!showImport) return;
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        const list = res?.data?.data || [];
        setSubjects(list);
        if (list.length > 0) setSubjectId(list[0].id);
      } catch (err) {
        console.error('Failed to load subjects:', err);
      }
    };
    fetchSubjects();
  }, [showImport]);

  const handleExport = async (format) => {
    setExporting(true);
    setError(null);
    try {
      const res = await API.get('/notes/export', {
        params: { format },
        responseType: 'blob',
      });
      downloadBlob(res.data, format === 'zip' ? 'openprep-notes.zip' : 'openprep-notes.json');
    } catch (err) {
      setError('Failed to export notes.');
    } finally {
      setExporting(false);
    }
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []).filter(
      (f) => f.name.endsWith('.md') || f.name.endsWith('.markdown')
    );
    setFiles(selected);
  };

  const handleImport = async () => {
    if (files.length === 0) {
      setError('Please choose at least one .md file');
      return;
    }
    if (!subjectId) {
      setError('Please select a subject');
      return;
    }

    setImporting(true);
    setError(null);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('subjectId', subjectId);

      await API.post('/notes/import', formData, {
        headers: { 'Content-Type': undefined },
      });

      setFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setShowImport(false);
      if (onImported) onImported();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to import notes.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        disabled={exporting}
        onClick={() => handleExport('zip')}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white text-xs font-bold rounded-sm shadow-sm transition-all disabled:opacity-60"
      >
        {exporting ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        Export
      </button>
      <button
        type="button"
        onClick={() => setShowImport(true)}
        className="flex items-center gap-1 px-2.5 py-1.5 bg-neutral-700 hover:bg-neutral-800 text-white text-xs font-bold rounded-sm shadow-sm transition-all"
      >
        <Upload className="w-3.5 h-3.5" /> Import
      </button>

      {showImport && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#fdfaf3] w-full max-w-md rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.3)] p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-playfair font-bold text-neutral-800">Import Markdown Notes</h3>
              <button type="button" onClick={() => setShowImport(false)} className="text-neutral-500 hover:text-neutral-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full mb-3 p-2 border border-neutral-300 rounded text-sm"
            >
              {subjects.length === 0 ? (
                <option value="">No subjects found</option>
              ) : (
                subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))
              )}
            </select>

            <label className="block text-xs font-bold uppercase text-neutral-600 mb-1">Markdown files (.md)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown"
              multiple
              onChange={handleFileChange}
              className="w-full mb-3 text-sm"
            />

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-red-600 mb-3">
                <AlertCircle className="w-3.5 h-3.5" /> {error}
              </div>
            )}

            <button
              type="button"
              disabled={importing}
              onClick={handleImport}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold rounded-sm shadow-sm transition-all disabled:opacity-60"
            >
              {importing ? <Loader className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importing…' : 'Import Notes'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportExportNotes;