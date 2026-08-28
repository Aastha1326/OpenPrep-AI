/**
 * @fileoverview Interactive chart visualizing predicted vs actual retention using Recharts.
 */
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const ForgettingCurveChart = ({ data }) => {
    if (!data || !data.predictedCurve || !data.actualPerformance) {
        return (
            <div className="flex items-center justify-center h-64 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">No analytics data available.</p>
            </div>
        );
    }

    // Merge data for Recharts
    const mergedData = data.predictedCurve.map((pred) => {
        const actual = data.actualPerformance.find((act) => act.days === pred.days);
        return {
            days: pred.days,
            predicted: pred.retention * 100,
            actual: actual ? actual.retention * 100 : null,
        };
    });

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg">
                    <p className="font-semibold text-gray-900 dark:text-white mb-1">Day {label}</p>
                    <p className="text-sm text-red-500">Predicted: {payload[0].value.toFixed(1)}%</p>
                    {payload[1].value && (
                        <p className="text-sm text-green-500">Actual: {payload[1].value.toFixed(1)}%</p>
                    )}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="w-full h-80 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">Memory Retention Analytics</h3>
            <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mergedData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
                    <XAxis
                        dataKey="days"
                        label={{ value: 'Days Since Review', position: 'insideBottomRight', offset: -5, fill: '#6b7280' }}
                        tick={{ fill: '#6b7280' }}
                        className="dark:fill-gray-400"
                    />
                    <YAxis
                        label={{ value: 'Retention (%)', angle: -90, position: 'insideLeft', fill: '#6b7280' }}
                        domain={[0, 100]}
                        tick={{ fill: '#6b7280' }}
                        className="dark:fill-gray-400"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line
                        type="monotone"
                        dataKey="predicted"
                        name="Predicted Retention"
                        stroke="#ef4444"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 4 }}
                    />
                    <Line
                        type="monotone"
                        dataKey="actual"
                        name="Actual Performance"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={{ r: 5, fill: '#10b981' }}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

export default ForgettingCurveChart;
