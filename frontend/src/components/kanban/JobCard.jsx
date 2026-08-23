import React from 'react';
import { Briefcase, MapPin, Building2, ExternalLink } from 'lucide-react';

const JobCard = ({ job, isDragging, dragHandleProps }) => {
    return (
        <div
            className={`relative group p-4 rounded-xl border border-white/10 backdrop-blur-md transition-all duration-300
                ${isDragging ? 'bg-indigo-900/40 shadow-2xl scale-105 z-50' : 'bg-white/5 hover:bg-white/10 shadow-lg'}
            `}
            {...dragHandleProps}
        >
            {/* Edge Color Highlight */}
            <div
                className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl opacity-75"
                style={{ backgroundColor: job.colorTag || '#3b82f6' }}
            />

            <div className="pl-2">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-white text-lg flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        {job.companyName}
                    </h3>
                    {job.applicationUrl && (
                        <a href={job.applicationUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 transition-opacity">
                            <ExternalLink className="w-4 h-4" />
                        </a>
                    )}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-300 mb-3">
                    <Briefcase className="w-4 h-4" />
                    <span>{job.roleTitle}</span>
                </div>

                {job.location && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                        <MapPin className="w-3 h-3" />
                        <span>{job.location}</span>
                    </div>
                )}

                {/* Badges / Minimal Timeline */}
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-white/10">
                    <span className="text-xs font-semibold px-2 py-1 bg-white/10 rounded-md text-gray-200 uppercase tracking-widest">
                        {job.status}
                    </span>

                    {(job.expectedSalary || job.offeredSalary) && (
                        <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                            ${(job.offeredSalary || job.expectedSalary).toLocaleString()}
                        </span>
                    )}
                </div>
            </div>

            {/* Modal Trigger Overlay (Hidden by Default) */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer">
                <button className="px-4 py-2 bg-blue-500/80 hover:bg-blue-500 text-white rounded-lg font-semibold shadow-xl transform scale-95 group-hover:scale-100 transition-transform">
                    Update Phase
                </button>
            </div>
        </div>
    );
};

export default JobCard;
