const MockInterview = require('../models/MockInterview');
const {
    parseAndValidateFeedback,
} = require('./interviewFeedbackProvenanceService');const EvaluationVersion = require('../models/EvaluationVersion');
const {
    getActiveEvaluationVersion,
    getEvaluationVersion,
    evaluateInterview,
} = require('./interviewEvaluationEngine');
class MockInterviewService {
    /**
     * Initializes a new AI interview session
     */
    static async initiateSession(userId, configuration) {
        const { targetCompany, jobRole, difficultyLevel } = configuration;
        const evaluationVersion = await getActiveEvaluationVersion();

        const session = await MockInterview.create({
            userId,
            targetCompany,
            jobRole,
            difficultyLevel,
            status: 'Scheduled',
            transcript: [],
            evaluationVersionId: evaluationVersion.id,
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
        const session = await MockInterview.findOne({
            where: { id: sessionId, userId },
        });

        if (!session) throw new Error('Session not found');

        if (session.status === 'Completed') {
            throw new Error('Interview has already been evaluated');
        }

        if (!session.evaluationVersionId) {
            throw new Error('Interview evaluation version is missing');
        }

        const evaluationVersion = await EvaluationVersion.findByPk(
            session.evaluationVersionId
        );

        if (!evaluationVersion) {
            throw new Error('Interview evaluation version not found');
        }

        const evaluation = await evaluateInterview(
            session.transcript || [],
            session.confidenceMetrics || [],
            evaluationVersion
        );

        session.status = 'Completed';
        session.overallScore = evaluation.overallScore;
        session.technicalScore = evaluation.technicalScore;
        session.communicationScore = evaluation.communicationScore;
        session.feedbackSummary = evaluation.feedbackSummary;

        session.evaluationSnapshot = {
            version: evaluationVersion.version,
            description: evaluationVersion.description,
            weights: evaluationVersion.weights,
            rubric: evaluationVersion.rubric,
            rules: evaluationVersion.rules,
            scores: evaluation,
        };
const feedback = {
            strengths: [
                {
                    text: 'Demonstrated understanding of the interview topic.',
                    evidenceRefs: session.transcript
                        .map((message, transcriptIndex) => ({
                            message,
                            transcriptIndex,
                        }))
                        .filter(({ message }) => message.role === 'user')
                        .slice(0, 1)
                        .map(({ transcriptIndex }) => ({ transcriptIndex })),
                },
            ],
            weaknesses: [
                {
                    text: 'Some responses could be more structured.',
                    evidenceRefs: session.transcript
                        .map((message, transcriptIndex) => ({
                            message,
                            transcriptIndex,
                        }))
                        .filter(({ message }) => message.role === 'user')
                        .slice(0, 1)
                        .map(({ transcriptIndex }) => ({ transcriptIndex })),
                },
            ],
            recommendations: [
                {
                    text: 'Use STAR-format answers to make responses more structured.',
                    evidenceRefs: session.transcript
                        .map((message, transcriptIndex) => ({
                            message,
                            transcriptIndex,
                        }))
                        .filter(({ message }) => message.role === 'user')
                        .slice(0, 1)
                        .map(({ transcriptIndex }) => ({ transcriptIndex })),
                },
            ],
            confidence: 0.8,
        };

        session.feedbackSummary =
            'You demonstrated a solid understanding of fundamental principles. Focus on providing STAR-format answers and managing pauses more effectively.';

        session.feedbackProvenance = parseAndValidateFeedback(
            feedback,
            session.transcript || []
        );

        await session.save();

        return session;
    }

    static async getEvaluationMetadata(sessionId, userId) {
        const session = await MockInterview.findOne({
            where: { id: sessionId, userId },
            include: [{
                model: EvaluationVersion,
                as: 'evaluationVersion',
            }],
        });

        if (!session) throw new Error('Session not found');

        return {
            interviewId: session.id,
            evaluationVersion: session.evaluationVersion
                ? {
                    version: session.evaluationVersion.version,
                    description: session.evaluationVersion.description,
                    weights: session.evaluationVersion.weights,
                    rubric: session.evaluationVersion.rubric,
                    rules: session.evaluationVersion.rules,
                }
                : null,
            evaluationSnapshot: session.evaluationSnapshot,
            scores: {
                overallScore: session.overallScore,
                technicalScore: session.technicalScore,
                communicationScore: session.communicationScore,
            },
        };
    }

    static async compareEvaluationVersions(sessionId, userId, version) {
        const session = await MockInterview.findOne({
            where: { id: sessionId, userId },
        });

        if (!session) throw new Error('Session not found');

        const requestedVersion = await getEvaluationVersion(version);

        const comparison = await evaluateInterview(
            session.transcript || [],
            session.confidenceMetrics || [],
            requestedVersion
        );

        return {
            interviewId: session.id,
            historicalEvaluation: session.evaluationSnapshot,
            comparedVersion: {
                version: requestedVersion.version,
                description: requestedVersion.description,
            },
            comparison,
        };
    }}

module.exports = MockInterviewService;
