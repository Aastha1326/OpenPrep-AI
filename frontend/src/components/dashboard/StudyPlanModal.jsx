import { useRef, useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Calendar as CalendarIcon, CheckCircle, Circle, AlertTriangle, ClockPlus, Filter, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import API from '../../services/api';

// Create Study Plan Form Component
const CreateStudyPlanForm = ({ onClose, onSubmit, loading, error, formData, handleInputChange, minStartDate, minEndDate, exams }) => (
  <div className="max-w-xl mx-auto">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-bold font-playfair text-[#3E2723]">Create Study Plan</h3>
      <button
        onClick={onClose}
        className="p-2 hover:bg-[#8B4513]/10 rounded-full transition-colors text-[#8B4513]"
      >
        <X className="w-6 h-6" />
      </button>
    </div>

    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          Select Exam
        </label>
        <select
          value={formData.examId}
          onChange={(e) => handleInputChange('examId', e.target.value)}
          className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
          disabled={loading}
        >
          {exams.length === 0 ? (
            <option value="">Loading exams...</option>
          ) : (
            exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {exam.name} ({exam.date ? new Date(exam.date).toLocaleDateString() : 'No date'})
              </option>
            ))
          )}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            Start Date
          </label>
          <input
            type="date"
            value={formData.startDate}
            onChange={(e) => handleInputChange('startDate', e.target.value)}
            min={minStartDate}
            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
            disabled={loading}
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
            End Date
          </label>
          <input
            type="date"
            value={formData.endDate}
            onChange={(e) => handleInputChange('endDate', e.target.value)}
            min={minEndDate}
            className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
            disabled={loading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
          Study Hours Per Day
        </label>
        <input
          type="number"
          value={formData.studyHoursPerDay}
          onChange={(e) => handleInputChange('studyHoursPerDay', e.target.value)}
          min="0.5"
          max="24"
          step="0.5"
          className="w-full px-4 py-2 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded text-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-yellow-600"
          disabled={loading}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-neutral-700">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2 border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 font-medium transition-colors"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-yellow-700 text-white rounded shadow hover:shadow-lg font-medium transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Generating with AI...
            </>
          ) : (
            <>
              <CalendarIcon className="w-4 h-4" />
              Create Plan
            </>
          )}
        </button>
      </div>
    </form>
  </div>
);

const WeakBadge = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-100 text-red-700 border border-red-200 ml-2">
    <AlertTriangle className="w-3 h-3" />
    Weak Topic
  </span>
);

const BumpTimeButton = ({ onClick, disabled = false }) => (
  <button
    onClick={(e) => {
      e.stopPropagation();
      onClick?.();
    }}
    disabled={disabled}
    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-sm bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
    title="Add 30 minutes of recommended study time"
  >
    <ClockPlus className="w-3 h-3" />
    +30 min
  </button>
);

