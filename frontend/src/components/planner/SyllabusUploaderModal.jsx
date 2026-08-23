import React, { useState } from 'react';
import { FaTimes, FaFilePdf, FaCloudUploadAlt, FaExclamationCircle } from 'react-icons/fa';
import { Loader2 } from 'lucide-react';
import API from '../../services/api';

export default function SyllabusUploaderModal({ isOpen, onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;
  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please select a valid syllabus PDF file.');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a syllabus PDF file to upload.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('syllabus', file);

    try {
      const res = await API.post('/syllabus/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (res.data?.success) {
        onImported(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.error || 'Failed to parse syllabus. Make sure the file size is under 5MB.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="uploader-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <div className="bg-neutral-900 border border-neutral-850 rounded-3xl w-full max-w-md shadow-2xl p-6 relative overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-neutral-850 pb-4 mb-4">
          <h2 id="uploader-title" className="text-stone-100 font-extrabold font-playfair text-lg">
            Import Syllabus PDF
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 bg-neutral-800 hover:bg-neutral-750 text-stone-300 hover:text-stone-100 rounded-full transition cursor-pointer"
            aria-label="Close syllabus uploader"
          >
            <FaTimes className="text-sm" />
          </button>
        </div>

        <form onSubmit={handleUpload} className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-500/30 bg-rose-50/5 text-xs text-rose-400 font-semibold">
              <FaExclamationCircle className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Drag & Drop area */}
          <div className="border-2 border-dashed border-neutral-800 hover:border-indigo-500/55 rounded-2xl p-6 transition text-center relative bg-stone-950/20">
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
              aria-label="Choose syllabus PDF file"
            />
            <div className="space-y-2 pointer-events-none">
              <FaCloudUploadAlt className="mx-auto text-4xl text-neutral-600" />
              <div className="text-xs font-semibold text-stone-300">
                {file ? (
                  <span className="text-indigo-400 font-bold flex items-center justify-center gap-1">
                    <FaFilePdf /> {file.name}
                  </span>
                ) : (
                  'Drag and drop official syllabus PDF here, or click to browse'
                )}
              </div>
              <p className="text-[10px] text-stone-500">Maximum file size: 5 MB</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-neutral-850 hover:bg-neutral-800 text-stone-300 rounded-xl text-xs font-bold transition border border-neutral-750 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !file}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition shadow-lg hover:shadow-indigo-500/10 cursor-pointer flex items-center gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Stitching modules...
                </>
              ) : (
                'Import & Parse'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
