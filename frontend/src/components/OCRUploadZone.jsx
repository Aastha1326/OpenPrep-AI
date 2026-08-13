import React, { useState, useRef } from 'react';
import { UploadCloud, FileImage, AlertCircle, Loader2, X } from 'lucide-react';
import API from '../services/api';

const OCRUploadZone = ({ onTextExtracted }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | processing | success | error
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const validTypes = ['image/png', 'image/jpeg', 'image/webp'];

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;

    if (selectedFile.type === 'image/gif' || selectedFile.type === 'image/bmp') {
      setError('GIF and BMP formats are not supported for OCR. Please upload a PNG, JPG, or WebP image.');
      return false;
    }

    if (!validTypes.includes(selectedFile.type)) {
      setError('Please upload a valid image file (PNG, JPG, WebP).');
      return false;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit. Please upload a smaller image.');
      return false;
    }

    setError('');
    return true;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (validateFile(selectedFile)) {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleDragOver = (e) => e.preventDefault();

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (validateFile(droppedFile)) {
      setFile(droppedFile);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setStatus('uploading');
    setProgress(10); // Start progress

    const formData = new FormData();
    formData.append('file', file);

    try {
      // Simulate progress for UI feedback
      const progressInterval = setInterval(() => {
        setProgress((prev) => (prev < 90 ? prev + 10 : prev));
      }, 500);

      const response = await API.post('/notes/ocr-upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      clearInterval(progressInterval);
      setProgress(100);
      setStatus('success');

      if (onTextExtracted) {
        onTextExtracted(response.data.data);
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || 'Failed to process image. Please try again.');
      setStatus('error');
    }
  };

  const clearFile = (e) => {
    e.stopPropagation();
    setFile(null);
    setStatus('idle');
    setError('');
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {status === 'idle' || status === 'error' ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="border-2 border-dashed border-amber-600/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-50 transition relative"
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".png, .jpg, .jpeg, .webp"
            className="hidden"
          />

          {file ? (
            <>
              <button 
                onClick={clearFile}
                className="absolute top-2 right-2 p-1 bg-neutral-200 hover:bg-neutral-300 rounded-full transition"
              >
                <X className="w-4 h-4 text-neutral-700" />
              </button>
              <FileImage className="w-12 h-12 text-amber-500 mb-3" />
              <p className="text-neutral-700 font-medium">{file.name}</p>
              <p className="text-neutral-500 text-xs mt-1">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </>
          ) : (
            <>
              <UploadCloud className="w-12 h-12 text-amber-600/60 mb-3" />
              <p className="text-neutral-700 font-medium">Click or Drag & Drop an image here</p>
              <p className="text-neutral-500 text-xs mt-1">PNG, JPG, WebP up to 10MB</p>
            </>
          )}
        </div>
      ) : status === 'uploading' || status === 'processing' ? (
        <div className="border-2 border-amber-200 rounded-xl p-8 flex flex-col items-center justify-center text-center bg-amber-50">
          <Loader2 className="w-10 h-10 text-amber-600 animate-spin mb-4" />
          <p className="text-amber-800 font-medium">Extracting text...</p>
          <div className="w-full max-w-xs bg-amber-200 rounded-full h-2 mt-4 overflow-hidden">
            <div
              className="bg-amber-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <div className="border border-green-200 bg-green-50 rounded-xl p-6 text-center">
          <FileImage className="w-10 h-10 text-green-500 mx-auto mb-2" />
          <h3 className="text-green-800 font-bold">Extraction Complete!</h3>
          <p className="text-green-600 text-sm mt-1">Review the extracted text below.</p>
          <button
            onClick={clearFile}
            className="mt-4 px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm font-medium transition"
          >
            Upload Another Image
          </button>
        </div>
      )}

      {status === 'idle' && file && (
        <button
          onClick={handleUpload}
          className="w-full mt-4 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition shadow"
        >
          Extract Text via OCR
        </button>
      )}
    </div>
  );
};

export default OCRUploadZone;
