import React, { useState } from 'react';
import { X, Upload, FileText, FileJson, RefreshCw, CheckCircle, AlertCircle, BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import API from '../../services/api';

const EXAMPLE_JSON = `{
  "examName": "University Semester Examinations 2026",
  "examDate": "2026-05-15",
  "description": "B.Tech CSE Third Year - Fifth Semester",
  "subjects": [
    {
      "name": "Machine Learning",
      "description": "ML theory and applications",
      "weightage": 100,
      "topics": ["Introduction", "Linear Regression", "Neural Networks", "SVMs", "Decision Trees", "Clustering"]
    },
    {
      "name": "Database Management Systems",
      "description": "RDBMS + SQL + NoSQL",
      "weightage": 100,
      "topics": ["ER Modelling", "Normalisation", "SQL", "Transactions", "Indexes", "MongoDB Basics"]
    }
  ]
}`;

const SyllabusImportModal = ({ isOpen, onClose, onSuccess, onGoToStudyPlan }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null); // {summary, prefill, importSource, message}
  const [viewingJSON, setViewingJSON] = useState(false);

  if (!isOpen) return null;

  const resetLocal = () => {
    setFile(null);
    setError(null);
    setSuccess(null);
    setViewingJSON(false);
  };

  const handleClose = () => {
    resetLocal();
    onClose?.();
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setError(null);
    setSuccess(null);

    const lowerName = selectedFile.name.toLowerCase();
    const isJSON = lowerName.endsWith('.json') || selectedFile.type === 'application/json';
    const isPDF = lowerName.endsWith('.pdf') || selectedFile.type === 'application/pdf';

    if (!isJSON && !isPDF) {
      setError('Unsupported file type. Please upload either a .pdf or .json syllabus file.');
      return;
    }

    const maxSize = 15 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError('File size exceeds the 15MB limit. Please upload a smaller file.');
      return;
    }

    setFile(selectedFile);
  };

  const handleImport = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const fd = new FormData();
      fd.append('syllabusFile', file);

      const { data } = await API.post('/academic/import-syllabus', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      });

      const summary = data?.summary || {};
      const successData = {
        message: data?.message || 'Syllabus imported successfully.',
        importSource: data?.importSource || 'upload',
        summary: {
          exams: summary.exams || 0,
          subjects: summary.subjects || 0,
          topics: summary.topics || 0,
        },
        prefill: data?.prefill || null,
      };
      setSuccess(successData);
      setFile(null);
      onSuccess?.(successData);
    } catch (err) {
      const details = err?.response?.data;
      const msg = details?.error || err?.message || 'Syllabus import failed. Please try again.';
      const extra = Array.isArray(details?.details)
        ? ' Details: ' + details.details.join(' ')
        : '';
      setError(msg + extra);
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToStudyPlan = () => {
    const payload = success?.prefill;
    if (!payload) return;
    handleClose();
    onGoToStudyPlan?.(payload);
  };

  const fileType =
    file?.name.toLowerCase().endsWith('.json') || file?.type === 'application/json'
      ? 'JSON'
      : file?.name.toLowerCase().endsWith('.pdf') || file?.type === 'application/pdf'
      ? 'PDF'
      : null;

  const FileIcon = fileType === 'JSON' ? FileJson : fileType === 'PDF' ? FileText : Upload;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800 bg-gradient-to-r from-[#FFD8A8] via-[#F6C28B] to-[#E7C27D] dark:from-neutral-800 dark:via-neutral-800 dark:to-neutral-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg bg-[#8B4513]/15 dark:bg-yellow-600/20 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#8B4513] dark:text-yellow-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold font-playfair text-[#3E2723] dark:text-neutral-100">
                Import University Syllabus
              </h3>
              <p className="text-xs text-[#5D4037] dark:text-neutral-400 mt-0.5">
                Upload your curriculum PDF or JSON template and auto-populate exams, subjects, and topics.
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors text-neutral-700 dark:text-neutral-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="p-4 border-2 border-dashed border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg flex items-start gap-3">
                <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">
                    Syllabus imported successfully
                  </h4>
                  <p className="text-sm text-emerald-700/90 dark:text-emerald-200/80 mt-0.5">
                    {success.message}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-3">
                    <div className="bg-white/70 dark:bg-black/30 rounded p-2 text-center">
                      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Exams
                      </div>
                      <div className="text-xl font-bold text-[#8B4513] dark:text-yellow-400">
                        {success.summary.exams}
                      </div>
                    </div>
                    <div className="bg-white/70 dark:bg-black/30 rounded p-2 text-center">
                      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Subjects
                      </div>
                      <div className="text-xl font-bold text-[#8B4513] dark:text-yellow-400">
                        {success.summary.subjects}
                      </div>
                    </div>
                    <div className="bg-white/70 dark:bg-black/30 rounded p-2 text-center">
                      <div className="text-xs uppercase tracking-wide text-neutral-500 dark:text-neutral-400">
                        Topics
                      </div>
                      <div className="text-xl font-bold text-[#8B4513] dark:text-yellow-400">
                        {success.summary.topics}
                      </div>
                    </div>
                  </div>
                  {success.prefill?.subjects?.length > 0 && (
                    <div className="mt-4 max-h-48 overflow-y-auto border border-neutral-200 dark:border-neutral-800 rounded divide-y divide-neutral-200 dark:divide-neutral-800 bg-white dark:bg-neutral-900/60">
                      {success.prefill.subjects.map((s) => (
                        <div key={s.id} className="p-3">
                          <div className="font-semibold text-sm text-[#3E2723] dark:text-neutral-100">
                            {s.name}
                          </div>
                          <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2">
                            Topics: {Array.isArray(s.topics) ? s.topics.join(' • ') : '—'}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 justify-end">
                <button
                  onClick={resetLocal}
                  className="px-5 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
                >
                  Import Another
                </button>
                <button
                  onClick={handleProceedToStudyPlan}
                  disabled={!success.prefill}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded shadow hover:shadow-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4" />
                  Go to Study Plan Generator
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                  Upload Syllabus File
                </label>
                <div className="relative border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded-lg p-8 text-center bg-white dark:bg-neutral-800/40 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.json,application/pdf,application/json"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    disabled={loading}
                  />
                  <Upload className="w-10 h-10 mx-auto text-neutral-400 mb-3" />
                  {file ? (
                    <div className="flex flex-col items-center gap-1">
                      <FileIcon
                        className={`w-6 h-6 ${
                          fileType === 'JSON'
                            ? 'text-blue-600 dark:text-blue-400'
                            : 'text-yellow-700 dark:text-yellow-500'
                        }`}
                      />
                      <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 break-all max-w-md">
                        {file.name}
                      </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {fileType} • click to change
                      </p>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                        Click or drag a file here
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Accepts PDF (curriculum upload parsed with Gemini AI) or JSON (bulk import template). Max 15 MB.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setViewingJSON((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left bg-neutral-50 dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <FileJson className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm font-semibold text-neutral-700 dark:text-neutral-200">
                      JSON Bulk Import Template
                    </span>
                  </div>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {viewingJSON ? 'Hide' : 'Show'} example
                  </span>
                </button>
                {viewingJSON && (
                  <pre className="overflow-x-auto text-xs p-4 bg-neutral-900 dark:bg-black text-green-300 leading-relaxed">
                    {EXAMPLE_JSON}
                  </pre>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="p-6 border-t border-neutral-200 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-900/60">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={loading || !file}
              className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded shadow hover:shadow-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  {fileType === 'PDF' ? 'Parsing with AI...' : 'Validating & Importing...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Import Syllabus
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyllabusImportModal;
