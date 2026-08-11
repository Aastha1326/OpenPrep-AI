import React, { useState } from 'react';
import { Upload, FileText, Sparkles, Loader2, Check } from 'lucide-react';
import API from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function PdfQuizGeneratorModal({ isOpen, onClose, onQuizCreated }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleFileDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile) => {
    if (selectedFile.type !== 'application/pdf') {
      setError('Please upload a valid PDF file.');
      return;
    }
    if (selectedFile.size > 15 * 1024 * 1024) {
      setError('File size must not exceed 15MB.');
      return;
    }
    setError('');
    setFile(selectedFile);
  };

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('pdf', file);

    try {
      const response = await API.post('/quizzes/generate-from-pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        if (onQuizCreated) onQuizCreated(response.data.quiz);
        onClose();
        // Redirect to quiz player with generated quiz data or ID
        if (response.data.quiz?.id) {
          navigate(`/quiz/${response.data.quiz.id}`);
        }
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate quiz from PDF chapter.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93]/60 dark:border-[#412D15] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl text-[#1F150C] dark:text-[#E1DCC9]">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-playfair flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> AI PDF Chapter Quiz Generator
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white font-bold">✕</button>
        </div>

        <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mb-6">
          Upload a textbook PDF chapter (up to 15MB) to instantly generate a 15-question practice test with explanations.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
            {error}
          </div>
        )}

        {!file ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-[#CEAB93] dark:border-[#412D15] rounded-2xl p-8 text-center cursor-pointer hover:bg-black/5 transition"
          >
            <Upload className="w-10 h-10 mx-auto text-[#8C6A53] dark:text-[#C4BA9D] mb-2" />
            <p className="text-sm font-bold">Drag and drop your chapter PDF here</p>
            <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mt-1">PDF format up to 15MB</p>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => e.target.files[0] && validateAndSetFile(e.target.files[0])}
              className="hidden"
              id="pdf-upload-input"
            />
            <label htmlFor="pdf-upload-input" className="mt-4 inline-block px-4 py-2 rounded-xl btn-primary-theme text-xs font-bold cursor-pointer shadow">
              Browse PDF
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-black/5 dark:bg-white/5 rounded-xl border border-[#CEAB93]/30">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-500" />
                <span className="text-xs font-semibold truncate max-w-xs">{file.name}</span>
              </div>
              <button onClick={() => setFile(null)} className="text-xs text-red-500 hover:underline font-semibold">Change</button>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 rounded-xl btn-primary-theme font-bold text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating 15-Question Practice Test...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate & Launch Quiz
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
