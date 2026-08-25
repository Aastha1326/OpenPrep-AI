import React, { useState } from 'react';
import { Sparkles, X, Plus } from 'lucide-react';
import API from '../../services/api';
import Modal from '../common/Modal';

const CreateFlashcardDeckModal = ({ isOpen, onClose, onCreated, subjects }) => {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [tags, setTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Deck name is required.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await API.post('/flashcard-decks', {
        name: name.trim(),
        subject: subjectId || null,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      });
      onCreated?.();
      onClose();
    } catch (err) {
      console.error('Failed to create deck:', err);
      setError(err?.response?.data?.error || 'Failed to create deck. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Flashcard Deck" size="md">
      <form onSubmit={handleSave} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl text-xs text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="deck-name" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Deck Name
          </label>
          <input
            id="deck-name"
            type="text"
            placeholder="e.g. Organic Chemistry, Biology Terminology"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm transition"
          />
        </div>

        <div>
          <label htmlFor="deck-subject" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Subject (Optional)
          </label>
          <select
            id="deck-subject"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm transition"
          >
            <option value="">No Subject</option>
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="deck-tags" className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
            Tags (Optional, comma-separated)
          </label>
          <input
            id="deck-tags"
            type="text"
            placeholder="e.g. basics, mid-term, difficult"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-900 rounded-xl text-neutral-900 dark:text-neutral-100 focus:ring-2 focus:ring-amber-500 focus:outline-none text-sm transition"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-md transition text-sm cursor-pointer"
        >
          {saving ? 'Creating...' : 'Create Deck'}
        </button>
      </form>
    </Modal>
  );
};

export default CreateFlashcardDeckModal;
