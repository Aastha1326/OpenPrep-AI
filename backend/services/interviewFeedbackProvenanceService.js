const PROMPT_VERSION = 'interview-feedback-v1';
const MODEL_VERSION =
    process.env.INTERVIEW_FEEDBACK_MODEL || 'gemini-1.5-flash';

function isValidConfidence(value) {
    return typeof value === 'number' && value >= 0 && value <= 1;
}

function validateEvidenceReferences(items, transcript) {
    return items.map((item) => {
        const evidenceRefs = Array.isArray(item.evidenceRefs)
            ? item.evidenceRefs
            : [];

        const validEvidence = evidenceRefs.filter(
            (ref) =>
                Number.isInteger(ref.transcriptIndex) &&
                ref.transcriptIndex >= 0 &&
                ref.transcriptIndex < transcript.length &&
                transcript[ref.transcriptIndex]?.role === 'user'
        );

        if (!validEvidence.length) {
            return {
                ...item,
                evidenceRefs: [],
                supported: false,
                reason: 'Insufficient evidence in candidate response',
            };
        }

        return {
            ...item,
            evidenceRefs: validEvidence,
            supported: true,
        };
    });
}

function parseAndValidateFeedback(rawFeedback, transcript) {
    if (!rawFeedback || typeof rawFeedback !== 'object') {
        throw new Error('Malformed AI feedback: expected an object');
    }

    if (!Array.isArray(transcript)) {
        throw new Error('Cannot validate feedback without a transcript');
    }

    const requiredArrays = ['strengths', 'weaknesses', 'recommendations'];

    for (const field of requiredArrays) {
        if (!Array.isArray(rawFeedback[field])) {
            throw new Error(`Malformed AI feedback: ${field} must be an array`);
        }
    }

    if (!isValidConfidence(rawFeedback.confidence)) {
        throw new Error(
            'Malformed AI feedback: confidence must be between 0 and 1'
        );
    }

    const strengths = validateEvidenceReferences(
        rawFeedback.strengths,
        transcript
    );

    const weaknesses = validateEvidenceReferences(
        rawFeedback.weaknesses,
        transcript
    );

    const recommendations = validateEvidenceReferences(
        rawFeedback.recommendations,
        transcript
    );

    const unsupportedRecommendations = recommendations.filter(
        (item) => !item.supported
    );

    if (unsupportedRecommendations.length) {
        throw new Error(
            'Unsupported feedback recommendation: insufficient evidence'
        );
    }

    return {
        promptVersion: PROMPT_VERSION,
        modelVersion: MODEL_VERSION,
        generatedAt: new Date().toISOString(),
        confidence: rawFeedback.confidence,
        strengths,
        weaknesses,
        recommendations,
    };
}

module.exports = {
    PROMPT_VERSION,
    MODEL_VERSION,
    parseAndValidateFeedback,
};