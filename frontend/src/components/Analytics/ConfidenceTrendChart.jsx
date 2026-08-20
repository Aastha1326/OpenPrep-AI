/**
 * @fileoverview Recharts line chart for visualizing confidence score progression.
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area } from 'recharts';

const ConfidenceTrendChart = ({ data }) => {
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">{label}</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">
                        Confidence: <span className="font-bold">{payload[0].value}/10</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-72 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis
                        dataKey="date"
                        tick={{ fill: '#6b7280', fontSize: 12 }}
                        className="dark:fill-gray-400"
                        tickFormatter={(value) => value.slice(5)} // Show MM-DD
                    />
                    <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 12 }} className="dark:fill-gray-400" />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                        type="monotone"
                        dataKey="confidenceScore"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        activeDot={{ r: 6, fill: '#2563eb' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ConfidenceTrendChart;
