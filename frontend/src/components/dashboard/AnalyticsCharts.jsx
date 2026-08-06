import { AlertCircle, Lightbulb } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip as LineTooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import VintagePaper from './VintagePaper';

const Shimmer = ({ className = '' }) => (
  <div className={`animate-pulse bg-neutral-300/60 rounded ${className}`} />
);

const EmptyState = ({ icon: Icon = Lightbulb, message = 'No data yet' }) => (
  <div className="flex flex-col items-center justify-center py-8 text-neutral-500">
    <Icon className="w-8 h-8 mb-2 opacity-40" />
    <p className="text-sm italic">{message}</p>
  </div>
);

const AnalyticsCharts = ({
  chartData,
  radarData,
  loadingStats,
  errorStats,
  loadingSubjects,
  errorSubjects,
}) => {
  return (
    <div className="bg-wood-desk rounded-lg shadow-inner border border-black/50 p-6 relative overflow-hidden grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="absolute inset-0 shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] pointer-events-none" />

      {/* Line Chart — Weekly Performance */}
      <VintagePaper animate={false} className="w-full h-full p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl font-bold font-playfair text-neutral-900 mb-6 border-b border-neutral-400 pb-2">
          Weekly Performance
        </h2>
        <div className="h-64 w-full" style={{ minHeight: '250px', minWidth: '100%' }}>
          {loadingStats ? (
            <div className="flex items-center justify-center h-full">
              <Shimmer className="w-full h-48" />
            </div>
          ) : errorStats ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">Could not load chart</p>
            </div>
          ) : chartData.length === 0 ? (
            <EmptyState message="No weekly data yet — start studying to see your progress!" />
          ) : (
            <ResponsiveContainer width="99%" height="100%" minHeight={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d4" />
                <XAxis dataKey="name" stroke="#525252" tick={{ fontFamily: 'Inter' }} />
                <YAxis stroke="#525252" tick={{ fontFamily: 'Inter' }} domain={[0, 100]} />
                <LineTooltip
                  contentStyle={{ backgroundColor: '#F5E6CA', border: '1px solid #8B4513', borderRadius: '4px' }}
                  itemStyle={{ color: '#3E2723', fontWeight: 'bold' }}
                />
                <Line
                  type="monotone" dataKey="score" stroke="#8B4513" strokeWidth={3}
                  dot={{ fill: '#8B4513', r: 5 }} activeDot={{ r: 8, fill: '#D4AF37' }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </VintagePaper>

      {/* Radar Chart — Subject Mastery */}
      <VintagePaper animate={false} className="w-full h-full p-6 shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <h2 className="text-2xl font-bold font-playfair text-neutral-900 mb-6 border-b border-neutral-400 pb-2">
          Subject Mastery
        </h2>
        <div className="h-64 w-full" style={{ minHeight: '250px', minWidth: '100%' }}>
          {loadingSubjects ? (
            <div className="flex items-center justify-center h-full">
              <Shimmer className="w-full h-48" />
            </div>
          ) : errorSubjects ? (
            <div className="flex flex-col items-center justify-center h-full text-neutral-500">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p className="text-sm">Could not load subjects</p>
            </div>
          ) : radarData.length === 0 ? (
            <EmptyState message="Add subjects to see your mastery breakdown" />
          ) : (
            <ResponsiveContainer width="99%" height="100%" minHeight={250}>
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                <PolarGrid stroke="#d4d4d4" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fontFamily: 'Inter', fill: '#525252', fontSize: 12, fontWeight: 'bold' }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                  name="Mastery" dataKey="A" stroke="#8B4513" strokeWidth={2}
                  fill="#D4AF37" fillOpacity={0.6}
                />
                <LineTooltip
                  contentStyle={{ backgroundColor: '#F5E6CA', border: '1px solid #8B4513', borderRadius: '4px' }}
                  itemStyle={{ color: '#3E2723', fontWeight: 'bold' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </VintagePaper>
    </div>
  );
};

export default AnalyticsCharts;
