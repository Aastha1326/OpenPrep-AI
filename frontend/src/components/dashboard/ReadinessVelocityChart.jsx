import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import { Table } from 'lucide-react';

/**
 * ReadinessVelocityChart Component
 * Visualizes historical quiz accuracy velocity and projected score trajectory.
 * Includes accessible tabular fallback view for screen reader users.
 */
export default function ReadinessVelocityChart({ trajectoryPoints = [], targetScore = 85 }) {
  const [showTable, setShowTable] = useState(false);

  if (!trajectoryPoints || trajectoryPoints.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400 text-xs font-medium">
        No trajectory points available to display.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-3 bg-slate-900 border border-slate-700 rounded-xl shadow-xl text-xs space-y-1">
          <p className="font-bold text-slate-200">{data.label}</p>
          {data.historicalScore !== null && data.historicalScore !== undefined && (
            <p className="text-indigo-400 font-semibold">
              Historical Score: <span className="font-mono">{data.historicalScore}%</span>
            </p>
          )}
          {data.projectedScore !== null && data.projectedScore !== undefined && (
            <p className="text-emerald-400 font-semibold">
              Projected Score: <span className="font-mono">{data.projectedScore}%</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-xs font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 bg-indigo-500 rounded-full inline-block" /> Historical Accuracy
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-0.5 border-t-2 border-dashed border-emerald-400 inline-block" /> Projected Trajectory
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowTable(!showTable)}
          aria-expanded={showTable}
          aria-label="Toggle screen reader accessible chart table data"
          className="text-[11px] font-semibold text-slate-400 hover:text-slate-200 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 transition-colors"
        >
          <Table className="w-3 h-3 text-indigo-400" />
          <span>{showTable ? 'View Chart' : 'View Data Table'}</span>
        </button>
      </div>

      {showTable ? (
        <div className="overflow-x-auto p-3 bg-slate-950 border border-slate-800 rounded-xl">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="pb-2">Milestone / Date</th>
                <th className="pb-2">Historical Score</th>
                <th className="pb-2">Projected Score</th>
              </tr>
            </thead>
            <tbody>
              {trajectoryPoints.map((pt, idx) => (
                <tr key={idx} className="border-b border-slate-900/60">
                  <td className="py-2 text-slate-200">{pt.label}</td>
                  <td className="py-2 text-indigo-400">{pt.historicalScore !== null ? `${pt.historicalScore}%` : '-'}</td>
                  <td className="py-2 text-emerald-400">{pt.projectedScore !== null ? `${pt.projectedScore}%` : '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="w-full h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trajectoryPoints} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
              <Tooltip content={<CustomTooltip />} />

              {/* Target Goal Line */}
              <ReferenceLine
                y={targetScore}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: `Target Goal (${targetScore}%)`, fill: '#f59e0b', fontSize: 10, position: 'insideTopRight' }}
              />

              {/* Historical Score Line */}
              <Line
                type="monotone"
                dataKey="historicalScore"
                stroke="#6366f1"
                strokeWidth={3}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
                connectNulls={false}
              />

              {/* Projected Trajectory Line */}
              <Line
                type="monotone"
                dataKey="projectedScore"
                stroke="#10b981"
                strokeWidth={3}
                strokeDasharray="6 6"
                dot={{ r: 4, fill: '#10b981' }}
                activeDot={{ r: 6 }}
                connectNulls={true}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
