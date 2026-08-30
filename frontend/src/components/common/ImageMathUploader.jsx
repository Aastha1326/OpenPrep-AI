import React, { useState } from 'react';
import { Upload, Camera, FileText, Loader, AlertCircle } from 'lucide-react';
import api from '../../services/api';

const ImageMathUploader = ({ onSolutionReceived }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(selectedFile.type)) {
      setError('Please upload a valid JPEG, PNG, or WebP image.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size exceeds 5MB limit.');
      return;
    }

    setError('');
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('image', file);
      if (prompt) formData.append('prompt', prompt);

      const response = await api.post('/ai/solve-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data && response.data.success) {
        onSolutionReceived(response.data.data.solutionMarkdown);
      }
    } catch (err) {
      console.error('Error solving image question:', err);
      setError(err.response?.data?.error || 'Failed to solve image problem.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-4">
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
        <Camera className="w-5 h-5 text-indigo-400" />
        <h3 className="text-stone-100 font-extrabold text-base font-playfair">OCR Math & Diagram Solver</h3>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="border-2 border-dashed border-neutral-700 hover:border-indigo-500/50 rounded-2xl p-4 text-center cursor-pointer transition-all bg-stone-950/40">
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="math-image-input"
          />
          <label htmlFor="math-image-input" className="cursor-pointer flex flex-col items-center gap-2">
            {preview ? (
              <img src={preview} alt="Selected equation or diagram preview" className="max-h-48 rounded-lg object-contain shadow-md" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-stone-400 mb-1" />
                <span className="text-xs font-semibold text-stone-200">Click to upload camera photo or screenshot</span>
                <span className="text-[10px] text-stone-500">PNG, JPEG, WebP up to 5MB</span>
              </>
            )}
          </label>
        </div>

        <input
          type="text"
          placeholder="Optional notes or specific questions about this diagram..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full bg-neutral-800 text-stone-200 text-xs px-3 py-2.5 rounded-xl border border-neutral-700 focus:outline-none focus:border-indigo-500"
        />

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2"
        >
          {loading ? <Loader className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          {loading ? 'Analyzing Diagram & Formula...' : 'Solve Problem with AI'}
        </button>
      </form>
    </div>
  );
};

export default ImageMathUploader;
