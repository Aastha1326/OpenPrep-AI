import React, { useMemo } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

/**
 * Enterprise Level React Component: EngagementChart
 * 
 * Uses Recharts to construct a complex time-series visualization for 
 * platform interaction telemetry. Shows Area distribution over a specified time
 * range with native responsive constraints.
 * 
 * @param {Object} props
 * @param {Array} props.data - Extracted from `timeSeries` in AnalyticsService
 * @param {string} props.color - Base primary theme color (hex or var)
 */
const EngagementChart = ({ data, color = '#3b82f6', height = 350 }) => {
    // Format dates securely for optimal tooltip and tick display
    const formattedData = useMemo(() => {
        if (!data || !data.length) return [];

        return data.map(item => {
            const dateObj = new Date(item.date);
            return {
                ...item,
                displayDate: `${dateObj.toLocaleString('default', { month: 'short' })} ${dateObj.getDate()}`
            };
        });
    }, [data]);

    // Robust custom tooltip to provide professional analytics readability
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-slate-900 border border-slate-700 p-4 rounded-xl shadow-2xl backdrop-blur-md bg-opacity-90">
                    <p className="text-slate-300 font-semibold mb-2">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={`tooltip-item-${index}`} className="flex items-center justify-between gap-4 py-1">
                            <div className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded-full shadow-sm"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-slate-400 font-medium text-sm capitalize">
                                    {entry.name.replace(/([A-Z])/g, ' $1').trim()}
                                </span>
                            </div>
                            <span className="text-white font-bold text-sm">
                                {entry.value.toLocaleString()}
                            </span>
                        </div>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (!formattedData || formattedData.length === 0) {
        return (
            <div
                className="flex items-center justify-center w-full bg-slate-50 border border-slate-100 rounded-2xl dark:bg-slate-900 border-none relative overflow-hidden group"
                style={{ height }}
            >
                {/* Empty State Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-[shimmer_2s_infinite] dark:via-white/5 mix-blend-overlay"></div>
                <div className="flex flex-col items-center gap-2 text-slate-400">
                    <svg className="w-10 h-10 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold tracking-wide">Insufficient Data Array</span>
                    <span className="text-xs opacity-75">Connect upstream API to populate timeframe.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full relative h-[450px] p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-all duration-300 hover:shadow-md">
            {/* Chart Header Meta */}
            <div className="absolute top-6 left-6 z-10 pointer-events-none">
                <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    Engagement Velocity
                    <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                    </span>
                </h4>
                <p className="text-xs text-slate-500 font-medium">Daily Active Instances & Telemetry Hooks</p>
            </div>

            <div className="h-full w-full pt-14">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={formattedData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                    >
                        {/* Defs block to create soft SVGs gradients for professional feel */}
                        <defs>
                            <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                                <stop offset="95%" stopColor={color} stopOpacity={0.0} />
                            </linearGradient>
                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                            </linearGradient>
                        </defs>

                        <CartesianGrid
                            strokeDasharray="4 4"
                            vertical={false}
                            stroke="#e2e8f0"
                            strokeOpacity={0.4}
                        />

                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tickMargin={15}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            minTickGap={20}
                        />

                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tickMargin={15}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 500 }}
                            tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                        />

                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#94a3b8', strokeWidth: 1, strokeDasharray: '4 4' }} />

                        <Legend
                            verticalAlign="top"
                            align="right"
                            iconType="circle"
                            wrapperStyle={{ paddingBottom: '20px', fontSize: '13px', fontWeight: 600, color: '#475569' }}
                        />

                        <Area
                            type="monotone"
                            dataKey="totalEvents"
                            name="Total Events"
                            stroke={color}
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorEvents)"
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />

                        <Area
                            type="monotone"
                            dataKey="uniqueUsers"
                            name="Unique Active Profiles"
                            stroke="#10b981"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorUsers)"
                            activeDot={{ r: 6, strokeWidth: 0 }}
                            animationDuration={1500}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default EngagementChart;
