const ResumeParseSession = require('../models/ResumeParseSession');

class ResumeParsingService {
    /**
     * Initializes a resume upload session
     */
    static async initSession(userId, fileName, targetRole) {
        return await ResumeParseSession.create({
            userId,
            fileName,
            targetRole,
            status: 'Parsing'
        });
    }

    /**
     * Simulates the OCR/NLP chunk extraction and ATS scoring algorithm
     * Converts a flat text stream into structured JSON and ATS telemetry.
     */
    static async processResume(sessionId, userId, rawText) {
        const session = await ResumeParseSession.findOne({ where: { id: sessionId, userId } });
        if (!session) throw new Error('Session not found');

        // Transition State -> Scoring
        session.status = 'Scoring';
        session.originalText = rawText;
        await session.save();

        // SIMULATION LOGIC: AI Processing pipeline
        await new Promise(resolve => setTimeout(resolve, 1200));

        // 1. Keyword extraction pseudo-logic
        const role = (session.targetRole || "").toLowerCase();
        let expectedKeywords = ['react', 'node.js', 'sql', 'aws', 'docker', 'typescript', 'architecture'];
        if (role.includes('data')) expectedKeywords = ['python', 'sql', 'pandas', 'machine learning', 'matplotlib'];

        let foundKeywords = [];
        let missingKeywords = [];

        expectedKeywords.forEach(kw => {
            if (rawText.toLowerCase().includes(kw)) {
                foundKeywords.push(kw);
            } else {
                missingKeywords.push(kw);
            }
        });

        // 2. Structuring and Penalties
        let templatePenalty = 0;
        if (rawText.includes('table') || rawText.includes('columns')) templatePenalty += 15; // standard ATS penalty for dual columns

        const textLength = rawText.length;
        if (textLength < 500) templatePenalty += 20; // Too short

        // 3. Mathematical Scoring
        const matchRate = (foundKeywords.length / expectedKeywords.length) * 100;
        let baseScore = 60 + (matchRate * 0.4) - templatePenalty;
        baseScore = Math.min(100, Math.max(0, baseScore)); // Clamp between 0 and 100

        // Extract pseudo JSON AST
        const astString = {
            summary: rawText.substring(0, 150) + "...",
            experienceCount: rawText.toLowerCase().split('experience').length - 1,
            educationFound: rawText.toLowerCase().includes('university') || rawText.toLowerCase().includes('college'),
            hardSkills: foundKeywords
        };

        // Finalize Record
        session.overallAtsScore = Math.floor(baseScore);
        session.keywordMatchRate = matchRate;
        session.formattingPenalty = templatePenalty;
        session.extractedNodes = astString;
        session.missingKeywords = missingKeywords;
        session.status = 'Complete';

        await session.save();

        return session;
    }

    /**
     * Retrieves heat map analytics across all historically parsed resumes for a user
     */
    static async fetchAtsAnalytics(userId) {
        const history = await ResumeParseSession.findAll({
            where: { userId, status: 'Complete' },
            order: [['processedAt', 'DESC']],
            limit: 10
        });

        const totalScanned = history.length;
        const avgScore = totalScanned > 0
            ? history.reduce((acc, cv) => acc + cv.overallAtsScore, 0) / totalScanned
            : 0;

        return {
            history,
            aggregateMetrics: {
                totalScanned,
                averageScore: Math.floor(avgScore),
                topMissingKeywords: ['aws', 'kubernetes', 'system design'] // Simulated global frequency
            }
        };
    }
}

module.exports = ResumeParsingService;
