import { useState } from 'react';
import { Sparkles, Loader, AlertCircle, Check, XCircle } from 'lucide-react';
import API from '../../services/api';
import Modal from '../common/Modal';

const CreateDeckModal = ({ subjectId, topicId, onClose, onCreated }) => {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [difficulty, setDifficulty] = useState(null);
  const [tagging, setTagging] = useState(false);
  const [tagError, setTagError] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleAutoTag = async () => {
    if (!front.trim() || !back.trim()) {
      setTagError('Please fill in both sides of the card first.');
      return;
    }
    setTagging(true);
    setTagError(null);
    try {
      const res = await API.post('/flashcards/auto-tag', { front, back });
      const { tags, difficulty: suggestedDifficulty } = res.data.data;
      setSuggestedTags((tags || []).map((tag) => ({ label: tag, accepted: true })));
      setDifficulty(suggestedDifficulty || null);
    } catch (err) {
      setTagError(err?.response?.data?.error || 'Could not generate AI suggestions right now.');
    } finally {
      setTagging(false);
    }
  };

  const toggleTag = (idx) => {
    setSuggestedTags((prev) =>
      prev.map((t, i) => (i === idx ? { ...t, accepted: !t.accepted } : t))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const acceptedTags = suggestedTags.filter((t) => t.accepted).map((t) => t.label);
      await API.post('/flashcards', {
        subjectId,
        topicId,
        front,
        back,
        tags: acceptedTags,
        difficulty,
      });
      onCreated?.();
      onClose();
    } catch (err) {
      setTagError(err?.response?.data?.error || 'Failed to save flashcard.');
    } finally {
      setSaving(false);
    }
  };

  return (
    // Rendered conditionally by the parent, so it is open whenever it exists.
    <Modal isOpen onClose={onClose} title="Create Flashcard" size="lg">
      <>
        <label htmlFor="flashcard-front" className="sr-only">
          Front (question or term)
        </label>
        <textarea
          id="flashcard-front"
          value={front}
          onChange={(e) => setFront(e.target.value)}
          placeholder="Front (question/term)"
          className="w-full border rounded p-2 mb-3"
        />
        <label htmlFor="flashcard-back" className="sr-only">
          Back (answer or definition)
        </label>
        <textarea
          id="flashcard-back"
          value={back}
          onChange={(e) => setBack(e.target.value)}
          placeholder="Back (answer/definition)"
          className="w-full border rounded p-2 mb-3"
        />

        <button
          type="button"
          onClick={handleAutoTag}
          disabled={tagging}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-700 text-white text-sm rounded mb-3 disabled:opacity-50"
        >
          {tagging ? <Loader className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Auto-Tag with AI
        </button>

        {tagError && (
          <div className="flex items-center gap-1.5 text-red-600 text-xs mb-3">
            <AlertCircle className="w-4 h-4" /> {tagError}
          </div>
        )}

        {suggestedTags.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-bold text-neutral-600 mb-1">
              Suggested tags {difficulty ? `· Difficulty: ${difficulty}` : ''}
            </p>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => toggleTag(idx)}
                  aria-pressed={tag.accepted}
                  className={`flex items-center gap-1 px-2 py-1 rounded text-xs border ${
                    tag.accepted
                      ? 'bg-green-100 border-green-400 text-green-800'
                      : 'bg-neutral-100 border-neutral-300 text-neutral-400 line-through'
                  }`}
                >
                  {tag.accepted ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {tag.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !front.trim() || !back.trim()}
          className="w-full py-2 bg-neutral-900 text-white rounded disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Flashcard'}
        </button>
      </>
    </Modal>
  );
};

export default CreateDeckModal;