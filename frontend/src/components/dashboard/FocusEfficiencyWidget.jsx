import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Gauge, RefreshCw } from 'lucide-react';
import API from '../../services/api';
import VintagePaper from './VintagePaper';

const FocusEfficiencyWidget = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await API.get('/progress/focus-session/weekly');
        setData(res.data?.data || []);
      } catch (err) {
        console.error('Failed to fetch focus efficiency:', err);
        setError('Could not load focus efficiency data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <VintagePaper className="w-full shadow-[0_10px_25px_rgba(0,0,0,0.5)]">
      <h2 className="text-xl font-bold font-playfair text-neutral-900 flex items-center gap-2 border-b border-neutral-400 pb-3 mb-4">
        <Gauge className="w-5 h-5 text-amber-700" /> Weekly Focus Efficiency
      </h2>

      {loading ? (
        <div className="py-8 text-center text-xs text-neutral-500 italic flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-800" /> Loading focus data...
        </div>
      ) : error ? (
        <div className="py-4 text-center text-xs text-red-600 font-medium">{error}</div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data}>
            <XAxis dataKey="day" tick={{ fontFamily: 'Inter', fontSize: 12 }} />
            <YAxis domain={[0, 100]} tick={{ fontFamily: 'Inter', fontSize: 12 }} />
            <Tooltip formatter={(value) => [`${value}%`, 'Focus Efficiency']} />
            <Bar dataKey="focusEfficiency" fill="#D4AF37" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </VintagePaper>
  );
};

export default FocusEfficiencyWidget;