import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckSquare,
  FileImage,
  FileText,
  Loader,
  Square,
  UploadCloud,
  X,
} from 'lucide-react';
import API from '../../services/api';

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const ACCEPTED_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.webp', '.pdf'];

const GenerateFlashcardsFromOCRModal = ({ onClose, onImported }) => {
  const fileInputRef = useRef(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [extractedText, setExtractedText] = useState('');
  const [cards, setCards] = useState([]);

  useEffect(() => {
    const loadSubjects = async () => {
      try {
        const response = await API.get('/academic/subjects');

        if (response.data?.success) {
          const subjectList = response.data.data || [];
          setSubjects(subjectList);

          if (subjectList.length > 0) {
            setSelectedSubjectId(subjectList[0].id);
          }
        }
      } catch {
        setError('Could not load subjects. Please create a subject first.');
      }
    };

    loadSubjects();
  }, []);

  const validateFile = (candidate) => {
    if (!candidate) return 'Please select a file.';

    const lowerName = candidate.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext)
    );

    if (!hasValidExtension || !ACCEPTED_TYPES.has(candidate.type)) {
      return 'Only PNG, JPG, WebP images and PDF files are supported.';
    }

    if (candidate.size > MAX_FILE_SIZE) {
      return 'File is too large. Maximum allowed size is 10MB.';
    }

    if (candidate.size === 0) {
      return 'The selected file is empty.';
    }

    return null;
  };

  const selectFile = (candidate) => {
    const validationError = validateFile(candidate);

    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setFile(candidate);
    setError(null);
    setCards([]);
    setExtractedText('');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const generate = async () => {
    if (!file) {
      setError('Please upload an image or PDF file first.');
      return;
    }

    if (!selectedSubjectId) {
      setError('Please select a subject.');
      return;
    }

    setLoading(true);
    setError(null);
    setCards([]);
    setExtractedText('');

    try {
      // Step 1: Extract text via OCR
      const ocrFormData = new FormData();
      ocrFormData.append('file', file);

      const ocrResponse = await API.post('/notes/ocr-upload', ocrFormData, {
        headers: {
          'Content-Type': undefined,
        },
      });

      const text = ocrResponse.data?.data?.extractedText || '';
      setExtractedText(text);

      if (!text || text.trim().length === 0) {
        setError('No text could be extracted from the file. Please try a clearer image or a different file.');
        setLoading(false);
        return;
      }

      // Step 2: Generate flashcards from extracted text
      const subject = subjects.find((s) => s.id === selectedSubjectId);
      const subjectName = subject?.name || 'General';

      const flashcardResponse = await API.post('/flashcards/generate-from-text', {
        subjectId: selectedSubjectId,
        text,
        count: 8,
      });

      const generatedCards = flashcardResponse.data?.data || [];

      setCards(
        generatedCards.map((card) => ({
          ...card,
          selected: true,
        }))
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Could not process the file. Please try again with a clearer image or different file.'
      );
    } finally {
      setLoading(false);
    }
  };

  const updateCard = (index, field, value) => {
    setCards((previous) =>
      previous.map((card, cardIndex) =>
        cardIndex === index ? { ...card, [field]: value } : card
      )
    );
  };

  const toggleCard = (index) => {
    setCards((previous) =>
      previous.map((card, cardIndex) =>
        cardIndex === index
          ? { ...card, selected: !card.selected }
          : card
      )
    );
  };

  const handleImport = async () => {
    const selectedCards = cards
      .filter((card) => card.selected)
      .map(({ front, back }) => ({ front, back }));

    if (selectedCards.length === 0) {
      setError('Select at least one flashcard before saving.');
      return;
    }

    setImporting(true);
    setError(null);

    try {
      await API.post(`/flashcards/import?subjectId=${selectedSubjectId}`, {
        cards: selectedCards,
      });

      onImported?.(selectedCards.length);
      onClose();
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Failed to save the generated flashcards.'
      );
    } finally {
      setImporting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white dark:bg-slate-800 shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileImage className="w-5 h-5 text-primary-500" />
                Image/PDF to Flashcards
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload an image or PDF and let AI extract revision cards.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading || importing}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close OCR flashcard generator"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Subject
            </label>

            <select
              value={selectedSubjectId}
              onChange={(event) => setSelectedSubjectId(event.target.value)}
              disabled={loading || importing}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
            >
              {subjects.length === 0 ? (
                <option value="">No subjects available</option>
              ) : (
                subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {!cards.length && (
            <>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
                  dragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/20'
                    : 'border-slate-300 dark:border-slate-600 hover:border-primary-400'
                }`}
              >
                <UploadCloud className="w-10 h-10 mx-auto mb-3 text-primary-500" />

                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  Drag & drop your image or PDF here
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  or click to browse
                </p>

                <p className="text-xs text-slate-400 mt-3">
                  PNG, JPG, WebP, PDF • Maximum 10MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
                  className="hidden"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                />
              </div>

              {file && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    {file.type === 'application/pdf' ? (
                      <FileText className="w-5 h-5 text-primary-500 shrink-0" />
                    ) : (
                      <FileImage className="w-5 h-5 text-primary-500 shrink-0" />
                    )}
                    <span className="text-sm truncate">{file.name}</span>
                  </div>

                  <span className="text-xs text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
              )}

              <button
                type="button"
                onClick={generate}
                disabled={!file || loading || !selectedSubjectId}
                className="mt-4 w-full py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Extracting text & generating flashcards...
                  </>
                ) : (
                  'Generate Flashcards'
                )}
              </button>
            </>
          )}

          {loading && (
            <div className="py-8 text-center text-sm text-slate-500">
              AI is extracting text from your file and generating flashcards.
            </div>
          )}

          {!loading && cards.length > 0 && (
            <>
              {extractedText && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
                    View extracted text
                  </summary>

                  <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {extractedText}
                  </div>
                </details>
              )}

              <div className="space-y-3">
                {cards.map((card, index) => (
                  <div
                    key={index}
                    className="rounded-lg border border-slate-200 dark:border-slate-700 p-3 flex gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => toggleCard(index)}
                      className="mt-1 shrink-0"
                      aria-label={
                        card.selected
                          ? `Deselect card ${index + 1}`
                          : `Select card ${index + 1}`
                      }
                    >
                      {card.selected ? (
                        <CheckSquare className="w-5 h-5 text-primary-600" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </button>

                    <div className="flex-1 space-y-2">
                      <input
                        value={card.front}
                        onChange={(event) =>
                          updateCard(index, 'front', event.target.value)
                        }
                        className="w-full rounded border border-slate-200 dark:border-slate-600 bg-transparent px-2 py-1.5 text-sm font-medium"
                        aria-label={`Flashcard ${index + 1} front`}
                      />

                      <textarea
                        value={card.back}
                        onChange={(event) =>
                          updateCard(index, 'back', event.target.value)
                        }
                        rows={2}
                        className="w-full rounded border border-slate-200 dark:border-slate-600 bg-transparent px-2 py-1.5 text-sm text-slate-600 dark:text-slate-300"
                        aria-label={`Flashcard ${index + 1} back`}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 mt-5">
                <button
                  type="button"
                  onClick={() => {
                    setCards([]);
                    setExtractedText('');
                  }}
                  disabled={importing}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
                >
                  Choose Another File
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={
                    importing ||
                    cards.filter((card) => card.selected).length === 0
                  }
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {importing
                    ? 'Saving...'
                    : `Save Selected (${cards.filter((card) => card.selected).length})`}
                </button>
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GenerateFlashcardsFromOCRModal;
