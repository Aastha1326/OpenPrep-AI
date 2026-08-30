/**
 * @fileoverview Service for calculating study partner compatibility scores.
 * Scores based on overlapping subject tags, complementary proficiency levels, and schedule alignment.
 */

/**
 * Calculates a compatibility score between two users.
 * 
 * @param {Object} userA - The requesting user's profile data.
 * @param {Object} userB - The potential partner's profile data.
 * @returns {Object} Compatibility score (0-100) and matching details.
 */
function calculateCompatibility(userA, userB) {
    let score = 0;
    const details = [];

    // 1. Subject Tag Overlap (Max 40 points)
    const userATags = new Set(userA.subjects.map(s => s.toLowerCase()));
    const userBTags = new Set(userB.subjects.map(s => s.toLowerCase()));
    const commonSubjects = [...userATags].filter(tag => userBTags.has(tag));

    const subjectScore = Math.min(40, (commonSubjects.length / Math.max(userATags.size, 1)) * 40);
    score += subjectScore;
    if (commonSubjects.length > 0) {
        details.push(`Matched on ${commonSubjects.length} subject(s): ${commonSubjects.join(', ')}`);
    }

    // 2. Proficiency Complementarity (Max 30 points)
    // Reward pairing a "beginner" with an "advanced" student in the same subject
    let complementScore = 0;
    commonSubjects.forEach(subject => {
        const profA = userA.proficiency[subject] || 'intermediate';
        const profB = userB.proficiency[subject] || 'intermediate';

        if ((profA === 'beginner' && profB === 'advanced') || (profA === 'advanced' && profB === 'beginner')) {
            complementScore += 15;
        } else if (profA === profB && profA === 'intermediate') {
            complementScore += 10; // Peer learning
        }
    });
    score += Math.min(30, complementScore);

    // 3. Schedule Overlap (Max 30 points)
    // Simplified: Check if they share at least one common available day
    const userADays = new Set(userA.availableDays);
    const userBDays = new Set(userB.availableDays);
    const commonDays = [...userADays].filter(day => userBDays.has(day));

    const scheduleScore = Math.min(30, (commonDays.length / 7) * 30);
    score += scheduleScore;
    if (commonDays.length > 0) {
        details.push(`Available on same days: ${commonDays.join(', ')}`);
    }

    return {
        score: Math.round(score),
        details,
        commonSubjects
    };
}

module.exports = {
    calculateCompatibility,
};
