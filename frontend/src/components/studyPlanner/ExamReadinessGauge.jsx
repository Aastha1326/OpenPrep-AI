import React from 'react';
import { Target, Lightbulb, CheckCircle2, AlertTriangle } from 'lucide-react';

const ExamReadinessGauge = ({
  readinessScore = 72,
  syllabusCoverage = 65,
  quizAccuracy = 72,
  memoryRetention = 78,
  studyVelocity = 60,
  recommendations = [],
}) => {
  const getGaugeColor = (score) => {
    if (score >= 75) return 'stroke-emerald-400 text-emerald-400';
    if (score >= 50) return 'stroke-amber-400 text-amber-400';
    return 'stroke-rose-400 text-rose-400';
  };

  const gaugeColor = getGaugeColor(readinessScore);
  const circumference = 2 * Math.PI * 42; // radius 42
  const strokeDashoffset = circumference - (readinessScore / 100) * circumference;

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
        <h3 className="text-stone-100 font-extrabold text-base font-playfair flex items-center gap-2">
          <Target className="w-5 h-5 text-indigo-400" />
          AI Exam Readiness Dial & Recommendations
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Gauge Dial */}
        <div className="flex flex-col items-center justify-center p-4 bg-neutral-950/60 rounded-2xl border border-neutral-800 relative">
          <svg className="w-36 h-36 transform -rotate-90">
            <circle cx="72" cy="72" r="42" stroke="#262626" strokeWidth="10" fill="transparent" />
            <circle
              cx="72"
              cy="72"
              r="42"
              className={`transition-all duration-1000 ease-out ${gaugeColor}`}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-black font-mono text-stone-100">{readinessScore}%</span>
            <span className="text-[10px] text-stone-400 uppercase font-bold tracking-wider">Readiness Index</span>
          </div>
        </div>

        {/* Sub-Metric Cards */}
        <div className="md:col-span-2 grid grid-cols-2 gap-3">
          <div className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-2xl">
            <div className="text-[10px] text-stone-400 font-bold uppercase">Syllabus Coverage</div>
            <div className="text-xl font-bold font-mono text-indigo-400 mt-1">{syllabusCoverage}%</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-2xl">
            <div className="text-[10px] text-stone-400 font-bold uppercase">Quiz Accuracy</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">{quizAccuracy}%</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-2xl">
            <div className="text-[10px] text-stone-400 font-bold uppercase">Memory Retention</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">{memoryRetention}%</div>
          </div>
          <div className="bg-neutral-950/60 border border-neutral-800 p-3.5 rounded-2xl">
            <div className="text-[10px] text-stone-400 font-bold uppercase">Study Velocity</div>
            <div className="text-xl font-bold font-mono text-purple-400 mt-1">{studyVelocity}%</div>
          </div>
        </div>
      </div>

      {/* Actionable Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2 pt-2">
          <h4 className="text-stone-300 font-bold text-xs flex items-center gap-1.5">
            <Lightbulb className="w-4 h-4 text-amber-400" />
            AI Actionable Recommendations
          </h4>
          <div className="space-y-2">
            {recommendations.map((rec, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  rec.type === 'warning'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                    : rec.type === 'success'
                    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                    : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                }`}
              >
                {rec.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <strong className="block font-bold mb-0.5">{rec.title}</strong>
                  <span>{rec.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamReadinessGauge;
