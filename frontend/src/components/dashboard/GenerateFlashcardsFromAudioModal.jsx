import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckSquare,
  FileAudio,
  Loader,
  Square,
  UploadCloud,
  X,
} from 'lucide-react';
import API from '../../services/api';
import MathMarkdownEditor from '../common/MathMarkdownEditor';

const MAX_AUDIO_SIZE = 25 * 1024 * 1024;
const ACCEPTED_TYPES = new Set(['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav', 'audio/mp4', 'audio/x-m4a']);
const ACCEPTED_EXTENSIONS = ['.mp3', '.wav', '.m4a'];

const GenerateFlashcardsFromAudioModal = ({ onClose, onImported }) => {
  const fileInputRef = useRef(null);

  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState(null);
  const [transcription, setTranscription] = useState('');
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
    if (!candidate) return 'Please select an audio file.';

    const lowerName = candidate.name.toLowerCase();
    const hasValidExtension = ACCEPTED_EXTENSIONS.some((ext) =>
      lowerName.endsWith(ext)
    );

    if (!hasValidExtension || !ACCEPTED_TYPES.has(candidate.type)) {
      return 'Only MP3, WAV, and M4A audio files are supported.';
    }

    if (candidate.size > MAX_AUDIO_SIZE) {
      return 'Audio file is too large. Maximum allowed size is 25MB.';
    }

    if (candidate.size === 0) {
      return 'The selected audio file is empty.';
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
    setTranscription('');
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    selectFile(event.dataTransfer.files?.[0]);
  };

  const generate = async () => {
    if (!file) {
      setError('Please upload an audio file first.');
      return;
    }

    if (!selectedSubjectId) {
      setError('Please select a subject.');
      return;
    }

    setLoading(true);
    setError(null);
    setCards([]);
    setTranscription('');

    try {
      const formData = new FormData();
      formData.append('audio', file);
      formData.append('subjectId', selectedSubjectId);
      formData.append('count', '8');

      const response = await API.post('/flashcards/from-audio', formData, {
        headers: {
          'Content-Type': undefined,
        },
      });

      setTranscription(response.data?.transcription || '');

      const generatedCards = response.data?.data || [];

      setCards(
        generatedCards.map((card) => ({
          ...card,
          selected: true,
        }))
      );
    } catch (err) {
      setError(
        err?.response?.data?.error ||
          'Could not process the audio. Please try a clearer recording.'
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
                <FileAudio className="w-5 h-5 text-primary-500" />
                Audio to Flashcards
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                Upload a lecture or voice note and let AI extract revision cards.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={loading || importing}
              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              aria-label="Close audio flashcard generator"
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
                  Drag & drop your audio here
                </p>

                <p className="text-sm text-slate-500 mt-1">
                  or click to browse
                </p>

                <p className="text-xs text-slate-400 mt-3">
                  MP3, WAV, or M4A • Maximum 25MB
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".mp3,.wav,.m4a,audio/mpeg,audio/wav,audio/mp4"
                  className="hidden"
                  onChange={(event) => selectFile(event.target.files?.[0])}
                />
              </div>

              {file && (
                <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 dark:bg-slate-900 p-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileAudio className="w-5 h-5 text-primary-500 shrink-0" />
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
                    Transcribing & extracting concepts...
                  </>
                ) : (
                  'Generate Flashcards'
                )}
              </button>
            </>
          )}

          {loading && (
            <div className="py-8 text-center text-sm text-slate-500">
              AI is transcribing the audio and extracting key concepts.
            </div>
          )}

          {!loading && cards.length > 0 && (
            <>
              {transcription && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
                    View transcription
                  </summary>

                  <div className="mt-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300 max-h-40 overflow-y-auto whitespace-pre-wrap">
                    {transcription}
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
                      <MathMarkdownEditor
                        value={card.front}
                        onChange={(next) => updateCard(index, 'front', next)}
                        ariaLabel={`Flashcard ${index + 1} front`}
                        rows={1}
                        className="text-sm font-medium"
                      />

                      <MathMarkdownEditor
                        value={card.back}
                        onChange={(next) => updateCard(index, 'back', next)}
                        ariaLabel={`Flashcard ${index + 1} back`}
                        rows={2}
                        className="text-sm text-slate-600 dark:text-slate-300"
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
                    setTranscription('');
                  }}
                  disabled={importing}
                  className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm"
                >
                  Choose Another Audio
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

export default GenerateFlashcardsFromAudioModal;