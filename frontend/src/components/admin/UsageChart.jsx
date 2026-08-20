import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const UsageChart = ({ data }) => {
  return (
    <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-6 shadow-sm">
      <h3 className="text-lg font-bold font-playfair mb-4 text-[#1F150C] dark:text-[#E1DCC9]">
        Platform Performance Tracing
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorDau" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#d97706" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#d97706" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorAi" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" className="dark:stroke-neutral-800" />
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #e5e5e5',
                borderRadius: '16px',
                fontSize: '12px',
                color: '#1f150c',
              }}
            />
            <Legend verticalAlign="top" height={36} iconType="circle" />
            <Area
              name="Active Users (DAU)"
              type="monotone"
              dataKey="dau"
              stroke="#d97706"
              fillOpacity={1}
              fill="url(#colorDau)"
              strokeWidth={2}
            />
            <Area
              name="AI API Queries"
              type="monotone"
              dataKey="aiRequests"
              stroke="#4f46e5"
              fillOpacity={1}
              fill="url(#colorAi)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default UsageChart;
