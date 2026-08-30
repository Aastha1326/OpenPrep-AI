import React, { useState, useEffect } from 'react';
import MentorFilterHUD from '../components/mentorship/MentorFilterHUD';
import MentorshipCard from '../components/mentorship/MentorshipCard';
import AlumniConnectionModal from '../components/mentorship/AlumniConnectionModal';
import { Target, Users2 } from 'lucide-react';

// MOCK DATA for rendering visuals
const MOCK_MENTORS = [
    {
        id: 1, fullName: 'Sarah Chen', currentCompany: 'Stripe', currentRole: 'Staff Software Engineer',
        industry: 'Fintech', yearsOfExperience: 8, isVerified: true, matchAffinityScore: 95,
        skillsRequired: ['System Design', 'React', 'Go'], availabilityStatus: 'Open',
        bioText: 'Passionate about building scalable payment infrastructure and mentoring underrepresented groups in tech.'
    },
    {
        id: 2, fullName: 'David Rodriguez', currentCompany: 'Google', currentRole: 'Senior SWE',
        industry: 'Tech', yearsOfExperience: 6, isVerified: true, matchAffinityScore: 88,
        skillsRequired: ['C++', 'Distributed Systems'], availabilityStatus: 'Waitlist',
        bioText: 'Working on core search infrastructure. Happy to review resumes and practice mock interviews!'
    },
    {
        id: 3, fullName: 'Amara Okafor', currentCompany: 'Netflix', currentRole: 'UI/UX Engineer',
        industry: 'Tech', yearsOfExperience: 4, isVerified: false, matchAffinityScore: 82,
        skillsRequired: ['React', 'CSS', 'Framer Motion'], availabilityStatus: 'Open',
        bioText: 'Bridging the gap between design and engineering. Let us chat about frontend architecture.'
    },
    {
        id: 4, fullName: 'James Wilson', currentCompany: 'Palantir', currentRole: 'Forward Deployed Engineer',
        industry: 'Data', yearsOfExperience: 3, isVerified: true, matchAffinityScore: 71,
        skillsRequired: ['Data Pipelines', 'Python', 'SQL'], availabilityStatus: 'Unavailable',
        bioText: 'Currently traveling for client deployments. Not accepting new mentees until Q4.'
    }
];

const MentorshipTerminal = () => {
    const [mentors, setMentors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);

    useEffect(() => {
        // Simulate API Discovery fetch
        setTimeout(() => {
            setMentors(MOCK_MENTORS);
            setIsLoading(false);
        }, 800);
    }, []);

    const handleFilterChange = (filterState) => {
        setIsLoading(true);
        // Simulate re-fetching with new affinity metrics
        setTimeout(() => {
            const shuffled = [...MOCK_MENTORS].sort(() => 0.5 - Math.random());
            setMentors(shuffled);
            setIsLoading(false);
        }, 500);
    };

    const handleConnectClick = (mentor) => {
        setSelectedMentor(mentor);
        setIsModalOpen(true);
    };

    return (
        <div className="min-h-screen bg-gray-950 font-sans p-4 md:p-8 selection:bg-blue-500/30">
            {/* Header Area */}
            <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h1 className="text-3xl md:text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400">
                        Alumni Mentor Matrix
                    </h1>
                    <p className="text-gray-400 font-medium mt-2 max-w-xl">
                        Discover, connect, and accelerate your career with verified university alumni actively working at top-tier firms. Algorithmically sorted by your career affinity profile.
                    </p>
                </div>

                <div className="flex gap-4">
                    <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[120px]">
                        <Users2 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <div className="text-xl font-bold text-white">412</div>
                        <div className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Active Alumni</div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto flex flex-col gap-8">
                {/* Search & Filter HUD */}
                <MentorFilterHUD onFilterChange={handleFilterChange} />

                {/* Matrix Grid Display */}
                <div>
                    <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-400" /> High-Affinity Matches
                    </h2>

                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-gray-900 border border-white/5 rounded-3xl h-[320px] animate-pulse p-6">
                                    <div className="w-14 h-14 rounded-full bg-white/10 mb-6" />
                                    <div className="w-1/2 h-6 bg-white/10 rounded-md mb-2" />
                                    <div className="w-1/3 h-4 bg-white/5 rounded-md mb-8" />
                                    <div className="w-full h-16 bg-white/5 rounded-xl mb-4" />
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {mentors.map(mentor => (
                                <MentorshipCard
                                    key={mentor.id}
                                    mentor={mentor}
                                    onConnectClick={handleConnectClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Global Connection Modal */}
            <AlumniConnectionModal
                isOpen={isModalOpen}
                mentor={selectedMentor}
                onClose={() => setIsModalOpen(false)}
            />
        </div>
    );
};

export default MentorshipTerminal;
