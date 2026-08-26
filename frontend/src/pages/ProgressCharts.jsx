import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
} from 'recharts';
import { WEEKDAY_LABELS, SUBJECTS } from './progressTypes';

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#06b6d4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 shadow-xl border border-gray-200 dark:border-gray-700 text-sm">
      <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, idx) => (
        <p key={idx} className="text-gray-600 dark:text-gray-300">
          <span className="inline-block w-2.5 h-2.5 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold">{typeof entry.value === 'number' ? entry.value.toFixed(1) : entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const StudyTimeAreaChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Study Hours Over Time</h3>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data.slice(-30)}>
        <defs>
          <linearGradient id="studyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="totalHours" name="Hours" stroke="#6366f1" fill="url(#studyGradient)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

const AccuracyTrendChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Quiz Accuracy Trend</h3>
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data.slice(-30)}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target', fill: '#10b981', fontSize: 10 }} />
        <Bar dataKey="quizCount" name="Quizzes" fill="#8b5cf6" fillOpacity={0.3} radius={[4, 4, 0, 0]} />
        <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#f59e0b" strokeWidth={2.5} dot={false} />
      </ComposedChart>
    </ResponsiveContainer>
  </motion.div>
);

const SubjectBreakdownPie = ({ subjects }) => {
  const data = subjects.map(s => ({ name: s.name, value: s.totalHours, icon: s.icon, color: s.color }));
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Subject Time Distribution</h3>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width="55%" height={220}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={85}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-700 dark:text-gray-300 truncate">{entry.icon} {entry.name}</span>
              <span className="ml-auto font-semibold text-gray-900 dark:text-white">{entry.value}h</span>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const WeeklyBarChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Weekly Study Hours</h3>
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="totalHours" name="Hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
        <Bar dataKey="quizzesCompleted" name="Quizzes" fill="#8b5cf6" radius={[6, 6, 0, 0]} opacity={0.6} />
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

const SubjectRadarChart = ({ subjects }) => {
  const data = subjects.map(s => ({
    subject: s.icon + ' ' + s.name.split(' ')[0],
    accuracy: s.avgAccuracy,
    completion: s.completionPercent,
    practice: Math.min(s.problemsSolved, 100),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Subject Skills Radar</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
          <Radar name="Accuracy" dataKey="accuracy" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} />
          <Radar name="Completion" dataKey="completion" stroke="#10b981" fill="#10b981" fillOpacity={0.1} />
          <Radar name="Practice" dataKey="practice" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.1} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const ActivityMixPie = ({ data }) => {
  const typeCounts = {};
  data.forEach(a => {
    typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
  });
  const pieData = Object.entries(typeCounts).map(([type, count], idx) => ({
    name: type.replace(/_/g, ' '),
    value: count,
    color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Activity Mix</h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
            {pieData.map((entry, idx) => (
              <Cell key={idx} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const DayOfWeekBarChart = ({ data }) => {
  const dayMap = {};
  WEEKDAY_LABELS.forEach(d => { dayMap[d] = 0; });
  data.forEach(d => {
    if (dayMap[d.dayLabel] !== undefined) dayMap[d.dayLabel] += d.totalHours;
  });
  const chartData = WEEKDAY_LABELS.map(day => ({ day, hours: parseFloat(dayMap[day].toFixed(1)) }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Study by Day of Week</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
          <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="hours" name="Total Hours" radius={[6, 6, 0, 0]}>
            {chartData.map((entry, idx) => (
              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const MilestonesTimelineChart = ({ milestones }) => {
  const typeCounts = {};
  milestones.forEach(m => {
    const label = m.label || m.type;
    typeCounts[label] = (typeCounts[label] || 0) + 1;
  });
  const chartData = Object.entries(typeCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Milestones by Category</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} width={130} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Count" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const LeaderboardChart = ({ leaderboard }) => {
  const data = leaderboard.slice(0, 10).map(e => ({
    name: e.name.split(' ')[0],
    points: e.totalPoints,
    accuracy: e.avgAccuracy,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.8, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Top Performers</h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: '#6b7280' }} width={80} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="points" name="Points" fill="#6366f1" radius={[0, 6, 6, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const OverallScoreGauge = ({ score, label = 'Overall Score' }) => {
  const data = [{ name: label, value: score, fill: score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444' }];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5 flex flex-col items-center"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">{label}</h3>
      <ResponsiveContainer width="100%" height={160}>
        <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={14} data={data} startAngle={180} endAngle={0}>
          <RadialBar dataKey="value" cornerRadius={10} background={{ fill: '#e5e7eb' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <p className="text-3xl font-black text-gray-900 dark:text-white -mt-4">{score}%</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Estimated exam readiness</p>
    </motion.div>
  );
};

export {
  StudyTimeAreaChart,
  AccuracyTrendChart,
  SubjectBreakdownPie,
  WeeklyBarChart,
  SubjectRadarChart,
  ActivityMixPie,
  DayOfWeekBarChart,
  MilestonesTimelineChart,
  LeaderboardChart,
  OverallScoreGauge,
  CustomTooltip,
};
