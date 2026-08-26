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
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { getMasteryColor } from './knowledgeTypes';

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

const MasteryDistributionChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Mastery Distribution</h3>
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="count" name="Concepts" radius={[6, 6, 0, 0]}>
          {data.map((entry, idx) => (
            <Cell key={idx} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  </motion.div>
);

const SubjectMasteryRadar = ({ subjects }) => {
  const data = subjects.map(s => ({
    subject: s.icon + ' ' + s.name.split(' ')[0],
    mastery: s.avgMastery,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Subject Mastery Radar</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RadarChart data={data}>
          <PolarGrid stroke="#e5e7eb" />
          <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#6b7280' }} />
          <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: '#9ca3af' }} />
          <Radar name="Mastery" dataKey="mastery" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
          <ReferenceLine r={80} stroke="#10b981" strokeDasharray="5 5" />
        </RadarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const WeeklyProgressChart = ({ data }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.2, duration: 0.5 }}
    className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
  >
    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Weekly Study Progress</h3>
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="wkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
        <Tooltip content={<CustomTooltip />} />
        <Area type="monotone" dataKey="nodesStudied" name="Nodes Studied" stroke="#6366f1" fill="url(#wkGrad)" strokeWidth={2} />
        <Line type="monotone" dataKey="avgMasteryChange" name="Avg Mastery Δ" stroke="#10b981" strokeWidth={2} dot={false} />
        <Legend wrapperStyle={{ fontSize: 11 }} />
      </AreaChart>
    </ResponsiveContainer>
  </motion.div>
);

const NodeTypePieChart = ({ nodes }) => {
  const typeCounts = {};
  nodes.forEach(n => {
    const label = n.typeConfig?.label || n.type;
    typeCounts[label] = (typeCounts[label] || 0) + 1;
  });
  const data = Object.entries(typeCounts).map(([name, count], idx) => ({
    name, value: count, color: CHART_COLORS[idx % CHART_COLORS.length],
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Node Type Breakdown</h3>
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

const DependencyTypeBarChart = ({ edges }) => {
  const typeCounts = {};
  edges.forEach(e => {
    const label = e.typeConfig?.label || e.type;
    typeCounts[label] = (typeCounts[label] || 0) + 1;
  });
  const data = Object.entries(typeCounts).map(([name, count]) => ({ name, count }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Dependency Types</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
          <XAxis type="number" tick={{ fontSize: 10, fill: '#9ca3af' }} />
          <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#6b7280' }} width={100} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="count" name="Edges" radius={[0, 6, 6, 0]}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

const ImportanceVsMasteryScatter = ({ nodes }) => {
  const data = nodes.map(n => ({
    name: n.label,
    importance: n.importance,
    mastery: n.mastery,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="glass-card rounded-2xl p-5 border border-white/20 dark:border-white/5"
    >
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Importance vs Mastery</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data.slice(0, 20)}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" strokeOpacity={0.5} />
          <XAxis dataKey="name" tick={{ fontSize: 8, fill: '#9ca3af' }} angle={-30} textAnchor="end" height={60} />
          <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} domain={[0, 100]} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={60} stroke="#f59e0b" strokeDasharray="5 5" />
          <Bar dataKey="importance" name="Importance (×10)" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.6} />
          <Bar dataKey="mastery" name="Mastery %" radius={[4, 4, 0, 0]}>
            {data.slice(0, 20).map((entry, idx) => (
              <Cell key={idx} fill={getMasteryColor(entry.mastery)} />
            ))}
          </Bar>
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </BarChart>
      </ResponsiveContainer>
    </motion.div>
  );
};

export {
  MasteryDistributionChart,
  SubjectMasteryRadar,
  WeeklyProgressChart,
  NodeTypePieChart,
  DependencyTypeBarChart,
  ImportanceVsMasteryScatter,
  CustomTooltip,
};
