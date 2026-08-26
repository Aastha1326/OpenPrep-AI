import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Calendar,
  Clock,
  Target,
  BookOpen,
  Brain,
  Flame,
  Award,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  Timer,
  Coffee,
  BarChart3,
  Activity,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Edit3,
  Trash2,
  Lightbulb,
  ArrowUpRight,
  ArrowDownRight,
  CalendarClock,
  Settings,
  Dumbbell,
  Moon,
  Sun,
  Map,
} from 'lucide-react';

// ─── Exam Types ─────────────────────────────────────────────────────────────
const EXAM_TYPES = [
  { id: 'usmle_step1', name: 'USMLE Step 1', subjects: ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Behavioral Science'], totalHours: 600, color: '#8b5cf6' },
  { id: 'usmle_step2', name: 'USMLE Step 2 CK', subjects: ['Internal Medicine', 'Surgery', 'Pediatrics', 'OB/GYN', 'Psychiatry', 'Preventive Medicine'], totalHours: 500, color: '#06b6d4' },
  { id: 'neet_pg', name: 'NEET PG', subjects: ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Microbiology', 'Forensic Medicine', 'PSM', 'Medicine', 'Surgery', 'OB/GYN', 'Pediatrics', 'ENT', 'Ophthalmology', 'Orthopedics', 'Dermatology', 'Psychiatry', 'Anesthesia', 'Radiology', 'Radiotherapy'], totalHours: 800, color: '#f59e0b' },
  { id: 'plab', name: 'PLAB Part 1', subjects: ['Clinical Sciences', 'Applied Knowledge', 'Evidence-Based Practice'], totalHours: 400, color: '#22c55e' },
  { id: 'mcat', name: 'MCAT', subjects: ['Biology', 'General Chemistry', 'Organic Chemistry', 'Physics', 'Biochemistry', 'Psychology', 'Sociology', 'Critical Analysis'], totalHours: 500, color: '#ef4444' },
  { id: 'custom', name: 'Custom Exam', subjects: [], totalHours: 400, color: '#6366f1' },
];

const STUDY_PHASES = [
  { id: 'content', label: 'Content Learning', icon: BookOpen, color: '#3b82f6', description: 'First pass through all material — focus on understanding concepts' },
  { id: 'practice', label: 'Practice Questions', icon: Target, color: '#8b5cf6', description: 'Apply knowledge through MCQ practice and case-based questions' },
  { id: 'revision', label: 'Active Revision', icon: RefreshCw, color: '#f59e0b', description: 'Spaced repetition, flashcards, and weak area focus' },
  { id: 'simulation', label: 'Mock Exams', icon: Brain, color: '#ef4444', description: 'Full-length timed practice exams to build stamina and strategy' },
];

// ─── Helper Functions ───────────────────────────────────────────────────────

function generateStudySchedule(exam, daysLeft, subjects, studyHoursPerDay) {
  if (daysLeft <= 0 || subjects.length === 0) return [];

  const totalHoursAvailable = daysLeft * studyHoursPerDay;
  const hoursPerSubject = totalHoursAvailable / subjects.length;

  // Determine phase based on days left
  let phase;
  const totalDays = daysLeft;
  if (totalDays > 60) phase = 'content';
  else if (totalDays > 30) phase = 'practice';
  else if (totalDays > 7) phase = 'revision';
  else phase = 'simulation';

  const phaseConfig = STUDY_PHASES.find(p => p.id === phase);

  // Generate daily schedule
  const schedule = [];
  const now = new Date();

  for (let d = 0; d < Math.min(daysLeft, 30); d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);

    // Distribute subjects across the day
    const dailySubjects = [];
    const subjectHours = studyHoursPerDay / Math.min(subjects.length, 4);
    const subjectsForDay = subjects.slice(d % subjects.length, (d % subjects.length) + Math.min(subjects.length, 4));
    if (subjectsForDay.length < 2) subjectsForDay.push(...subjects.slice(0, 2 - subjectsForDay.length));

    subjectsForDay.forEach((subject, i) => {
      dailySubjects.push({
        subject,
        hours: Math.round(subjectHours * 10) / 10,
        startTime: `${8 + i * Math.round(subjectHours)}:00`,
        type: phase,
        priority: d < 7 ? 'high' : d < 14 ? 'medium' : 'low',
      });
    });

    schedule.push({
      date: date.toISOString(),
      dayNumber: d + 1,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      subjects: dailySubjects,
      totalHours: studyHoursPerDay,
      phase: phaseConfig,
      breaks: Math.floor(studyHoursPerDay / 2),
      Pomodoros: Math.floor(studyHoursPerDay * 2),
    });
  }

  return schedule;
}

function calculateProgress(schedule, completedTasks) {
  const totalTasks = schedule.reduce((s, day) => s + day.subjects.length, 0);
  return totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
}

function getMotivationalMessage(daysLeft, progress) {
  if (daysLeft <= 3) return { message: "Final countdown! Trust your preparation. You've got this! 🎯", color: '#ef4444' };
  if (daysLeft <= 7) return { message: "One week to go! Focus on weak areas and stay calm. 💪", color: '#f59e0b' };
  if (daysLeft <= 30) return { message: "Great momentum! Keep the pace and trust the process. 🚀", color: '#3b82f6' };
  if (progress > 70) return { message: "Excellent progress! You're ahead of schedule. 🌟", color: '#22c55e' };
  if (progress > 40) return { message: "Good progress! Stay consistent and you'll reach your goal. 📈", color: '#8b5cf6' };
  return { message: "Start strong! Every day of preparation counts. 💡", color: '#06b6d4' };
}

// ─── Components ─────────────────────────────────────────────────────────────

function CountdownRing({ daysLeft, totalDays, color }) {
  const pct = totalDays > 0 ? ((totalDays - daysLeft) / totalDays) * 100 : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <div className="relative" style={{ width: 140, height: 140 }}>
      <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="8" />
        <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8"
                strokeDasharray={circumference} strokeDashoffset={offset}
                strokeLinecap="round" className="transition-all duration-1000" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-stone-100">{daysLeft}</span>
        <span className="text-[10px] text-stone-400">days left</span>
      </div>
    </div>
  );
}

