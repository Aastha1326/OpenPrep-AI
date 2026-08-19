import React, { useState } from 'react';
import { Upload, FileText, Check, Loader2, Sparkles } from 'lucide-react';
import LazyImage from '../common/LazyImage';
import API from '../../services/api';

export default function OCRUploadZone({ onNoteSaved }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [markdownText, setMarkdownText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile) => {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(selectedFile.type)) {
      setError('Please upload a valid JPG, PNG, or WEBP image.');
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }
    setError('');
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  };

  const handleProcessOCR = async () => {
    if (!file) return;
    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await API.post('/ocr/process-notes', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (response.data.success) {
        setMarkdownText(response.data.markdown);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to process handwritten notes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93]/60 dark:border-[#412D15] rounded-2xl p-6 shadow-sm">
      <h2 className="text-xl font-bold font-playfair mb-2 flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-amber-500" /> Handwritten Notes OCR & Digitizer
      </h2>
      <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mb-4">
        Upload a photo of your physical notebook pages to extract text and formulas into structured Markdown.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
          {error}
        </div>
      )}

      {!file ? (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          className="border-2 border-dashed border-[#CEAB93] dark:border-[#412D15] rounded-xl p-8 text-center cursor-pointer hover:bg-black/5 transition"
        >
          <Upload className="w-10 h-10 mx-auto text-[#8C6A53] dark:text-[#C4BA9D] mb-2" />
          <p className="text-sm font-bold">Drag and drop your handwritten notes here</p>
          <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mt-1">Supports JPG, PNG, WEBP up to 10MB</p>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files[0] && handleSelectedFile(e.target.files[0])}
            className="hidden"
            id="ocr-file-upload"
          />
          <label htmlFor="ocr-file-upload" className="mt-4 inline-block px-4 py-2 rounded-xl btn-primary-theme text-xs font-bold cursor-pointer">
            Browse Files
          </label>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Side-by-Side Preview Pane */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Original Image Preview */}
            <div className="border border-[#CEAB93]/40 dark:border-[#412D15] rounded-xl p-3 bg-black/5 dark:bg-black/20 flex flex-col items-center">
              <span className="text-xs font-bold uppercase tracking-wider mb-2 text-[#8C6A53] dark:text-[#C4BA9D]">Original Photo</span>
              <LazyImage src={previewUrl} alt="Handwritten notes preview" loading="lazy" className="max-h-80 object-contain rounded-lg" />
              <button
                onClick={() => { setFile(null); setPreviewUrl(null); setMarkdownText(''); }}
                className="mt-3 text-xs text-red-500 hover:underline font-semibold"
              >
                Choose a different image
              </button>
            </div>

            {/* Extracted Markdown Editor / Preview */}
            <div className="border border-[#CEAB93]/40 dark:border-[#412D15] rounded-xl p-3 bg-white dark:bg-[#251D17] flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider mb-2 text-[#8C6A53] dark:text-[#C4BA9D]">Extracted Markdown Editor</span>
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
                  <p className="text-xs font-medium">Extracting text and formulas with Gemini Vision...</p>
                </div>
              ) : (
                <textarea
                  value={markdownText}
                  onChange={(e) => setMarkdownText(e.target.value)}
                  placeholder="Click 'Extract Text' to process notes..."
                  className="w-full flex-1 p-3 bg-transparent border border-[#CEAB93]/40 dark:border-[#412D15] rounded-lg text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#AD8B73]"
                  rows={10}
                />
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            {!markdownText && !loading && (
              <button
                onClick={handleProcessOCR}
                className="px-5 py-2.5 rounded-xl btn-primary-theme font-bold text-xs shadow cursor-pointer flex items-center gap-2"
              >
                <Sparkles className="w-4 h-4" /> Extract Text & Formulas
              </button>
            )}
            {markdownText && (
              <button
                onClick={() => onNoteSaved && onNoteSaved(markdownText)}
                className="px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold text-xs shadow cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Save to Digital Notes
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
