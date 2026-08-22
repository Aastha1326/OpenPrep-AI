import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Award,
  Clock,
  Zap,
  BarChart2,
  BookOpen,
  PieChart as PieIcon,
  Sparkles,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { fetchInteractiveAnalytics } from '../../store/slices/dashboardSlice';

const RadialProgressRing = ({ percentage, color = '#3b82f6', title, size = 110 }) => {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center p-4 bg-white/60 dark:bg-neutral-800/60 backdrop-blur-md rounded-2xl border border-neutral-200/60 dark:border-neutral-700/60 shadow-md">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            className="text-neutral-200 dark:text-neutral-700"
            fill="transparent"
          />
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth="8"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <span className="absolute text-xl font-bold font-mono text-neutral-800 dark:text-neutral-100">
          {percentage}%
        </span>
      </div>
      <span className="mt-2 text-xs font-semibold text-neutral-600 dark:text-neutral-300 tracking-wide text-center">
        {title}
      </span>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-neutral-900/90 text-white p-3 rounded-xl shadow-xl border border-neutral-700 text-xs backdrop-blur-md">
        <p className="font-bold text-amber-400 mb-1">{label}</p>
        {payload.map((item, idx) => (
          <p key={idx} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color || item.fill }} />
            <span>{item.name}:</span>
            <span className="font-mono font-semibold">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const InteractiveDashboard = () => {
  const dispatch = useDispatch();
  const { interactiveAnalytics, loadingAnalytics } = useSelector(
    (state) => state.dashboard || {}
  );

  useEffect(() => {
    dispatch(fetchInteractiveAnalytics());
  }, [dispatch]);

  const data = interactiveAnalytics || {
    totalQuizzes: 12,
    averageScore: 78,
    totalTimeSpentMinutes: 240,
    difficultyScore: 1050,
    scoreTrend: [
      { date: 'Quiz 1', score: 65, difficulty: 'Easy' },
      { date: 'Quiz 2', score: 70, difficulty: 'Easy' },
      { date: 'Quiz 3', score: 82, difficulty: 'Medium' },
      { date: 'Quiz 4', score: 75, difficulty: 'Medium' },
      { date: 'Quiz 5', score: 88, difficulty: 'Hard' },
    ],
    weeklyActivity: [
      { day: 'Mon', quizzesCompleted: 2, minutesSpent: 45 },
      { day: 'Tue', quizzesCompleted: 3, minutesSpent: 60 },
      { day: 'Wed', quizzesCompleted: 1, minutesSpent: 30 },
      { day: 'Thu', quizzesCompleted: 4, minutesSpent: 80 },
      { day: 'Fri', quizzesCompleted: 2, minutesSpent: 50 },
    ],
    subjectMastery: [
      { subject: 'Computer Science', masteryPercentage: 85, color: '#f59e0b' },
      { subject: 'Mathematics', masteryPercentage: 72, color: '#10b981' },
      { subject: 'Physics', masteryPercentage: 64, color: '#3b82f6' },
    ],
    difficultyDistribution: [
      { level: 'Easy', count: 5, percentage: 35 },
      { level: 'Medium', count: 7, percentage: 50 },
      { level: 'Hard', count: 2, percentage: 15 },
    ],
  };

  return (
    <div
      className="p-6 bg-gradient-to-br from-amber-500/10 via-neutral-100 to-amber-900/10 dark:from-neutral-900 dark:via-neutral-900/90 dark:to-stone-950 rounded-3xl border border-amber-500/20 shadow-2xl backdrop-blur-xl space-y-8 font-inter"
      data-testid="interactive-dashboard"
    >
      {/* --- DASHBOARD HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-neutral-300/40 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold text-xs uppercase tracking-widest mb-1">
            <Sparkles className="w-4 h-4 animate-spin" /> Interactive Progress Insights
          </div>
          <h2 className="text-3xl font-bold font-playfair text-neutral-900 dark:text-neutral-100">
            Learning Journey &amp; Performance
          </h2>
        </div>
        <div className="flex items-center gap-3 bg-amber-500/15 dark:bg-amber-900/30 px-4 py-2 rounded-xl border border-amber-500/30">
          <Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">Difficulty Level:</span>
          <span className="text-base font-bold font-mono text-amber-700 dark:text-amber-300">
            {data.difficultyScore} ELO
          </span>
        </div>
      </div>

      {/* --- KPI METRIC CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <motion.div
          whileHover={{ y: -4 }}
          className="p-5 bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 shadow-lg backdrop-blur-md flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Total Quizzes Taken
            </p>
            <p className="text-3xl font-bold font-mono text-neutral-900 dark:text-white mt-1">
              {data.totalQuizzes}
            </p>
          </div>
          <div className="p-3.5 bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-2xl ring-4 ring-blue-500/10">
            <BookOpen className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="p-5 bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 shadow-lg backdrop-blur-md flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Average Score
            </p>
            <p className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {data.averageScore}%
            </p>
          </div>
          <div className="p-3.5 bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl ring-4 ring-emerald-500/10">
            <Award className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="p-5 bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 shadow-lg backdrop-blur-md flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Time Spent
            </p>
            <p className="text-3xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {Math.round(data.totalTimeSpentMinutes)}m
            </p>
          </div>
          <div className="p-3.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl ring-4 ring-amber-500/10">
            <Clock className="w-6 h-6" />
          </div>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="p-5 bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 shadow-lg backdrop-blur-md flex items-center justify-between"
        >
          <div>
            <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">
              Difficulty Growth
            </p>
            <p className="text-3xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
              +{Math.max(0, data.difficultyScore - 1000)} Pts
            </p>
          </div>
          <div className="p-3.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded-2xl ring-4 ring-purple-500/10">
            <TrendingUp className="w-6 h-6" />
          </div>
        </motion.div>
      </div>

      {/* --- CHARTS GRID --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SCORE TREND LINE CHART */}
        <div className="p-6 bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              Score Progression Trend
            </h3>
            <span className="text-xs text-neutral-500">Recent Quizzes</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="date" stroke="#888888" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#888888" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Score %"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#f59e0b' }}
                  activeDot={{ r: 8 }}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* WEEKLY ACTIVITY BAR CHART */}
        <div className="p-6 bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 shadow-lg backdrop-blur-md">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              Weekly Study Activity
            </h3>
            <span className="text-xs text-neutral-500">Daily Minutes &amp; Quizzes</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyActivity}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                <XAxis dataKey="day" stroke="#888888" fontSize={11} />
                <YAxis stroke="#888888" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar
                  dataKey="minutesSpent"
                  name="Study Minutes"
                  fill="#3b82f6"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
                <Bar
                  dataKey="quizzesCompleted"
                  name="Quizzes Solved"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                  isAnimationActive={true}
                  animationDuration={1500}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* --- RADIAL SUBJECT MASTERY & DIFFICULTY DISTRIBUTION --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RADIAL GAUGES */}
        <div className="lg:col-span-2 p-6 bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 shadow-lg backdrop-blur-md">
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
            <PieIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            Subject Mastery Radial Indicators
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {data.subjectMastery.map((sub, idx) => (
              <RadialProgressRing
                key={idx}
                title={sub.subject}
                percentage={sub.masteryPercentage}
                color={sub.color}
              />
            ))}
          </div>
        </div>

        {/* DIFFICULTY PROGRESSION BREAKDOWN */}
        <div className="p-6 bg-white/70 dark:bg-neutral-800/70 rounded-2xl border border-neutral-200/70 dark:border-neutral-700/70 shadow-lg backdrop-blur-md flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Difficulty Level Breakdown
            </h3>
            <div className="space-y-4">
              {data.difficultyDistribution.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-neutral-700 dark:text-neutral-300">{item.level}</span>
                    <span className="font-mono text-neutral-500">{item.count} solved ({item.percentage}%)</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-2.5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        item.level === 'Easy'
                          ? 'bg-emerald-500'
                          : item.level === 'Medium'
                          ? 'bg-amber-500'
                          : 'bg-red-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 1.2, delay: idx * 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveDashboard;
