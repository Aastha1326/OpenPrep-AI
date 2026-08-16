import React, { useState } from 'react';
import { downloadStudySummary } from '../../services/reportService';
import { Download, Loader } from 'lucide-react';

const StudyReportPDF = () => {
  const [range, setRange] = useState('30d');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDownload = async () => {
    setLoading(true);
    setError('');
    try {
      await downloadStudySummary(range);
    } catch (err) {
      setError('Failed to download PDF.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select 
        value={range} 
        onChange={(e) => setRange(e.target.value)}
        className="bg-neutral-800 text-yellow-400 border border-yellow-700/50 rounded px-2 py-1.5 text-xs font-semibold focus:outline-none"
      >
        <option value="7d">Last 7 Days</option>
        <option value="30d">Last 30 Days</option>
        <option value="all">Full Term</option>
      </select>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="px-3 py-1.5 bg-gradient-to-r from-yellow-700 to-yellow-600 hover:from-yellow-600 hover:to-yellow-500 text-yellow-50 rounded text-xs font-semibold flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
        title="Export report as PDF"
      >
        {loading ? <Loader className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
        Export PDF
      </button>
      {error && <span className="text-red-500 text-xs ml-2">{error}</span>}
    </div>
  );
};

export default StudyReportPDF;
