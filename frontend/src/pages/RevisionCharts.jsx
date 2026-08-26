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
} from 'recharts';
import { SUBJECTS, SPACED_REPETITION_LEVELS } from './revisionTypes';

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

const RetentionTrendChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Retention Rate Over Time</h3>
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={80} stroke="#10b981" strokeDasharray="5 5" label={{ value: 'Target', fill: '#10b981', fontSize: 10 }} />
        <Area type="monotone" dataKey="retention" name="Retention %" stroke="#10b981" fill="url(#retGrad)" strokeWidth={2.5} />
        <Area type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#6366f1" fill="none" strokeWidth={1.5} strokeDasharray="5 5" />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

const ForgettingCurveChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.1, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Forgetting Curve</h3>
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="forgetGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine y={50} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: '50% threshold', fill: '#f59e0b', fontSize: 10 }} />
        <Area type="monotone" dataKey="retention" name="Retention %" stroke="#ef4444" fill="url(#forgetGrad)" strokeWidth={2.5} />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

const SubjectRetentionBar = ({ subjects }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Subject Retention Rates</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={subjects} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
        <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} width={120} />
        <Tooltip content={<CustomTooltip />} />
        <ReferenceLine x={80} stroke="#10b981" strokeDasharray="5 5" />
        <Bar dataKey="retentionRate" name="Retention %" radius={[0, 6, 6, 0]}>
          {subjects.map((entry, idx) => (
            <Cell key={idx} fill={entry.retentionRate >= 80 ? '#22c55e' : entry.retentionRate >= 60 ? '#f59e0b' : '#ef4444'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

const CardDistributionPie = ({ data }) => {
  const pieData = [
    { name: 'New', value: data.reduce((s, d) => s + d.newCards, 0), color: SPACED_REPETITION_LEVELS.new.color },
    { name: 'Young', value: data.reduce((s, d) => s + d.youngCards, 0), color: SPACED_REPETITION_LEVELS.young.color },
    { name: 'Mature', value: data.reduce((s, d) => s + d.matureCards, 0), color: SPACED_REPETITION_LEVELS.mature.color },
    { name: 'Mastered', value: data.reduce((s, d) => s + d.masteredCards, 0), color: SPACED_REPETITION_LEVELS.mastered.color },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Card Distribution</h3>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width="50%" height={200}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
              {pieData.map((entry, idx) => (
                <Cell key={idx} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-2">
          {pieData.map((entry, idx) => (
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

const ReviewsCompletedChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.4, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Reviews & Accuracy</h3>
    <ResponsiveContainer width="100%" height={260}>
      <ComposedChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="cardsReviewed" name="Cards Reviewed" fill="#6366f1" radius={[4, 4, 0, 0]} opacity={0.7} />
        <Bar dataKey="newCards" name="New Cards" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.5} />
        <Line type="monotone" dataKey="accuracy" name="Accuracy %" stroke="#10b981" strokeWidth={2} dot={false} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </ComposedChart>
    </ResponsiveContainer>
  </motion.div>
);

const SubjectRadarChart = ({ subjects }) => {
  const data = subjects.slice(0, 6).map(s => ({
    subject: s.icon + ' ' + s.name.split(' ')[0],
    retention: s.retentionRate,
    mastered: s.masteredPercent,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Subject Skills Radar</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
          <Radar name="Retention" dataKey="retention" stroke="#10b981" fill="#10b981" fillOpacity={0.2} />
          <Radar name="Mastered" dataKey="mastered" stroke="#6366f1" fill="#6366f1" fillOpacity={0.1} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip content={<CustomTooltip />} />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const DailyReviewHeatmap = ({ schedule }) => {
  const hourData = Array.from({ length: 24 }, (_, i) => ({
    hour: `${String(i).padStart(2, '0')}:00`,
    reviews: schedule.filter(s => s.hour === i).length,
  })).filter(h => h.reviews > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Reviews by Time of Day</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={hourData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
          <XAxis dataKey="hour" tick={{ fontSize: 9, fill: '#9ca3af' }} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="reviews" name="Reviews" radius={[4, 4, 0, 0]}>
            {hourData.map((_, idx) => (
              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export {
  RetentionTrendChart,
  ForgettingCurveChart,
  SubjectRetentionBar,
  CardDistributionPie,
  ReviewsCompletedChart,
  SubjectRadarChart,
  DailyReviewHeatmap,
  CustomTooltip,
};
