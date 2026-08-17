import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, CheckCircle2, Loader2, X } from 'lucide-react';
import api from '../../services/api';

const UploadMaterial = ({ onClose }) => {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | uploading | processing | success | error
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setStatus('idle');
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');

    const formData = new FormData();
    formData.append('document', file);

    try {
      // Simulate quick upload, then we wait for processing
      setTimeout(() => setStatus('processing'), 800);

      const response = await api.post('/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setResult(response.data.decks);
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ y: 50, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 20, scale: 0.95 }}
        className="bg-stone-900 border border-stone-800 rounded-2xl p-6 w-full max-w-lg shadow-2xl relative"
      >
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-500 hover:text-stone-300 transition"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-playfair font-bold text-stone-100 mb-2">Auto-Generate Decks</h2>
          <p className="text-stone-400 text-sm">Upload a PDF textbook or slides, and our AI will extract flashcards instantly.</p>
        </div>

        {status === 'idle' || status === 'error' ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-amber-600/40 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-amber-900/10 transition group"
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept=".pdf" 
              className="hidden" 
            />
            
            {file ? (
              <>
                <FileText className="w-12 h-12 text-amber-500 mb-3 group-hover:scale-110 transition" />
                <p className="text-stone-200 font-medium">{file.name}</p>
                <p className="text-stone-500 text-xs mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </>
            ) : (
              <>
                <UploadCloud className="w-12 h-12 text-amber-600/60 mb-3 group-hover:scale-110 transition group-hover:text-amber-500" />
                <p className="text-stone-300 font-medium">Click to upload PDF</p>
                <p className="text-stone-500 text-xs mt-1">Max 10MB</p>
              </>
            )}
          </div>
        ) : status === 'success' ? (
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 text-center">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <h3 className="text-green-400 font-bold mb-2">Success!</h3>
            <p className="text-stone-300 text-sm mb-4">Generated {result?.length} decks from your document.</p>
            
            <div className="space-y-2 text-left">
              {result?.map((deck, idx) => (
                <div key={idx} className="bg-stone-800 p-3 rounded-lg border border-stone-700">
                  <p className="text-amber-400 font-medium text-sm">{deck.deckName}</p>
                  <p className="text-stone-400 text-xs mt-1">{deck.cards.length} cards extracted</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 text-amber-500 animate-spin mb-4" />
            <p className="text-amber-400 font-medium animate-pulse">
              {status === 'uploading' ? 'Uploading document...' : 'AI is reading and parsing...'}
            </p>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {status === 'idle' && (
            <button 
              onClick={handleUpload}
              disabled={!file}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-stone-900 font-bold rounded-xl transition"
            >
              Generate Flashcards
            </button>
          )}
          
          {status === 'success' && (
            <button 
              onClick={onClose}
              className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-stone-900 font-bold rounded-xl transition"
            >
              View Decks
            </button>
          )}
        </div>

      </motion.div>
    </motion.div>
  );
};

export default UploadMaterial;
