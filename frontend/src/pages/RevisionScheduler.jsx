import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSchedules,
  fetchScheduleById,
  fetchTodaysSlots,
  fetchCalendarSlots,
  createSchedule,
  updateScheduleStatus,
  deleteSchedule,
  clearErrors,
} from '../store/slices/revisionSchedulerSlice';
import RevisionSlotCard from '../components/planner/RevisionSlotCard';
import RevisionCalendarView, { DayDetailPanel } from '../components/planner/RevisionCalendarView';

export default function RevisionScheduler() {
  const dispatch = useDispatch();
  const {
    schedules,
    selectedSchedule,
    selectedScheduleSlots,
    todaysSlots,
    calendarSlots,
    calendarGrouped,
    loadingSchedules,
    loadingSchedule,
    loadingToday,
    creatingSchedule,
  } = useSelector((state) => state.revisionScheduler);

  const [activeTab, setActiveTab] = useState('today');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDaySlots, setSelectedDaySlots] = useState(null);
  const [calendarDate, setCalendarDate] = useState(new Date());

  // Load data on mount
  useEffect(() => {
    dispatch(fetchSchedules());
    dispatch(fetchTodaysSlots());

    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    dispatch(fetchCalendarSlots({ startDate, endDate }));

    return () => dispatch(clearErrors());
  }, [dispatch]);

  // Load schedule details when selected
  useEffect(() => {
    if (selectedSchedule?.id) {
      dispatch(fetchScheduleById(selectedSchedule.id));
    }
  }, [dispatch, selectedSchedule?.id]);

  const handleCreateSchedule = () => {
    setShowCreateModal(true);
  };

  const handleDateSelect = (dateKey, slots) => {
    setSelectedDate(dateKey);
    setSelectedDaySlots(slots);
  };

  // Stats from today's slots
  const todayStats = useMemo(() => {
    const total = todaysSlots.length;
    return { total };
  }, [todaysSlots]);

  // Active schedule
  const activeSchedule = useMemo(() => {
    return schedules.find((s) => s.status === 'active') || null;
  }, [schedules]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              📅 Revision Scheduler
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              AI-optimized revision calendars based on your readiness, weaknesses, and exam date
            </p>
          </div>
          <button
            onClick={handleCreateSchedule}
            disabled={creatingSchedule}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-xl shadow-sm transition-colors text-sm"
          >
            {creatingSchedule ? 'Generating...' : '+ New Schedule'}
          </button>
        </div>

        {/* Active Schedule Banner */}
        {activeSchedule && (
          <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 mb-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold mb-1">{activeSchedule.title}</h2>
                <div className="flex items-center gap-4 text-sm text-indigo-100">
                  <span>📅 Exam: {activeSchedule.examDate}</span>
                  <span>⏱️ {activeSchedule.dailyStudyHours}h/day</span>
                  <span>📊 {activeSchedule.totalSlots} total slots</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold">{activeSchedule.overallProgress || 0}%</p>
                  <p className="text-xs text-indigo-200">Completed</p>
                </div>
                <div className="w-32">
                  <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-white rounded-full transition-all duration-500"
                      style={{ width: `${activeSchedule.overallProgress || 0}%` }}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      dispatch(
                        updateScheduleStatus({
                          scheduleId: activeSchedule.id,
                          status: activeSchedule.status === 'paused' ? 'active' : 'paused',
                        })
                      )
                    }
                    className="px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    {activeSchedule.status === 'paused' ? '▶️ Resume' : '⏸️ Pause'}
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm('Delete this schedule? This cannot be undone.')) {
                        dispatch(deleteSchedule(activeSchedule.id));
                      }
                    }}
                    className="px-3 py-1.5 bg-red-500/30 hover:bg-red-500/50 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4 grid grid-cols-4 gap-3 text-center">
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xl font-bold">{activeSchedule.completedSlots || 0}</p>
                <p className="text-[10px] text-indigo-200">Completed</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xl font-bold">
                  {(activeSchedule.totalSlots || 0) - (activeSchedule.completedSlots || 0)}
                </p>
                <p className="text-[10px] text-indigo-200">Remaining</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xl font-bold">{activeSchedule.averageReadinessAtStart || 0}%</p>
                <p className="text-[10px] text-indigo-200">Initial Readiness</p>
              </div>
              <div className="bg-white/10 rounded-lg p-2">
                <p className="text-xl font-bold">{activeSchedule.currentReadiness || 0}%</p>
                <p className="text-[10px] text-indigo-200">Current Readiness</p>
              </div>
            </div>
          </div>
        )}

        {/* No active schedule prompt */}
        {!activeSchedule && !loadingSchedules && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-12 text-center mb-8">
            <div className="text-5xl mb-4">📅</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No active revision schedule
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
              Generate an AI-optimized revision schedule based on your exam date,
              subject readiness, and weakness areas. The scheduler will create
              personalized time slots with spaced repetition intervals.
            </p>
            <button
              onClick={handleCreateSchedule}
              disabled={creatingSchedule}
              className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {creatingSchedule ? 'Generating Schedule...' : '🎯 Generate Schedule'}
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-gray-100 dark:bg-gray-800 rounded-lg p-1 w-fit">
          {[
            { key: 'today', label: '📌 Today', count: todayStats.total },
            { key: 'calendar', label: '📅 Calendar' },
            { key: 'all', label: '📋 All Schedules', count: schedules.length },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.key
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
              {tab.count !== undefined && (
                <span className="ml-1.5 px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[10px]">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${activeTab === 'calendar' ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            {/* Today Tab */}
            {activeTab === 'today' && (
              <div>
                {loadingToday ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : todaysSlots.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-4xl mb-3">✨</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      No revisions scheduled for today
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activeSchedule
                        ? 'All done for today! Check back tomorrow.'
                        : 'Create a schedule to start your revision plan.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                        Today&apos;s Revision Slots ({todaysSlots.length})
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-red-400" /> Critical
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-orange-400" /> High
                        </span>
                      </div>
                    </div>
                    {todaysSlots.map((slot) => (
                      <RevisionSlotCard key={slot.id} slot={slot} />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <RevisionCalendarView
                slots={calendarSlots}
                groupedByDate={calendarGrouped}
                currentDate={calendarDate}
                onDateSelect={handleDateSelect}
              />
            )}

            {/* All Schedules Tab */}
            {activeTab === 'all' && (
              <div>
                {loadingSchedules ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : schedules.length === 0 ? (
                  <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <div className="text-4xl mb-3">📋</div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                      No schedules yet
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                      Generate your first revision schedule to see it here
                    </p>
                    <button
                      onClick={handleCreateSchedule}
                      className="px-5 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors text-sm"
                    >
                      + Create Schedule
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {schedules.map((schedule) => (
                      <div
                        key={schedule.id}
                        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all cursor-pointer"
                        onClick={() => dispatch(fetchScheduleById(schedule.id))}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                            {schedule.title}
                          </h4>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              schedule.status === 'active'
                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                                : schedule.status === 'paused'
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                                : schedule.status === 'completed'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                            }`}
                          >
                            {schedule.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <span>📅 Exam: {schedule.examDate}</span>
                          <span>📊 {schedule.completedSlots || 0}/{schedule.totalSlots} slots</span>
                          <span>⏱️ {schedule.dailyStudyHours}h/day</span>
                        </div>
                        <div className="mt-2 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${schedule.overallProgress || 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Day Detail or Schedule Slots */}
          {activeTab === 'calendar' && (
            <div className="lg:col-span-1">
              {selectedDate && selectedDaySlots ? (
                <DayDetailPanel
                  date={selectedDate}
                  slots={selectedDaySlots}
                  onClose={() => {
                    setSelectedDate(null);
                    setSelectedDaySlots(null);
                  }}
                />
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                    📋 Schedule Slots
                  </h4>
                  {selectedScheduleSlots.length > 0 ? (
                    <div className="space-y-2 max-h-[500px] overflow-y-auto">
                      {selectedScheduleSlots.slice(0, 20).map((slot) => (
                        <RevisionSlotCard key={slot.id} slot={slot} compact />
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-8">
                      Click a date on the calendar to view slots, or select a schedule from the All tab.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Schedule Modal */}
      {showCreateModal && (
        <CreateScheduleModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          isCreating={creatingSchedule}
        />
      )}
    </div>
  );
}

// ── Create Schedule Modal ──

function CreateScheduleModal({ isOpen, onClose, isCreating }) {
  const dispatch = useDispatch();
  const [examDate, setExamDate] = useState('');
  const [dailyHours, setDailyHours] = useState(3);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!examDate) return;

    dispatch(createSchedule({ examDate, dailyStudyHours: dailyHours })).then((action) => {
      if (!action.error) {
        onClose();
      }
    });
  };

  if (!isOpen) return null;

  // Set min date to tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
            📅 Generate Revision Schedule
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            AI will optimize your revision slots based on readiness and weaknesses
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Exam Date *
            </label>
            <input
              type="date"
              value={examDate}
              min={minDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Daily Study Hours
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="12"
                step="0.5"
                value={dailyHours}
                onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100 w-12 text-right">
                {dailyHours}h
              </span>
            </div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3">
            <p className="text-xs text-indigo-700 dark:text-indigo-300">
              💡 The scheduler will analyze your current readiness across all subjects,
              identify weak areas, and distribute revision slots using spaced repetition
              intervals (1, 3, 7, 14, 30 days) for optimal retention.
            </p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={isCreating || !examDate}
              className="flex-1 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium rounded-lg transition-colors text-sm"
            >
              {isCreating ? 'Generating...' : '📅 Generate Schedule'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 font-medium rounded-lg transition-colors text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
