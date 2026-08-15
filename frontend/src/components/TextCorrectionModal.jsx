import React, { useState, useEffect } from 'react';
import { X, Save, AlertTriangle } from 'lucide-react';

const TextCorrectionModal = ({ isOpen, onClose, ocrData, onSave }) => {
  const [editedText, setEditedText] = useState('');

  useEffect(() => {
    if (ocrData) {
      setEditedText(ocrData.extractedText || '');
    }
  }, [ocrData]);

  if (!isOpen || !ocrData) return null;

  const lowConfidence = ocrData.confidence < 60;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 border-b flex justify-between items-center bg-neutral-50">
          <div>
            <h2 className="text-lg font-bold text-neutral-800">Review OCR Text</h2>
            <p className="text-sm text-neutral-500">
              Confidence Score: <span className={`font-semibold ${lowConfidence ? 'text-red-500' : 'text-green-500'}`}>{ocrData.confidence.toFixed(1)}%</span>
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-neutral-200 rounded-full transition">
            <X className="w-5 h-5 text-neutral-600" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto bg-neutral-100 flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col">
            {lowConfidence && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm flex gap-2 items-start">
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <p>
                  <strong>Low Confidence Warning:</strong> The OCR engine had trouble reading parts of this image. Please carefully review and correct the text below, or consider uploading a clearer image.
                </p>
              </div>
            )}
            
            <label className="text-sm font-semibold text-neutral-700 mb-2">Extracted Text</label>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              className="flex-1 w-full min-h-[300px] p-4 rounded-xl border border-neutral-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none font-mono text-sm"
              placeholder="Correct the extracted text here..."
            />
          </div>
          
          <div className="md:w-1/3 flex flex-col">
            <label className="text-sm font-semibold text-neutral-700 mb-2">Source Image</label>
            <div className="bg-white p-2 rounded-xl border border-neutral-200 h-full max-h-[400px] flex items-center justify-center overflow-hidden">
              {ocrData.fileUrl ? (
                <img 
                  src={ocrData.fileUrl} 
                  alt="Source" 
                  className="max-w-full max-h-full object-contain rounded"
                />
              ) : (
                <p className="text-sm text-neutral-400">Image not available</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-4 border-t flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-lg border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(editedText)}
            className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-medium flex items-center gap-2 shadow transition"
          >
            <Save className="w-4 h-4" />
            Use Text
          </button>
        </div>
      </div>
    </div>
  );
};

export default TextCorrectionModal;
