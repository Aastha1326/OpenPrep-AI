/**
 * @fileoverview Recharts-based radar chart for visualizing skill proficiency gaps.
 */
import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const SkillRadarChart = ({ skills }) => {
    // Transform skills data for Recharts
    const chartData = skills.slice(0, 8).map(skill => ({
        subject: skill.name,
        Current: skill.currentProficiency,
        Required: skill.requiredProficiency,
        fullMark: 5,
    }));

    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{payload[0].payload.subject}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Current: {payload[0].value}/5</p>
                    <p className="text-sm text-red-500 dark:text-red-400">Required: {payload[1].value}/5</p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} className="dark:fill-gray-400" />
                    <PolarRadiusAxis angle={30} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                        name="Current Proficiency"
                        dataKey="Current"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.3}
                    />
                    <Radar
                        name="Required Proficiency"
                        dataKey="Required"
                        stroke="#ef4444"
                        fill="#ef4444"
                        fillOpacity={0.1}
                        strokeDasharray="3 3"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default SkillRadarChart;
