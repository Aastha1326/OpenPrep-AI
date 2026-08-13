import React, { useState, useEffect } from 'react';
import { Calendar, AlertTriangle, Check, Sparkles, X, Loader2 } from 'lucide-react';
import API from '../../services/api';

export default function RescheduleModal({ isOpen, onClose, onApplied }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      API.post('/planner/reschedule')
        .then((res) => {
          setData(res.data);
          setLoading(false);
        })
        .catch(() => {
          setError('Failed to analyze overdue tasks.');
          setLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-inter text-[#1F150C] dark:text-[#E1DCC9]">
      <div className="bg-[#FFFBE9] dark:bg-[#16120E] border border-[#CEAB93]/60 dark:border-[#412D15] rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold font-playfair flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" /> Adaptive Task Auto-Rescheduling
          </h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800 dark:hover:text-white font-bold"><X className="w-5 h-5" /></button>
        </div>

        <p className="text-xs text-[#8C6A53] dark:text-[#C4BA9D] mb-6">
          We detected overdue study tasks. Our buffer-aware algorithm has redistributed your workload across available study days while respecting your max daily hour thresholds.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-300 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-2" />
            <p className="text-xs font-medium">Computing optimal schedule redistribution...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/30 text-center">
                <span className="text-[10px] uppercase font-bold text-[#8C6A53] dark:text-[#C4BA9D]">Days to Exam</span>
                <div className="text-xl font-bold font-playfair text-amber-600 mt-0.5">{data?.daysRemaining || 0} Days</div>
              </div>
              <div className="p-3 bg-white dark:bg-[#251D17] rounded-2xl border border-[#CEAB93]/30 text-center">
                <span className="text-[10px] uppercase font-bold text-[#8C6A53] dark:text-[#C4BA9D]">Max Daily Limit</span>
                <div className="text-xl font-bold font-playfair text-amber-600 mt-0.5">{data?.maxDailyHours || 4} Hours</div>
              </div>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {data?.rescheduledTasks?.map((item, idx) => (
                <div key={idx} className="p-3 bg-white dark:bg-[#251D17] rounded-xl border border-[#CEAB93]/30 flex items-center justify-between text-xs">
                  <span className="font-semibold truncate max-w-xs">Task ID: {item.taskId}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-amber-600 font-mono font-bold">{item.allocatedHours} hrs</span>
                    <span className="px-2 py-0.5 bg-black/5 dark:bg-white/10 rounded font-mono text-[11px]">{item.newDueDate}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button onClick={onClose} className="px-4 py-2.5 text-xs text-neutral-500 hover:underline font-semibold">Cancel</button>
              <button
                onClick={() => { if (onApplied) onApplied(); onClose(); }}
                className="px-5 py-2.5 rounded-xl btn-primary-theme font-bold text-xs shadow cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" /> Confirm & Apply Schedule
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
