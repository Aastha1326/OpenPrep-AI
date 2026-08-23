const MockInterview = require('../models/MockInterview');

class MockInterviewService {
    /**
     * Initializes a new AI interview session
     */
    static async initiateSession(userId, configuration) {
        const { targetCompany, jobRole, difficultyLevel } = configuration;

        const session = await MockInterview.create({
            userId,
            targetCompany,
            jobRole,
            difficultyLevel,
            status: 'Scheduled',
            transcript: []
        });

        return session;
    }

    /**
     * Starts the session, updating status and tracking time
     */
    static async startSession(sessionId, userId) {
        const session = await MockInterview.findOne({ where: { id: sessionId, userId } });
        if (!session) throw new Error('Session not found');

        if (session.status !== 'Scheduled') {
            throw new Error('Session is already active or completed');
        }

        session.status = 'InProgress';
        session.startedAt = new Date();

        // Add initial system prompt to transcript
        const initialGreeting = `Hello, I'll be your interviewer today for the ${session.jobRole} position at ${session.targetCompany}. Are you ready to begin?`;

        const transcript = session.transcript || [];
        transcript.push({ role: 'ai', text: initialGreeting, timestamp: new Date().toISOString() });
        session.transcript = transcript;

        await session.save();
        return { session, initialGreeting };
    }

    /**
     * Simulates submitting an audio/text response and processing AI reasoning
     */
    static async submitResponse(sessionId, userId, userMessageText) {
        const session = await MockInterview.findOne({ where: { id: sessionId, userId } });
        if (!session) throw new Error('Session not found');
        if (session.status !== 'InProgress') throw new Error('Cannot submit to an inactive session');

        // Append User Msg
        let currentTranscript = session.transcript || [];
        currentTranscript.push({
            role: 'user',
            text: userMessageText,
            timestamp: new Date().toISOString()
        });

        // Simulate AI logic processing time
        await new Promise(resolve => setTimeout(resolve, 800));

        // Generate mock AI followup based on string size and sentiment placeholder
        const aiReplies = [
            "Could you elaborate more on how you handled performance optimizations in that scenario?",
            "That's interesting. What alternatives did you consider before choosing that architecture?",
            "How did you resolve the conflict when the technical requirements changed midway?",
            "Great explanation. Let's move on to a system design question. How would you scale this?",
            "Can you clarify what the exact bottleneck was?"
        ];

        const randomReply = aiReplies[Math.floor(Math.random() * aiReplies.length)];

        currentTranscript.push({
            role: 'ai',
            text: randomReply,
            timestamp: new Date().toISOString()
        });

        session.transcript = currentTranscript;

        // Update mock confidence metrics for charts
        const currentMetrics = session.confidenceMetrics || [];
        const latestConfidence = Math.floor(Math.random() * (95 - 65 + 1) + 65);
        currentMetrics.push(latestConfidence);
        session.confidenceMetrics = currentMetrics;

        await session.save();

        return {
            reply: randomReply,
            confidenceSnapshot: latestConfidence
        };
    }

    /**
     * Finalizes the session, generating scoring telemetry
     */
    static async concludeSession(sessionId, userId) {
        const session = await MockInterview.findOne({ where: { id: sessionId, userId } });
        if (!session) throw new Error('Session not found');

        session.status = 'Completed';

        // Generate simulated scoring based on transcript size
        const msgCount = (session.transcript || []).length;
        const baseline = msgCount > 6 ? 85 : 65;

        session.overallScore = Math.min(100, baseline + Math.floor(Math.random() * 10));
        session.technicalScore = Math.min(100, baseline + Math.floor(Math.random() * 12));
        session.communicationScore = Math.min(100, baseline + Math.floor(Math.random() * 8));

        session.feedbackSummary = `You demonstrated a solid understanding of fundamental principles. Focus on providing STAR-format answers and managing pauses more effectively.`;

        await session.save(); // Triggers beforeSave hook for duration calculation

        return session;
    }
}

module.exports = MockInterviewService;
