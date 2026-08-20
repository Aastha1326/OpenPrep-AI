import React, { useEffect, useState } from 'react';
import { Save, Target, X } from 'lucide-react';
import API from '../../services/api';

const SubjectGoalModal = ({ subject, currentTarget, onClose, onSaved }) => {
  const [target, setTarget] = useState(currentTarget ?? 80);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setTarget(currentTarget ?? 80);
  }, [currentTarget]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);

    try {
      const res = await API.put(`/progress/subject-goals/${subject.id}`, {
        targetPercentage: Number(target),
      });

      if (res.data?.success) {
        onSaved(Number(target));
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save target score');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-sm bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between border-b border-neutral-200 pb-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-700" />
            <h3 className="font-playfair text-lg font-bold text-neutral-900">
              Set Target Score
            </h3>
          </div>

          <button
            onClick={onClose}
            className="rounded-full p-1 text-neutral-500 hover:bg-neutral-100"
            aria-label="Close target score modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mb-5 text-sm text-neutral-600">
          Set your target percentage for <strong>{subject.name}</strong>.
        </p>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
              Target
            </span>
            <span className="text-2xl font-bold text-amber-800">{target}%</span>
          </div>

          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={target}
            onChange={(e) => setTarget(Number(e.target.value))}
            className="w-full accent-amber-700"
            aria-label={`Target percentage for ${subject.name}`}
          />

          <div className="mt-1 flex justify-between text-[10px] text-neutral-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {error && (
          <p className="mb-4 rounded-sm bg-red-50 p-3 text-xs font-medium text-red-700">
            {error}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-sm bg-amber-800 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Target'}
        </button>
      </div>
    </div>
  );
};

export default SubjectGoalModal;