const StudyPlanModal = ({ isOpen, onClose, activePlan, onBumpTime, onPlanCreated }) => {
  const contentRef = useRef(null);
  const [isExporting, setIsExporting] = useState(false);
  const [showWeakOnly, setShowWeakOnly] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    examId: '',
    startDate: '',
    endDate: '',
    studyHoursPerDay: 3,
  });
  const [exams, setExams] = useState([]);

  const dailyGoals = useMemo(() => activePlan?.dailyGoals || [], [activePlan?.dailyGoals]);

  const filteredDailyGoals = useMemo(() => {
    if (!showWeakOnly) return dailyGoals;
    return dailyGoals.map((day) => ({
      ...day,
      tasks: (day.tasks || []).filter((task) => task.topic?.status === 'Weak'),
    }));
  }, [dailyGoals, showWeakOnly]);

  const totalWeakCount = useMemo(() => {
    let count = 0;
    dailyGoals.forEach((day) => {
      (day.tasks || []).forEach((task) => {
        if (task.topic?.status === 'Weak') count += 1;
      });
    });
    return count;
  }, [dailyGoals]);

  // Fetch exams when create form is shown
  useEffect(() => {
    if (showCreateForm && exams.length === 0) {
      const fetchExams = async () => {
        try {
          const res = await API.get('/academic/exams');
          const fetchedExams = Array.isArray(res.data?.data) ? res.data.data : [];
          setExams(fetchedExams);
          if (fetchedExams.length > 0) {
            setFormData((prev) => ({ ...prev, examId: fetchedExams[0].id }));
          }
        } catch (err) {
          console.error('Failed to load exams:', err);
        }
      };
      fetchExams();
    }
  }, [showCreateForm, exams.length]);

  // Reset form when modal closes
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (!isOpen) {
      setShowCreateForm(false);
      setError(null);
      setFormData({ examId: '', startDate: '', endDate: '', studyHoursPerDay: 3 });
    }
  }

  const handleExportPDF = () => {
    if (!contentRef.current) return;
    setIsExporting(true);

    const element = contentRef.current;
    
    const opt = {
      margin: 10,
      filename: 'My_Study_Plan.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
      .set(opt)
      .from(element)
      .save()
      .then(() => {
        setIsExporting(false);
      })
      .catch(err => {
        console.error('PDF export failed:', err);
        setIsExporting(false);
      });
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === 'startDate' && value) {
      // Ensure endDate is not before startDate
      setFormData((prev) => {
        if (prev.endDate && new Date(value) > new Date(prev.endDate)) {
          return { ...prev, endDate: value };
        }
        return prev;
      });
    }
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.examId || !formData.startDate || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      setError('End date must be after start date');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await API.post('/study-plans/generate-ai', {
        examId: formData.examId,
        startDate: formData.startDate,
        endDate: formData.endDate,
        studyHoursPerDay: Number(formData.studyHoursPerDay) || 3,
      });
      if (res.data?.success) {
        setShowCreateForm(false);
        onPlanCreated?.();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate study plan');
    } finally {
      setLoading(false);
    }
  };

  const minStartDate = new Date().toISOString().split('T')[0];
  const minEndDate = formData.startDate || minStartDate;

  const showForm = showCreateForm || !activePlan;

  const handleCreateClose = () => {
    if (activePlan) {
      setShowCreateForm(false);
    } else {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-4xl max-h-[90vh] bg-[#F5E6CA] rounded-md shadow-2xl overflow-hidden flex flex-col border border-[#8B4513]/30"
          >
            {/* Header */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-6 border-b border-[#8B4513]/20 bg-[#ebd5b3]">
              <div className="flex items-center space-x-3">
                <CalendarIcon className="w-8 h-8 text-[#8B4513]" />
                <div>
                  <h2 className="text-3xl font-bold font-playfair text-[#3E2723]">Study Plan</h2>
                  {totalWeakCount > 0 && (
                    <p className="text-xs text-[#8B4513]/70 mt-0.5">
                      {totalWeakCount} weak topic{totalWeakCount === 1 ? '' : 's'} flagged — prioritize these!
                    </p>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {!showForm && (
                  <>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold transition-colors cursor-pointer border bg-white/70 text-[#8B4513] border-[#8B4513]/30 hover:bg-white"
                    >
                      <Plus className="w-4 h-4" />
                      New Plan
                    </button>
                    <button
                      onClick={() => setShowWeakOnly((v) => !v)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-sm text-sm font-semibold transition-colors cursor-pointer border ${
                        showWeakOnly
                          ? 'bg-red-600 text-white border-red-700'
                          : 'bg-white/70 text-[#8B4513] border-[#8B4513]/30 hover:bg-white'
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                      {showWeakOnly ? 'Showing Weak Only' : 'Filter Weak Topics'}
                    </button>
                    <button
                      onClick={handleExportPDF}
                      disabled={isExporting}
                      className="flex items-center space-x-2 bg-gradient-to-r from-yellow-700 to-yellow-900 text-white px-4 py-2 rounded-sm hover:from-yellow-600 hover:to-yellow-800 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <Download className="w-5 h-5" />
                      <span className="font-semibold">{isExporting ? 'Exporting...' : 'Export to PDF'}</span>
                    </button>
                  </>
                )}
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-[#8B4513]/10 rounded-full transition-colors text-[#8B4513] cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Scrollable Content (PDF Target) */}
            <div className="overflow-y-auto p-8 flex-1 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')]">
              {showForm ? (
                <CreateStudyPlanForm
                  onClose={handleCreateClose}
                  onSubmit={handleSubmit}
                  loading={loading}
                  error={error}
                  formData={formData}
                  handleInputChange={handleInputChange}
                  minStartDate={minStartDate}
                  minEndDate={minEndDate}
                  exams={exams}
                />
              ) : (
              <div ref={contentRef} className="bg-white/80 p-8 rounded-sm shadow-sm border border-[#8B4513]/10 max-w-3xl mx-auto" id="study-plan-content">
                <div className="text-center mb-10">
                  <h1 className="text-4xl font-bold font-playfair text-[#3E2723] mb-2 border-b-2 border-[#8B4513]/30 pb-4 inline-block">
                    My Study Journey
                  </h1>
                  <p className="text-[#8B4513]/80 italic mt-2 text-lg">
                    Generated for your success
                  </p>
                  {showWeakOnly && (
                    <p className="mt-4 inline-block px-3 py-1 rounded-full bg-red-100 text-red-700 text-sm font-semibold border border-red-200">
                      <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                      Weak topics view — focus mode enabled
                    </p>
                  )}
                </div>

                <div className="space-y-8">
                  {filteredDailyGoals && filteredDailyGoals.length > 0 ? (
                    filteredDailyGoals.map((day, idx) => {
                      const dateStr = day.date ? new Date(day.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : `Day ${idx + 1}`;
                      const hasTasks = day.tasks && day.tasks.length > 0;
                      const weakDayCount = (day.tasks || []).filter((t) => t.topic?.status === 'Weak').length;
                      return (
                        <div key={idx} className="bg-white rounded border border-[#8B4513]/20 overflow-hidden shadow-sm break-inside-avoid">
                          <div className="bg-[#8B4513]/5 p-4 border-b border-[#8B4513]/20 flex items-center justify-between">
                            <h3 className="text-xl font-bold font-playfair text-[#8B4513]">{dateStr}</h3>
                            {weakDayCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-600 border border-red-200">
                                <AlertTriangle className="w-3 h-3" />
                                {weakDayCount} weak
                              </span>
                            )}
                          </div>
                          <div className="p-4 space-y-3">
                            {hasTasks ? (
                              day.tasks.map((task, tIdx) => {
                                const isWeak = task.topic?.status === 'Weak';
                                return (
                                  <div
                                    key={tIdx}
                                    className={`flex items-start space-x-3 p-2 rounded transition-colors ${
                                      isWeak ? 'bg-red-50/60 hover:bg-red-50 border border-red-100' : 'hover:bg-[#8B4513]/5'
                                    }`}
                                  >
                                    {task.completed ? (
                                      <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                                    ) : (
                                      <Circle className={`w-5 h-5 mt-0.5 shrink-0 ${isWeak ? 'text-red-400' : 'text-[#8B4513]/40'}`} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <div className="flex flex-wrap items-center gap-y-1">
                                        <p className="font-semibold text-neutral-800">
                                          {task.title || task.topic?.name || 'Untitled Task'}
                                        </p>
                                        {isWeak && <WeakBadge />}
                                      </div>
                                      {(task.description || task.duration) && (
                                        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                                          {task.description && (
                                            <p className="text-sm text-neutral-600">{task.description}</p>
                                          )}
                                          {task.duration && (
                                            <span className="inline-flex items-center gap-1 text-xs text-neutral-500 font-medium">
                                              <ClockPlus className="w-3 h-3" />
                                              {task.duration} min
                                            </span>
                                          )}
                                        </div>
                                      )}
                                      {isWeak && onBumpTime && (
                                        <BumpTimeButton
                                          onClick={() => onBumpTime(task.id || task._id, 30)}
                                        />
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-neutral-500 italic">
                                {showWeakOnly ? 'No weak topics scheduled for this day.' : 'No tasks scheduled for this day.'}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-neutral-500 italic py-12">
                      {showWeakOnly
                        ? 'No weak topics found in your study plan. Great work!'
                        : 'No study plan data available.'}
                    </div>
                  )}
                </div>
                
                {/* PDF Footer spacer */}
                <div className="mt-12 pt-4 border-t border-[#8B4513]/20 text-center text-sm text-[#8B4513]/60 italic font-playfair">
                  Stay consistent. The roots of education are bitter, but the fruit is sweet.
                </div>
              </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default StudyPlanModal;
