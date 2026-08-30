import React, { useState } from 'react';
import { Search, SlidersHorizontal, MapPin, Building2, Code2 } from 'lucide-react';

const MentorFilterHUD = ({ onFilterChange }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState({
        industry: '',
        skills: ''
    });

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
        if (onFilterChange) {
            onFilterChange({ ...filters, query: e.target.value });
        }
    };

    const handleFilterUpdate = (key, value) => {
        const updated = { ...filters, [key]: value };
        setFilters(updated);
        if (onFilterChange) onFilterChange({ ...updated, query: searchQuery });
    };

    return (
        <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
            {/* Ambient Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-indigo-500/10 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row gap-6">

                {/* Search Bar - Main Area */}
                <div className="flex-1 relative">
                    <label className="text-xs font-bold text-gray-500 tracking-widest uppercase mb-2 block">Search Mentors</label>
                    <div className="relative group/input">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within/input:text-blue-400 transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchChange}
                            placeholder="e.g. 'Software Engineer at Netflix'"
                            className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder-gray-600"
                        />
                    </div>
                </div>

                {/* Filter Controls */}
                <div className="flex flex-col md:w-[400px]">
                    <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-500 tracking-widest uppercase">
                        <SlidersHorizontal className="w-4 h-4" /> Affinity Parameters
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select
                                value={filters.industry}
                                onChange={(e) => handleFilterUpdate('industry', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-gray-300 text-sm outline-none appearance-none focus:border-blue-500/50"
                            >
                                <option value="">Any Industry</option>
                                <option value="Tech">Big Tech</option>
                                <option value="Fintech">FinTech</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Startup">Startups</option>
                            </select>
                        </div>

                        <div className="relative">
                            <Code2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <select
                                value={filters.skills}
                                onChange={(e) => handleFilterUpdate('skills', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-9 pr-4 py-3 text-gray-300 text-sm outline-none appearance-none focus:border-blue-500/50"
                            >
                                <option value="">Any Skill Focus</option>
                                <option value="React">Frontend (React)</option>
                                <option value="System Design">System Design</option>
                                <option value="AWS">Cloud / AWS</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Chips */}
            <div className="relative z-10 hidden md:flex items-center gap-3 mt-6 border-t border-white/5 pt-4">
                <span className="text-xs text-gray-500 font-medium tracking-wide">Popular Matches:</span>
                {['Meta Staff Engineers', 'Y-Combinator Alumni', 'Machine Learning'].map(chip => (
                    <button key={chip} className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-full text-xs text-gray-300 transition-colors">
                        {chip}
                    </button>
                ))}
            </div>

        </div>
    );
};

export default MentorFilterHUD;
