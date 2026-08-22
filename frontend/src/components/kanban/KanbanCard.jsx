import React from 'react';
import { Briefcase, MapPin, DollarSign, ExternalLink, MessageSquare, Clock, AlignLeft } from 'lucide-react';

/**
 * KanbanCard - A highly interactive, beautiful Glassmorphism React Component.
 * Supports native HTML5 Drag and Drop spec via external wrapper, but visually styled
 * for premium enterprise engagement.
 * 
 * @param {Object} props
 * @param {Object} props.application - Full populated JobApplication object from KanbanBoardService
 * @param {Function} props.onSelect - Trigger to open Right Side Modal panel
 * @param {boolean} props.isDragging - Toggle opacity if currently held in flight
 */
const KanbanCard = ({ application, onSelect, isDragging }) => {
    // Graceful degradation for mocking data structure
    const opp = application?.opportunity || {};
    const companyStr = opp?.company?.name || opp?.externalCompanyString || 'Confidential Company';
    const roleStr = opp?.roleTitle || 'Undisclosed Title';

    // Salary parsing heuristic
    const formattedSalary = opp?.salaryRangeMin
        ? `$${(opp?.salaryRangeMin / 1000).toFixed(0)}k - $${(opp?.salaryRangeMax / 1000).toFixed(0)}k`
        : 'Unknown Range';

    return (
        <div
            onClick={() => onSelect && onSelect(application)}
            className={`
        relative w-full cursor-grab active:cursor-grabbing p-4 mb-3 
        bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl
        shadow-sm hover:shadow-md transition-all duration-200 group overflow-hidden
        ${isDragging ? 'opacity-40 scale-95 shadow-xl rotate-1' : 'opacity-100'}
      `}
        >
            {/* Decorative Left Border based on Timeline Recency */}
            <div className={`absolute top-0 bottom-0 left-0 w-1 ${application.statusPhase === 'REJECTED' ? 'bg-rose-500'
                    : application.statusPhase === 'OFFER_RECEIVED' ? 'bg-emerald-500'
                        : 'bg-blue-500'
                }`}></div>

            {/* Main Header / Title */}
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight mb-1 pr-6 truncate">
                {roleStr}
            </h4>

            {/* Company Source */}
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-4 truncate">
                <Briefcase className="w-3.5 h-3.5 opacity-70" />
                {companyStr}
            </div>

            {/* Tag Array Display (Tailwind badges) */}
            <div className="flex flex-wrap gap-1.5 mb-4">
                <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                    {opp.workModel || 'ON_SITE'}
                </span>
                {application.matchConfidenceScore > 0.8 && (
                    <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase flex items-center gap-1">
                        <AlignLeft className="w-2.5 h-2.5" /> Match
                    </span>
                )}
            </div>

            {/* Detail Footer Grid */}
            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <div className="flex items-center gap-1.5 truncate" title={formattedSalary}>
                    <DollarSign className="w-3.5 h-3.5" />
                    <span className="truncate">{formattedSalary}</span>
                </div>
                <div className="flex items-center gap-1.5 truncate" title={opp.locationCity || 'Anywhere'}>
                    <MapPin className="w-3.5 h-3.5" />
                    <span className="truncate">{opp.locationCity || 'Anywhere'}</span>
                </div>
            </div>

            {/* Auxiliary Icon Deck - Shown on Hover */}
            <div className="absolute top-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {application.notes && application.notes.length > 0 && (
                    <div className="bg-amber-100 dark:bg-amber-900/40 p-1 rounded-full text-amber-600 dark:text-amber-400" title="Includes personal notes">
                        <MessageSquare className="w-3 h-3" />
                    </div>
                )}
                {opp.externalUrl && (
                    <button
                        onClick={(e) => { e.stopPropagation(); window.open(opp.externalUrl, '_blank'); }}
                        className="bg-slate-100 dark:bg-slate-800 p-1 rounded-full text-slate-600 dark:text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                    >
                        <ExternalLink className="w-3 h-3" />
                    </button>
                )}
            </div>

            {/* Time Tracking Indicator for Stale Applications */}
            {application.dateApplied && (
                <div className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
                    <Clock className="w-3 h-3 opacity-60" />
                    Applied: {new Date(application.dateApplied).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </div>
            )}
        </div>
    );
};

export default KanbanCard;
