import React, { useState } from 'react';
import API from '../../services/api';

const EXAM_PRESETS = {
  JEE: {
    name: 'JEE Target Bundle 2026',
    type: 'JEE',
    description: 'Joint Entrance Examination preparation bundle across Mathematics, Physics, and Chemistry.',
    subjects: [
      { name: 'Mathematics', weightage: 33.3, description: 'Calculus, Algebra, Coordinate Geometry' },
      { name: 'Physics', weightage: 33.3, description: 'Mechanics, Electromagnetism, Optics, Modern Physics' },
      { name: 'Chemistry', weightage: 33.4, description: 'Physical, Organic, and Inorganic Chemistry' }
    ]
  },
  NEET: {
    name: 'NEET Target Bundle 2026',
    type: 'NEET',
    description: 'National Eligibility cum Entrance Test multi-subject preparation bundle.',
    subjects: [
      { name: 'Biology', weightage: 50, description: 'Botany and Zoology' },
      { name: 'Physics', weightage: 25, description: 'Mechanics, Thermodynamics, Modern Physics' },
      { name: 'Chemistry', weightage: 25, description: 'Organic, Physical, and Inorganic Chemistry' }
    ]
  },
  SAT: {
    name: 'SAT Exam Prep Bundle',
    type: 'SAT',
    description: 'Scholastic Assessment Test dual-section target preparation.',
    subjects: [
      { name: 'Reading & Writing', weightage: 50, description: 'Reading comprehension, grammar, and vocabulary' },
      { name: 'Math', weightage: 50, description: 'Algebra, Problem Solving, Advanced Math, Geometry' }
    ]
  },
  GRE: {
    name: 'GRE General Prep Bundle',
    type: 'GRE',
    description: 'Graduate Record Examination composite preparation bundle.',
    subjects: [
      { name: 'Quantitative Reasoning', weightage: 40, description: 'Arithmetic, Algebra, Geometry, Data Analysis' },
      { name: 'Verbal Reasoning', weightage: 40, description: 'Reading Comprehension, Text Completion, Sentence Equivalence' },
      { name: 'Analytical Writing', weightage: 20, description: 'Analyze an Issue task' }
    ]
  }
};

const CompositeBundleModal = ({ isOpen, onClose, onSuccess }) => {
  const [examName, setExamName] = useState('');
  const [examDate, setExamDate] = useState('');
  const [targetExamType, setTargetExamType] = useState('JEE');
  const [description, setDescription] = useState('');
  const [subjects, setSubjects] = useState([
    { name: 'Mathematics', weightage: 33.3, description: '' },
    { name: 'Physics', weightage: 33.3, description: '' },
    { name: 'Chemistry', weightage: 33.4, description: '' }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleApplyPreset = (presetKey) => {
    const preset = EXAM_PRESETS[presetKey];
    if (preset) {
      setTargetExamType(preset.type);
      setExamName(preset.name);
      setDescription(preset.description);
      setSubjects(preset.subjects.map(s => ({ ...s })));
    }
  };

  const handleAddSubject = () => {
    setSubjects([...subjects, { name: '', weightage: 0, description: '' }]);
  };

  const handleRemoveSubject = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (index, field, value) => {
    const updated = [...subjects];
    updated[index][field] = value;
    setSubjects(updated);
  };

  const totalWeightage = subjects.reduce((sum, s) => sum + (parseFloat(s.weightage) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!examName.trim() || !examDate) {
      setError('Please provide an Exam Name and Target Date.');
      return;
    }

    if (subjects.length === 0) {
      setError('Please add at least one subject to your composite bundle.');
      return;
    }

    const invalidSub = subjects.find(s => !s.name.trim());
    if (invalidSub) {
      setError('All bundled subjects must have a valid name.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        name: examName.trim(),
        description: description.trim(),
        date: new Date(examDate).toISOString(),
        targetExamType,
        subjects: subjects.map(s => ({
          name: s.name.trim(),
          description: s.description || '',
          weightage: parseFloat(s.weightage) || 0
        }))
      };

      const res = await API.post('/academic/bundles', payload);
      if (res.data && res.data.success) {
        if (onSuccess) onSuccess(res.data.data);
        onClose();
      }
    } catch (err) {
      console.error('Failed to create composite exam bundle', err);
      setError(err.response?.data?.error || 'Failed to create exam bundle.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-stone-900 border border-amber-500/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-stone-100 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white text-xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-bold text-amber-300 flex items-center gap-2 mb-1">
          🎓 Create Target Exam Composite Bundle
        </h2>
        <p className="text-slate-400 text-xs mb-6">
          Bundle multiple subjects into a single competitive exam goal with custom subject weightages.
        </p>

        {/* Preset selector */}
        <div className="mb-6 p-3 bg-black/50 border border-amber-500/20 rounded-xl">
          <label className="block text-xs font-semibold text-amber-400 uppercase mb-2">
            Quick Load Exam Preset:
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(EXAM_PRESETS).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => handleApplyPreset(key)}
                className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-all"
              >
                + {key} Preset
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/40 border border-red-500/50 text-red-300 rounded-lg text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Exam Name *</label>
              <input
                type="text"
                value={examName}
                onChange={(e) => setExamName(e.target.value)}
                placeholder="e.g. JEE Target 2026"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Target Exam Date *</label>
              <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Exam Category / Type</label>
              <select
                value={targetExamType}
                onChange={(e) => setTargetExamType(e.target.value)}
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
              >
                <option value="JEE">JEE (Engineering)</option>
                <option value="NEET">NEET (Medical)</option>
                <option value="SAT">SAT (Undergraduate)</option>
                <option value="GRE">GRE (Graduate)</option>
                <option value="Custom">Custom Composite</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional exam description"
                className="w-full px-3 py-2 bg-stone-800 border border-stone-700 rounded-lg text-sm text-stone-100 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Bundled Subjects Section */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                Bundled Subjects & Percentage Weightages
              </label>
              <span className={`text-xs font-bold ${Math.round(totalWeightage) === 100 ? 'text-green-400' : 'text-amber-400'}`}>
                Total Weightage: {Math.round(totalWeightage * 10) / 10}%
              </span>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {subjects.map((sub, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-stone-800/80 p-2 rounded-lg border border-stone-700">
                  <input
                    type="text"
                    value={sub.name}
                    onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)}
                    placeholder="Subject Name"
                    className="flex-1 px-2.5 py-1.5 bg-stone-900 border border-stone-700 rounded text-xs text-stone-100 focus:border-amber-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-1 w-28">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={sub.weightage}
                      onChange={(e) => handleSubjectChange(idx, 'weightage', e.target.value)}
                      className="w-16 px-2 py-1.5 bg-stone-900 border border-stone-700 rounded text-xs text-stone-100 text-center focus:border-amber-500 focus:outline-none"
                    />
                    <span className="text-xs text-slate-400">%</span>
                  </div>
                  {subjects.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSubject(idx)}
                      className="text-red-400 hover:text-red-300 p-1 text-sm"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddSubject}
              className="mt-2 text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              + Add Another Subject
            </button>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-slate-300 rounded-lg text-xs font-medium transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-black rounded-lg text-xs font-bold shadow-lg transition-all"
            >
              {loading ? 'Creating Bundle...' : 'Create Exam Bundle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompositeBundleModal;
