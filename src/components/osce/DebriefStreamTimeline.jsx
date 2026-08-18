import React from 'react';
import { Activity, ShieldCheck, CheckCircle2, Video } from 'lucide-react';

const RECENT_DEBRIEF_MARKERS = [
  {
    id: 'deb-1',
    timestampMMSS: '01:45',
    actionObserved: 'Epinephrine 0.3mg IM Administered',
    feedbackType: 'EXCELLENT_COMMENDATION',
    debriefComment: 'Ideal choice for anaphylaxis airway compromise. Speed: 45s.',
  },
  {
    id: 'deb-2',
    timestampMMSS: '04:12',
    actionObserved: 'SBAR Escalation to Physician',
    feedbackType: 'COMPETENT_HANDOFF',
    debriefComment: 'Clear Situation & Background delivery. Structured recommendation.',
  },
  {
    id: 'deb-3',
    timestampMMSS: '07:30',
    actionObserved: 'Post-Event Debriefing & Reflection',
    feedbackType: 'FACILITATOR_REVIEW',
    debriefComment: 'Self-identified 3-minute delay in secondary pediatric nebulizer.',
  },
];

export default function DebriefStreamTimeline() {
  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 md:p-8 backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-400" /> Automated Video Timestamp Debrief Stream
          </h3>
          <p className="text-slate-400 text-xs mt-1">Synchronized video marker analysis, clinical checklist milestone tracking, and AI peer debriefing summaries.</p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800 text-xs text-teal-300 font-semibold font-mono">
          <Video className="w-4 h-4 text-teal-400" /> Video Sync Active
        </div>
      </div>

      <div className="space-y-4">
        {RECENT_DEBRIEF_MARKERS.map((marker) => (
          <div
            key={marker.id}
            className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-5 hover:border-teal-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-teal-500/10 text-teal-400 text-[11px] font-mono px-2 py-0.5 rounded border border-teal-500/20 font-bold">
                  {marker.timestampMMSS}
                </span>
                <span className="text-slate-500 text-xs font-mono">{marker.feedbackType}</span>
              </div>
              <h4 className="text-base font-bold text-slate-100">{marker.actionObserved}</h4>
              <div className="text-xs text-slate-400 mt-1 font-mono">
                Feedback: <span className="text-cyan-300 font-medium">{marker.debriefComment}</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-4 h-4" /> Marker Bookmarked
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
