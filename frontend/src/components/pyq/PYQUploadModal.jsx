import React, { useState, useEffect } from 'react';
import API from '../../services/api';
import { FaTimes, FaCloudUploadAlt, FaFilePdf, FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import useFocusTrap from '../../hooks/useFocusTrap';

const PYQUploadModal = ({ isOpen, onClose, onUploadSuccess }) => {
  const containerRef = useFocusTrap(isOpen, onClose);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [examName, setExamName] = useState('');
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [error, setError] = useState('');

  // Fetch subjects on mount
  useEffect(() => {
    if (!isOpen) return;
    const fetchSubjects = async () => {
      try {
        const res = await API.get('/academic/subjects');
        if (res.data?.success) {
          setSubjects(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedSubjectId(res.data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load subjects for upload:', err);
      }
    };
    fetchSubjects();
  }, [isOpen]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Limit to 10 files max
    if (files.length + selectedFiles.length > 10) {
      setError('You can upload a maximum of 10 exam paper files.');
      return;
    }

    const validFiles = selectedFiles.filter((file) => {
      const isPdf = file.type === 'application/pdf';
      const isImage = file.type.startsWith('image/');
      return isPdf || isImage;
    });

    if (validFiles.length !== selectedFiles.length) {
      setError('Only PDF or image documents are allowed.');
    } else {
      setError('');
    }

    setFiles((prev) => [...prev, ...validFiles]);
  };

  const handleRemoveFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSubjectId) {
      setError('Please select a subject.');
      return;
    }
    if (files.length === 0) {
      setError('Please choose at least one past exam paper.');
      return;
    }

    setUploading(true);
    setError('');
    setProgressText('Preparing payload...');

    const formData = new FormData();
    formData.append('subjectId', selectedSubjectId);
    formData.append('examName', examName || 'Board Assessment');
    files.forEach((file) => {
      formData.append('files', file);
    });

    try {
      // Direct post to analyze route
      setProgressText('Uploading exam papers to analysis engine...');
      const res = await API.post('/pyqs/analyze', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data?.success) {
        setProgressText('Analysis complete!');
        if (onUploadSuccess) {
          onUploadSuccess(res.data.data);
        }
        setFiles([]);
        setExamName('');
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Analysis failed. Make sure PDF text is readable.');
    } finally {
      setUploading(false);
      setProgressText('');
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
        <motion.div
          ref={containerRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pyq-upload-modal-title"
          className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative overflow-hidden text-left"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 transition-colors"
          >
            <FaTimes className="text-lg" />
          </button>

          <h2 id="pyq-upload-modal-title" className="text-xl font-bold font-playfair text-stone-100 mb-2">Analyze PYQ Batch</h2>
          <p className="text-stone-400 text-xs mb-6">Upload up to 10 past exam papers to extract chapter trends and concepts.</p>

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Subject</label>
              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
              >
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider mb-2">Exam Category Name (Optional)</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="CBSE Boards / UPSC CSE / IIT JEE"
                className="w-full bg-stone-950 border border-neutral-800 rounded-xl px-4 py-3 text-stone-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              />
            </div>

            {/* Drop Zone */}
            <div className="border-2 border-dashed border-neutral-800 hover:border-indigo-500/50 rounded-2xl p-6 transition-colors flex flex-col items-center justify-center bg-stone-950/40 relative cursor-pointer group">
              <input
                type="file"
                multiple
                accept="application/pdf, image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <FaCloudUploadAlt className="text-3xl text-stone-500 group-hover:text-indigo-400 transition-colors mb-2" />
              <p className="text-xs font-semibold text-stone-300">Drag & Drop files or click to browse</p>
              <p className="text-[10px] text-stone-500 mt-1">Accepts PDF or images (Max 10 files, up to 25MB total)</p>
            </div>

            {/* Uploaded File List */}
            {files.length > 0 && (
              <div className="bg-stone-950/70 border border-neutral-850 rounded-xl p-3 max-h-36 overflow-y-auto space-y-1.5 scrollbar-hide">
                {files.map((file, index) => (
                  <div key={index} className="flex justify-between items-center p-2 bg-neutral-900 border border-neutral-800/80 rounded-lg text-[10px] font-semibold text-stone-300">
                    <span className="flex items-center gap-2 truncate max-w-[80%]">
                      <FaFilePdf className="text-rose-500" />
                      <span className="truncate">{file.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-stone-500 hover:text-rose-400 transition-colors"
                      disabled={uploading}
                    >
                      <FaTimes />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-500/10 text-xs text-rose-400">
                <FaExclamationCircle className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {uploading && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] text-indigo-400 font-bold uppercase tracking-wider">
                  <span>{progressText}</span>
                  <span className="animate-pulse">Parsing...</span>
                </div>
                <div className="w-full bg-stone-950 rounded-full h-1.5 overflow-hidden">
                  <div className="bg-indigo-500 h-full rounded-full animate-progress-bar" style={{ width: '60%' }} />
                </div>
              </div>
            )}

            <div className="pt-2 flex gap-3">
              <button
                type="submit"
                disabled={uploading || files.length === 0}
                className="flex-1 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                {uploading ? 'Analyzing Papers...' : 'Launch Batch Analysis'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={uploading}
                className="px-6 bg-neutral-850 hover:bg-neutral-800 text-stone-300 font-bold rounded-xl text-xs transition-all border border-neutral-750"
              >
                Cancel
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default PYQUploadModal;