function DayCard({ day, index, completedTasks, onToggleTask }) {
  const [expanded, setExpanded] = useState(false);
  const isToday = new Date(day.date).toDateString() === new Date().toDateString();
  const isPast = new Date(day.date) < new Date() && !isToday;
  const allDone = day.subjects.every((_, i) => completedTasks.includes(`${day.dayNumber}-${i}`));

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`rounded-xl border p-3 transition-all ${
        isToday ? 'bg-stone-800/80 border-stone-600/60 ring-1 ring-amber-500/30' :
        isPast ? 'bg-stone-900/30 border-stone-800/30 opacity-60' :
        allDone ? 'bg-stone-900/40 border-emerald-700/30' :
        'bg-stone-900/60 border-stone-700/30 hover:border-stone-600/50'
      } cursor-pointer`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isToday ? (
            <span className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400 text-xs font-bold">
              NOW
            </span>
          ) : (
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              allDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-800 text-stone-400'
            }`}>
              {day.dayNumber}
            </span>
          )}
          <div>
            <p className="text-sm font-medium text-stone-200">{day.dayName}</p>
            <p className="text-[10px] text-stone-500">
              {day.subjects.length} tasks • {day.totalHours}h study
              {day.phase && ` • ${day.phase.label}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {allDone && <CheckCircle className="h-4 w-4 text-emerald-400" />}
          <ChevronDown className={`h-4 w-4 text-stone-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-stone-700/30 space-y-2">
              {day.subjects.map((task, i) => {
                const taskId = `${day.dayNumber}-${i}`;
                const isDone = completedTasks.includes(taskId);
                return (
                  <div key={i} className="flex items-center gap-2 p-2 bg-stone-800/40 rounded-lg">
                    <input
                      type="checkbox"
                      checked={isDone}
                      onChange={(e) => { e.stopPropagation(); onToggleTask(taskId); }}
                      className="w-4 h-4 rounded accent-emerald-500"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                      <p className={`text-xs font-medium ${isDone ? 'text-stone-500 line-through' : 'text-stone-200'}`}>
                        {task.subject}
                      </p>
                      <p className="text-[10px] text-stone-500">{task.hours}h • {task.startTime}</p>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      task.priority === 'high' ? 'bg-red-900/40 text-red-400' :
                      task.priority === 'medium' ? 'bg-amber-900/40 text-amber-400' :
                      'bg-stone-800 text-stone-500'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────────────────

export default function ExamCountdownPlanner() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Exam config
  const [selectedExam, setSelectedExam] = useState(null);
  const [examDate, setExamDate] = useState('');
  const [studyHoursPerDay, setStudyHoursPerDay] = useState(6);
  const [customSubjects, setCustomSubjects] = useState('');
  const [isConfigured, setIsConfigured] = useState(false);

  // Study state
  const [completedTasks, setCompletedTasks] = useState([]);
  const [studyStreak, setStudyStreak] = useState(12);
  const [totalStudyHours, setTotalStudyHours] = useState(185);
  const [pomodoroCount, setPomodoroCount] = useState(340);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const exam = EXAM_TYPES.find(e => e.id === selectedExam);
  const subjects = exam ? (exam.id === 'custom' ? customSubjects.split(',').map(s => s.trim()).filter(Boolean) : exam.subjects) : [];
  const daysLeft = examDate ? Math.max(0, Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0;
  const totalDays = daysLeft + 30; // for progress ring
  const schedule = useMemo(() => generateStudySchedule(exam, daysLeft, subjects, studyHoursPerDay), [exam, daysLeft, subjects, studyHoursPerDay]);
  const progress = calculateProgress(schedule, completedTasks);
  const motivation = getMotivationalMessage(daysLeft, progress);

  const handleConfigure = () => {
    if (selectedExam && examDate && subjects.length > 0) {
      setIsConfigured(true);
      setActiveTab('dashboard');
    }
  };

  const toggleTask = useCallback((taskId) => {
    setCompletedTasks(prev =>
      prev.includes(taskId) ? prev.filter(t => t !== taskId) : [...prev, taskId]
    );
  }, []);

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'schedule', label: 'Daily Schedule', icon: Calendar },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'configure', label: 'Settings', icon: Settings },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 p-6">
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
          <div className="h-12 bg-stone-900/60 rounded-xl w-72" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-stone-900/60 rounded-2xl" />)}
          </div>
        </div>
      </div>
    );
  }

  // Setup screen
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
                <CalendarClock className="h-7 w-7 text-amber-400" />
                Exam Countdown Planner
              </h1>
              <p className="text-sm text-stone-400">Set up your exam and create an adaptive study schedule</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                      className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6 space-y-6">
            <div>
              <label className="text-sm font-medium text-stone-200 mb-2 block">Select Exam Type</label>
              <div className="grid grid-cols-2 gap-2">
                {EXAM_TYPES.map(examType => (
                  <button
                    key={examType.id}
                    onClick={() => setSelectedExam(examType.id)}
                    className={`p-3 rounded-xl text-left transition-all border ${
                      selectedExam === examType.id
                        ? 'border-stone-500 bg-stone-800/80'
                        : 'border-stone-700/30 bg-stone-800/40 hover:border-stone-600/50'
                    }`}
                  >
                    <p className="text-sm font-medium text-stone-200">{examType.name}</p>
                    <p className="text-[10px] text-stone-500">{examType.subjects.length} subjects • {examType.totalHours}h total</p>
                  </button>
                ))}
              </div>
            </div>

            {selectedExam === 'custom' && (
              <div>
                <label className="text-sm font-medium text-stone-200 mb-2 block">Custom Subjects (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g., Cardiology, Neurology, Oncology"
                  value={customSubjects}
                  onChange={(e) => setCustomSubjects(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-800/60 border border-stone-700/40 rounded-xl text-stone-200 placeholder-stone-500 focus:outline-none"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-stone-200 mb-2 block">Exam Date</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-stone-800/60 border border-stone-700/40 rounded-xl text-stone-200 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-stone-200 mb-2 block">Study Hours/Day</label>
                <div className="flex items-center gap-2">
                  <button onClick={() => setStudyHoursPerDay(Math.max(2, studyHoursPerDay - 1))}
                          className="p-2 rounded-lg bg-stone-800 border border-stone-700/50 text-stone-400 hover:text-stone-200">
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="text-2xl font-bold text-stone-100 w-12 text-center">{studyHoursPerDay}</span>
                  <button onClick={() => setStudyHoursPerDay(Math.min(12, studyHoursPerDay + 1))}
                          className="p-2 rounded-lg bg-stone-800 border border-stone-700/50 text-stone-400 hover:text-stone-200">
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={handleConfigure}
              disabled={!selectedExam || !examDate || subjects.length === 0}
              className="w-full py-3 rounded-xl text-sm font-medium text-white transition-all disabled:opacity-50"
              style={{ backgroundColor: exam?.color || '#6366f1' }}
            >
              Create Study Plan
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-stone-950 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)}
                    className="p-2 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all">
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-stone-100 flex items-center gap-2">
                <CalendarClock className="h-7 w-7" style={{ color: exam?.color }} />
                {exam?.name} Countdown
              </h1>
              <p className="text-sm text-stone-400">{daysLeft} days until exam • {subjects.length} subjects • {studyHoursPerDay}h/day</p>
            </div>
          </div>
          <button onClick={() => setIsConfigured(false)}
                  className="px-3 py-2 rounded-xl bg-stone-900/60 border border-stone-700/40 text-stone-400 hover:text-stone-200 transition-all text-xs flex items-center gap-1">
            <Settings className="h-3.5 w-3.5" /> Reconfigure
          </button>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 bg-stone-900/40 rounded-xl p-1 border border-stone-700/30 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20' : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
                    }`}>
              <tab.icon className="h-4 w-4" /> {tab.label}
            </button>
          ))}
        </div>

        {/* ═══ Dashboard Tab ═══ */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Motivation Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="p-4 rounded-xl border-l-4" style={{ borderLeftColor: motivation.color, backgroundColor: `${motivation.color}10` }}>
              <p className="text-sm font-medium" style={{ color: motivation.color }}>{motivation.message}</p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Countdown Ring */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5 flex flex-col items-center">
                <h3 className="text-sm font-semibold text-stone-200 mb-4">Exam Countdown</h3>
                <CountdownRing daysLeft={daysLeft} totalDays={totalDays} color={exam?.color} />
                <div className="mt-4 text-center">
                  <p className="text-xs text-stone-400">Exam Date</p>
                  <p className="text-sm font-medium text-stone-200">{new Date(examDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </motion.div>

              {/* KPI Grid */}
              <div className="lg:col-span-2 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: Target, label: 'Tasks Done', value: `${completedTasks.length}/${schedule.reduce((s, d) => s + d.subjects.length, 0)}`, color: '#22c55e', trend: 'up' },
                  { icon: Flame, label: 'Study Streak', value: `${studyStreak} days`, color: '#f59e0b' },
                  { icon: Clock, label: 'Hours Studied', value: `${totalStudyHours}h`, color: '#3b82f6' },
                  { icon: Zap, label: 'Pomodoros', value: pomodoroCount, color: '#8b5cf6' },
                  { icon: Brain, label: 'Overall Progress', value: `${progress}%`, color: '#ec4899' },
                  { icon: BookOpen, label: 'Subjects', value: subjects.length, color: '#06b6d4' },
                  { icon: Calendar, label: 'Daily Hours', value: `${studyHoursPerDay}h`, color: '#f97316' },
                  { icon: Award, label: 'Phase', value: schedule[0]?.phase?.label?.split(' ')[0] || 'Setup', color: '#10b981' },
                ].map((stat, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.1 + i * 0.05 }}
                              className="bg-stone-900/60 border border-stone-700/40 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${stat.color}20` }}>
                        <stat.icon className="h-3.5 w-3.5" style={{ color: stat.color }} />
                      </div>
                    </div>
                    <p className="text-lg font-bold text-stone-100">{stat.value}</p>
                    <p className="text-[10px] text-stone-500">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Progress Bar */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                        className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-stone-200">Overall Progress</h3>
                <span className="text-sm font-bold" style={{ color: exam?.color }}>{progress}%</span>
              </div>
              <div className="h-3 bg-stone-800 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="h-full rounded-full" style={{ backgroundColor: exam?.color }} />
              </div>
              <div className="flex justify-between mt-2 text-[10px] text-stone-500">
                <span>Started</span>
                <span>{completedTasks.length} of {schedule.reduce((s, d) => s + d.subjects.length, 0)} tasks completed</span>
                <span>Exam Day</span>
              </div>
            </motion.div>

            {/* Today's Schedule */}
            {schedule.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                          className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-stone-200 mb-4 flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-400" /> Today's Study Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {schedule[0]?.subjects.map((task, i) => {
                    const taskId = `${schedule[0].dayNumber}-${i}`;
                    const isDone = completedTasks.includes(taskId);
                    return (
                      <div key={i} className={`p-3 rounded-xl border transition-all ${
                        isDone ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-stone-800/40 border-stone-700/30'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" checked={isDone} onChange={() => toggleTask(taskId)}
                                   className="w-4 h-4 rounded accent-emerald-500" />
                            <div>
                              <p className={`text-sm font-medium ${isDone ? 'text-stone-500 line-through' : 'text-stone-200'}`}>{task.subject}</p>
                              <p className="text-[10px] text-stone-500">{task.hours}h • Starting {task.startTime}</p>
                            </div>
                          </div>
                          {isDone && <CheckCircle className="h-4 w-4 text-emerald-400" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* ═══ Schedule Tab ═══ */}
        {activeTab === 'schedule' && (
          <div className="space-y-3">
            {schedule.map((day, i) => (
              <DayCard key={i} day={day} index={i} completedTasks={completedTasks} onToggleTask={toggleTask} />
            ))}
          </div>
        )}

        {/* ═══ Subjects Tab ═══ */}
        {activeTab === 'subjects' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subjects.map((subject, i) => {
                const subjectTasks = schedule.reduce((s, day) =>
                  s + day.subjects.filter(t => t.subject === subject).length, 0);
                const subjectDone = completedTasks.filter(taskId => {
                  const [dayNum, taskIdx] = taskId.split('-');
                  const day = schedule.find(d => d.dayNumber === parseInt(dayNum));
                  return day && day.subjects[parseInt(taskIdx)]?.subject === subject;
                }).length;
                const pct = subjectTasks > 0 ? Math.round((subjectDone / subjectTasks) * 100) : 0;

                return (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="bg-stone-900/60 border border-stone-700/40 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-stone-200">{subject}</p>
                      <span className="text-sm font-bold" style={{ color: exam?.color }}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-stone-800 rounded-full overflow-hidden mb-2">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: exam?.color }} />
                    </div>
                    <p className="text-[10px] text-stone-500">{subjectDone}/{subjectTasks} sessions completed</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ═══ Settings Tab ═══ */}
        {activeTab === 'configure' && (
          <div className="space-y-4">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-stone-900/60 border border-stone-700/40 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-semibold text-stone-200 flex items-center gap-2">
                <Settings className="h-4 w-4 text-amber-400" /> Study Configuration
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Exam</label>
                  <p className="text-sm font-medium text-stone-200">{exam?.name}</p>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Exam Date</label>
                  <p className="text-sm font-medium text-stone-200">{new Date(examDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Study Hours/Day</label>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setStudyHoursPerDay(Math.max(2, studyHoursPerDay - 1)); }}
                            className="p-1.5 rounded-lg bg-stone-800 border border-stone-700/50 text-stone-400">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-lg font-bold text-stone-100">{studyHoursPerDay}h</span>
                    <button onClick={() => { setStudyHoursPerDay(Math.min(12, studyHoursPerDay + 1)); }}
                            className="p-1.5 rounded-lg bg-stone-800 border border-stone-700/50 text-stone-400">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-stone-400 mb-1 block">Total Study Hours</label>
                  <p className="text-sm font-medium text-stone-200">{daysLeft * studyHoursPerDay}h ({daysLeft} days × {studyHoursPerDay}h)</p>
                </div>
              </div>

              {/* Study Phase Info */}
              <div className="pt-4 border-t border-stone-700/30">
                <h4 className="text-xs font-semibold text-stone-300 mb-3">Adaptive Study Phases</h4>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {STUDY_PHASES.map((phase, i) => {
                    const isCurrentPhase = schedule[0]?.phase?.id === phase.id;
                    return (
                      <div key={i} className={`p-3 rounded-xl border transition-all ${
                        isCurrentPhase ? 'border-stone-500 bg-stone-800/80' : 'border-stone-700/30 bg-stone-800/40 opacity-60'
                      }`}>
                        <div className="flex items-center gap-2 mb-1">
                          <phase.icon className="h-3.5 w-3.5" style={{ color: phase.color }} />
                          <span className="text-xs font-medium text-stone-200">{phase.label}</span>
                          {isCurrentPhase && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400">Current</span>}
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed">{phase.description}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button onClick={() => { setIsConfigured(false); }}
                      className="w-full py-2.5 rounded-xl text-sm font-medium bg-stone-700 text-stone-200 hover:bg-stone-600 transition-all flex items-center justify-center gap-2">
                <RotateCcw className="h-4 w-4" /> Reset and Reconfigure
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
