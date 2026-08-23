import React, { useState, useEffect } from 'react';
import { Award, Plus, Edit2, Trash2, Check, X, Loader2, Sparkles } from 'lucide-react';
import API from '../../services/api';

const AdminBadgeManager = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBadge, setEditingBadge] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    icon: 'Award',
    category: 'achievement',
    criteriaType: 'streak_days',
    criteriaThreshold: 1,
    isActive: true,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchBadges = async () => {
    setLoading(true);
    try {
      const res = await API.get('/admin/badges');
      if (res.data?.success) {
        setBadges(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to load admin badges:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBadges();
  }, []);

  const handleEdit = (badge) => {
    setEditingBadge(badge.id);
    setFormData({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon || 'Award',
      category: badge.category || 'achievement',
      criteriaType: badge.criteriaType || 'streak_days',
      criteriaThreshold: badge.criteriaThreshold || 1,
      isActive: badge.isActive !== false,
    });
  };

  const handleResetForm = () => {
    setEditingBadge(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      icon: 'Award',
      category: 'achievement',
      criteriaType: 'streak_days',
      criteriaThreshold: 1,
      isActive: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      if (editingBadge) {
        await API.put(`/admin/badges/${editingBadge}`, formData);
        setMessage(`Badge "${formData.name}" updated successfully.`);
      } else {
        await API.post('/admin/badges', formData);
        setMessage(`Badge "${formData.name}" created successfully.`);
      }
      handleResetForm();
      fetchBadges();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save badge criteria.');
    }
  };

  const handleDelete = async (badgeId) => {
    if (!window.confirm('Are you sure you want to delete this badge criteria?')) return;
    try {
      await API.delete(`/admin/badges/${badgeId}`);
      setMessage('Badge deleted successfully.');
      fetchBadges();
    } catch (err) {
      setError('Failed to delete badge.');
    }
  };

  return (
    <div className="space-y-6" data-testid="admin-badge-manager">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold font-playfair text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" /> Badge Criteria Management
          </h2>
          <p className="text-xs text-neutral-500 italic mt-0.5">
            Configure criteria thresholds and unlock metrics for progress-based user badges.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 text-xs border border-emerald-200">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs border border-rose-200">
          {error}
        </div>
      )}

      {/* Badge Editor Form */}
      <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-4">
        <h3 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
          {editingBadge ? `Edit Badge: ${editingBadge}` : 'Add New Badge Criteria'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Badge ID</label>
            <input
              type="text"
              required
              disabled={!!editingBadge}
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              placeholder="e.g. 30_day_master"
              className="w-full text-xs p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Master Scholar"
              className="w-full text-xs p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Category</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            >
              <option value="streak">Streak</option>
              <option value="quiz">Quiz</option>
              <option value="flashcard">Flashcard</option>
              <option value="study">Study</option>
              <option value="achievement">Achievement</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Criteria Metric</label>
            <select
              value={formData.criteriaType}
              onChange={(e) => setFormData({ ...formData, criteriaType: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            >
              <option value="streak_days">Streak Days</option>
              <option value="quizzes_completed">Quizzes Completed</option>
              <option value="perfect_quizzes">Perfect Quizzes (100%)</option>
              <option value="flashcards_created">Flashcards Created</option>
              <option value="flashcards_reviewed">Flashcards Reviewed</option>
              <option value="focus_minutes">Focus Minutes</option>
              <option value="notes_created">Notes Created</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Criteria Threshold</label>
            <input
              type="number"
              min="1"
              required
              value={formData.criteriaThreshold}
              onChange={(e) => setFormData({ ...formData, criteriaThreshold: e.target.value })}
              className="w-full text-xs p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Icon Name</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              placeholder="Flame, Brain, Trophy, etc."
              className="w-full text-xs p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">Description</label>
          <input
            type="text"
            required
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Description shown to users"
            className="w-full text-xs p-2 rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-100"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          {editingBadge && (
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-neutral-300 text-neutral-600 dark:text-neutral-300"
            >
              Cancel Edit
            </button>
          )}
          <button
            type="submit"
            className="px-4 py-1.5 text-xs font-bold bg-amber-600 text-white hover:bg-amber-700 rounded-lg shadow transition flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5" /> {editingBadge ? 'Update Badge' : 'Create Badge'}
          </button>
        </div>
      </form>

      {/* Badges Table */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-sm">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-50 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 uppercase tracking-wider">
            <tr>
              <th className="p-3">Badge ID / Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Criteria</th>
              <th className="p-3">Threshold</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-6 text-center text-neutral-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-amber-500" /> Loading badges...
                </td>
              </tr>
            ) : badges.length > 0 ? (
              badges.map((b) => (
                <tr key={b.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/50 transition">
                  <td className="p-3">
                    <div className="font-bold text-neutral-900 dark:text-neutral-100">{b.name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">{b.id}</div>
                  </td>
                  <td className="p-3 font-semibold capitalize text-neutral-600 dark:text-neutral-300">{b.category}</td>
                  <td className="p-3 font-mono text-neutral-600 dark:text-neutral-400">{b.criteriaType}</td>
                  <td className="p-3 font-bold text-amber-600 dark:text-amber-400">{b.criteriaThreshold}</td>
                  <td className="p-3 text-right space-x-2">
                    <button
                      onClick={() => handleEdit(b)}
                      className="p-1 rounded text-neutral-500 hover:text-amber-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 rounded text-neutral-500 hover:text-rose-600 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="p-4 text-center text-neutral-400">No badges found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminBadgeManager;
