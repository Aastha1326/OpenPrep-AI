const AlumniMentorProfile = require('../models/AlumniMentorProfile');
const { Op } = require('sequelize');

class MentorMatchingService {

    /**
     * Finds alumni mentors matching a student's criteria with a custom affinity algorithm
     */
    static async discoverMentors(studentProfileParams) {
        const { targetIndustry, desiredSkills, targetCompany } = studentProfileParams;

        let whereClause = { availabilityStatus: { [Op.in]: ['Open', 'Waitlist'] } };

        // Hard filter on industry if strictly provided
        if (targetIndustry) whereClause.industry = targetIndustry;

        const candidates = await AlumniMentorProfile.findAll({
            where: whereClause,
            limit: 50 // Pull top 50 to run JS-based affinity scoring
        });

        // Evaluate Affinity Score (0-100)
        let rankedMentors = candidates.map(mentor => {
            let score = 50; // Base score

            // Skill matching bonus (+30 max)
            const mentorSkills = mentor.skillsRequired || [];
            const studentSkills = desiredSkills || [];
            let matchCount = 0;
            studentSkills.forEach(sk => {
                if (mentorSkills.map(s => s.toLowerCase()).includes(sk.toLowerCase())) matchCount++;
            });
            score += Math.min(30, matchCount * 10);

            // Company Dream Match (+15)
            if (targetCompany && mentor.currentCompany.toLowerCase() === targetCompany.toLowerCase()) {
                score += 15;
            }

            // Experience scale (+5)
            if (mentor.yearsOfExperience > 5) score += 5;

            // Verified (+5)
            if (mentor.isVerified) score += 5;

            const mentorJson = mentor.toJSON();
            mentorJson.matchAffinityScore = Math.min(100, score);

            return mentorJson;
        });

        // Return sorted descending by affinity
        return rankedMentors.sort((a, b) => b.matchAffinityScore - a.matchAffinityScore);
    }

    /**
     * Request a mentorship connection
     */
    static async requestConnection(studentId, mentorId, introductionMessage) {
        const mentor = await AlumniMentorProfile.findByPk(mentorId);

        if (!mentor) throw new Error("Mentor profile not found");
        if (mentor.availabilityStatus === 'Unavailable') {
            throw new Error("This mentor is currently not accepting new mentees");
        }

        // Normally we would insert into a ConnectionRequest table here.
        // We will simulate the request side-effects in this mock service.

        if (mentor.availabilityStatus === 'Open') {
            mentor.currentMenteeCount += 1;
            await mentor.save(); // Triggers the beforeUpdate hook to check maxMentees

            return {
                status: 'Connected',
                message: "Connection request granted instantly!",
                mentor: mentor.toJSON()
            };
        } else if (mentor.availabilityStatus === 'Waitlist') {
            return {
                status: 'Waitlisted',
                message: "You have been placed on the waitlist. The mentor will review your profile shortly."
            };
        }
    }

    /**
     * Fetch aggregated statistics for the Mentor dashboard
     */
    static async getTelemetry() {
        const total = await AlumniMentorProfile.count();
        const available = await AlumniMentorProfile.count({ where: { availabilityStatus: 'Open' } });

        return {
            totalMentorsActive: total,
            currentlyAvailable: available,
            topIndustries: [
                { name: 'Big Tech', count: Math.floor(Math.random() * 50) + 20 },
                { name: 'Fintech', count: Math.floor(Math.random() * 30) + 10 },
                { name: 'HealthTech', count: Math.floor(Math.random() * 20) + 5 }
            ]
        };
    }
}

module.exports = MentorMatchingService;
