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
import { FEEDBACK_CATEGORIES } from './interviewCoachTypes';

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

const ScoreTrendChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Score Progression</h3>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="dateLabel" tick={{ fontSize: 10, fill: '#9ca3af' }} interval="preserveStartEnd" />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target', fill: '#10b981', fontSize: 10 }} />
        <Area type="monotone" dataKey="overallScore" name="Score" stroke="#6366f1" fill="url(#scoreGradient)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

const SkillRadarChart = ({ skills }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Skill Assessment</h3>
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={skills}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="skill" tick={{ fontSize: 10, fill: '#6b7280' }} />
        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
        <Radar name="Your Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
        <Radar name="Benchmark" dataKey="benchmark" stroke="#ec4899" fill="#ec4899" fillOpacity={0.1} strokeWidth={1.5} strokeDasharray="5 5" />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        <Tooltip content={<CustomTooltip />} />
      </RadarChart>
    </ResponsiveContainer>
  </motion.div>
);

const CategoryPerformanceChart = ({ categories }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Performance by Category</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={categories}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} angle={-20} textAnchor="end" height={60} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="avgScore" name="Avg Score" fill="#6366f1" radius={[6, 6, 0, 0]} />
        <Bar dataKey="bestScore" name="Best Score" fill="#10b981" radius={[6, 6, 0, 0]} opacity={0.6} />
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

const CategoryTrendChart = ({ categories }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Category Trends</h3>
    <ResponsiveContainer width="100%" height={280}>
      <LineChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="idx" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        {categories.slice(0, 4).map((cat, idx) => (
          <Line
            key={cat.id}
            type="monotone"
            data={cat.recentScores.map((score, i) => ({ idx: i + 1, [cat.name]: score }))}
            dataKey={cat.name}
            name={cat.name}
            stroke={CHART_COLORS[idx]}
            strokeWidth={2}
            dot={false}
          />
        ))}
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </LineChart>
    </ResponsiveContainer>
  </motion.div>
);

const InterviewTypePie = ({ history }) => {
  const typeCounts = {};
  history.forEach(h => {
    const label = h.label || h.interviewType;
    typeCounts[label] = (typeCounts[label] || 0) + 1;
  });
  const data = Object.entries(typeCounts).map(([name, count], idx) => ({
    name, value: count, color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Interview Types Practiced</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
              {data.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {data.map((entry, idx) => (
            <div key={idx} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
              <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
              <span className="ml-auto font-semibold text-gray-900 dark:text-white">{entry.value}</span>
            </div>
          ))}
        </div>
      </div>
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
    </motion.div>
  );
};

const DurationScatterChart = ({ responses }) => {
  const data = responses.map(r => ({
    duration: Math.round(r.duration / 60),
    score: r.score,
    name: r.category,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Time vs Score</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
          <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="score" name="Score" radius={[6, 6, 0, 0]}>
            {data.map((entry, idx) => (
              <Cell key={idx} fill={entry.score >= 80 ? '#10b981' : entry.score >= 60 ? '#f59e0b' : '#ef4444'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export {
  ScoreTrendChart,
  SkillRadarChart,
  CategoryPerformanceChart,
  CategoryTrendChart,
  InterviewTypePie,
  OverallScoreGauge,
  DurationScatterChart,
  CustomTooltip,
};
