import React from 'react';
import { Activity, AlertTriangle, ShieldCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

const RetentionDecayChart = ({
  retentionCurve = [],
  deckHealthIndex = 100,
  highRiskCount = 0,
}) => {
  const healthColor =
    deckHealthIndex >= 75
      ? 'text-emerald-400 border-emerald-500/30'
      : deckHealthIndex >= 50
      ? 'text-amber-400 border-amber-500/30'
      : 'text-rose-400 border-rose-500/30';

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-4">
        <div>
          <h3 className="text-stone-100 font-extrabold text-base font-playfair flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-400" />
            Ebbinghaus Retention Decay Curve & Deck Health
          </h3>
          <p className="text-stone-400 text-xs mt-0.5">
            Predicted memory retention decay over the coming 30 days based on SM-2 stability parameters
          </p>
        </div>

        <div className={`flex items-center gap-3 bg-neutral-950/80 border ${healthColor} px-4 py-2 rounded-2xl shadow-inner`}>
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">Deck Health Index</div>
            <div className="text-lg font-black font-mono text-stone-100">{deckHealthIndex}%</div>
          </div>
        </div>
      </div>

      {highRiskCount > 0 && (
        <div className="flex items-center gap-3 bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3.5 rounded-2xl text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong>Attention:</strong> {highRiskCount} {highRiskCount === 1 ? 'card enters' : 'cards enter'} the High Risk of Forgetting zone (&lt;70% memory retention). Practice reviews soon!
          </span>
        </div>
      )}

      <div className="h-64 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={retentionCurve} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="retentionGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" />
            <XAxis dataKey="day" stroke="#737373" tick={{ fontSize: 11 }} label={{ value: 'Days from Now', position: 'insideBottom', offset: -5, fill: '#737373', fontSize: 10 }} />
            <YAxis domain={[0, 100]} stroke="#737373" tick={{ fontSize: 11 }} unit="%" />
            <Tooltip
              contentStyle={{ backgroundColor: '#171717', borderColor: '#262626', borderRadius: '12px', fontSize: '12px' }}
              labelFormatter={(day) => `Day ${day}`}
              formatter={(value) => [`${value}%`, 'Predicted Retention']}
            />
            <Area type="monotone" dataKey="retention" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#retentionGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RetentionDecayChart;
