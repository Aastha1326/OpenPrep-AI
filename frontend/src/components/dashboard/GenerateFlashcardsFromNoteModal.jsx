import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader, AlertCircle, CheckSquare, Square } from 'lucide-react';
import API from '../../services/api';

const GenerateFlashcardsFromNoteModal = ({ note, onClose, onImported }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cards, setCards] = useState([]); // [{ front, back, selected }]
  const [subjectId, setSubjectId] = useState(null);
  const [importing, setImporting] = useState(false);

  const generate = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await API.post('/flashcards/generate-from-note', { noteId: note.id });
      const generated = res?.data?.data || [];
      setSubjectId(res?.data?.subjectId || note.subject?.id);
      setCards(generated.map((c) => ({ ...c, selected: true })));
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to generate flashcards.');
    } finally {
      setLoading(false);
    }
  };

  useState(() => {
    generate();
  }, []);

  const toggleCard = (idx) => {
    setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, selected: !c.selected } : c)));
  };

  const editCard = (idx, field, value) => {
    setCards((prev) => prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c)));
  };

  const handleImport = async () => {
    const selectedCards = cards.filter((c) => c.selected).map(({ front, back }) => ({ front, back }));
    if (selectedCards.length === 0 || !subjectId) return;

    setImporting(true);
    setError(null);
    try {
      await API.post(`/flashcards/import?subjectId=${subjectId}`, { cards: selectedCards });
      onImported?.(selectedCards.length);
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || 'Failed to import flashcards.');
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
        className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
              <Sparkles className="w-5 h-5 text-yellow-500" /> Generate AI Flashcards
            </h3>
            <button onClick={onClose} className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          <p className="text-sm text-slate-500 mb-4">
            From note: <span className="font-semibold">{note.title}</span>
          </p>

          {loading && (
            <div className="flex items-center gap-2 text-sm text-slate-500 py-8 justify-center">
              <Loader className="w-4 h-4 animate-spin" /> Generating flashcards&hellip;
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 mb-4">
              <AlertCircle className="w-4 h-4" /> {error}
            </div>
          )}

          {!loading && cards.length > 0 && (
            <div className="space-y-3 mb-4">
              {cards.map((card, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg"
                >
                  <button type="button" onClick={() => toggleCard(idx)} className="mt-1 shrink-0">
                    {card.selected ? (
                      <CheckSquare className="w-5 h-5 text-indigo-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>
                  <div className="flex-1 space-y-2">
                    <input
                      value={card.front}
                      onChange={(e) => editCard(idx, 'front', e.target.value)}
                      className="w-full text-sm font-medium bg-transparent border-b border-slate-200 dark:border-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      value={card.back}
                      onChange={(e) => editCard(idx, 'back', e.target.value)}
                      className="w-full text-sm text-slate-500 bg-transparent border-b border-slate-200 dark:border-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loading && (
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={importing || cards.filter((c) => c.selected).length === 0}
                className="px-4 py-2 text-sm rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
              >
                {importing ? 'Importing...' : `Import Selected (${cards.filter((c) => c.selected).length})`}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default GenerateFlashcardsFromNoteModal;