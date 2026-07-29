import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, AlertCircle, FileText, RefreshCw, CheckCircle } from 'lucide-react';
import API from '../../services/api';

const PyqAnalysisModal = ({ isOpen, onClose, onAnalysisComplete }) => {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());
  const [subjectId, setSubjectId] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const [successData, setSuccessData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const fetchSubjects = async () => {
        try {
          const res = await API.get('/academic/subjects');
          if (res.data?.data) {
            setSubjects(res.data.data);
            if (res.data.data.length > 0) {
              setSubjectId(res.data.data[0].id);
            }
          }
        } catch (err) {
          console.error('Failed to load subjects:', err);
        }
      };
      fetchSubjects();
      setError(null);
      setIsTimeout(false);
      setSuccessData(null);
    }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setError('Please upload a valid PDF document.');
      return;
    }

    // 10MB client-side size check
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds 10MB limit. Please upload a smaller PDF paper.');
      return;
    }

    setError(null);
    setIsTimeout(false);
    setFile(selectedFile);
    if (!title) {
      setTitle(selectedFile.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();

    if (!file) {
      setError('Please select a PYQ PDF file to analyze.');
      return;
    }
    if (!subjectId) {
      setError('Please select a subject.');
      return;
    }

    setLoading(true);
    setError(null);
    setIsTimeout(false);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title || file.name);
      formData.append('year', year);
      formData.append('subjectId', subjectId);

      const res = await API.post('/pyqs/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 45000,
      });

      setSuccessData(res.data?.data);
      if (onAnalysisComplete) {
        onAnalysisComplete(res.data?.data);
      }
    } catch (err) {
      console.error('PYQ upload error:', err);
      const isTimeoutErr =
        err.code === 'ECONNABORTED' ||
        err.response?.status === 408 ||
        err.response?.status === 504 ||
        err.response?.data?.error?.toLowerCase().includes('timed out');

      if (isTimeoutErr) {
        setIsTimeout(true);
        setError('PYQ analysis timed out. The PDF may be too large or complex. Please try a smaller paper or click Retry.');
      } else {
        setError(err.response?.data?.error || 'Failed to analyze PYQ paper. Please check file format and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-[#fdfaf3] dark:bg-neutral-900 w-full max-w-xl rounded-sm shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col max-h-[90vh] border border-neutral-300 dark:border-neutral-700"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-neutral-300 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <FileText className="w-6 h-6 text-yellow-700 dark:text-yellow-500" />
                <h2 className="text-2xl font-playfair font-bold text-neutral-800 dark:text-neutral-100">
                  Analyze PYQ Paper
                </h2>
              </div>
              <button
                onClick={onClose}
                className="text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors"
                disabled={loading}
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              {error && (
                <div className={`p-4 rounded border flex flex-col gap-2 ${
                  isTimeout
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200'
                    : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300'
                }`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                  {isTimeout && (
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      disabled={loading}
                      className="self-end mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded text-xs font-semibold uppercase tracking-wider transition-all shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                      Retry Analysis
                    </button>
                  )}
                </div>
              )}

              {successData ? (
                <div className="p-6 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded text-center space-y-3">
                  <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400 mx-auto" />
                  <h3 className="text-xl font-bold font-playfair text-green-900 dark:text-green-200">
                    Analysis Completed Successfully!
                  </h3>
                  <p className="text-sm text-green-800 dark:text-green-300">
                    Important topics, repeated questions, and exam trend weightages have been added to your dashboard.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleAnalyze} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Select Subject
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                      disabled={loading}
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
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Paper Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Midterm 2025 Paper"
                        className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                        disabled={loading}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                        Exam Year
                      </label>
                      <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      Upload PDF Question Paper
                    </label>
                    <div className="border-2 border-dashed border-neutral-300 dark:border-neutral-700 rounded p-6 text-center bg-white dark:bg-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors cursor-pointer relative">
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        disabled={loading}
                      />
                      <Upload className="w-8 h-8 mx-auto text-neutral-400 mb-2" />
                      {file ? (
                        <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">
                          Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                        </p>
                      ) : (
                        <div>
                          <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                            Click or drag PDF question paper here
                          </p>
                          <p className="text-xs text-neutral-400 mt-1">Maximum file size: 10MB</p>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-neutral-300 dark:border-neutral-800 flex justify-end gap-3 bg-neutral-50 dark:bg-neutral-900">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
                disabled={loading}
              >
                {successData ? 'Close' : 'Cancel'}
              </button>
              {!successData && (
                <button
                  onClick={handleAnalyze}
                  disabled={loading || !file}
                  className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded shadow hover:shadow-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Analyzing with AI...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Analyze PYQ
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PyqAnalysisModal;
