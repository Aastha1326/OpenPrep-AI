const {
    parseAndValidateFeedback,
} = require('../../services/interviewFeedbackProvenanceService');

describe('Interview Feedback Provenance', () => {
    const transcript = [
        {
            role: 'ai',
            text: 'Tell me about your project.',
        },
        {
            role: 'user',
            text: 'I built a REST API using Node.js.',
        },
    ];

    const validFeedback = {
        strengths: [
            {
                text: 'Clearly explained the project.',
                evidenceRefs: [{ transcriptIndex: 1 }],
            },
        ],
        weaknesses: [
            {
                text: 'Could provide more implementation details.',
                evidenceRefs: [{ transcriptIndex: 1 }],
            },
        ],
        recommendations: [
            {
                text: 'Explain technical decisions in more detail.',
                evidenceRefs: [{ transcriptIndex: 1 }],
            },
        ],
        confidence: 0.85,
    };

    it('stores evidence and provenance metadata', () => {
        const result = parseAndValidateFeedback(
            validFeedback,
            transcript
        );

        expect(result.promptVersion).toBe('interview-feedback-v1');
        expect(result.modelVersion).toBeTruthy();
        expect(result.strengths[0].supported).toBe(true);
        expect(result.recommendations[0].evidenceRefs).toEqual([
            { transcriptIndex: 1 },
        ]);
    });

    it('rejects recommendations without supporting evidence', () => {
        const feedback = {
            ...validFeedback,
            recommendations: [
                {
                    text: 'Improve your communication.',
                    evidenceRefs: [],
                },
            ],
        };

        expect(() =>
            parseAndValidateFeedback(feedback, transcript)
        ).toThrow(
            'Unsupported feedback recommendation: insufficient evidence'
        );
    });

    it('flags unsupported strengths and weaknesses', () => {
        const feedback = {
            ...validFeedback,
            strengths: [
                {
                    text: 'Excellent leadership.',
                    evidenceRefs: [{ transcriptIndex: 0 }],
                },
            ],
        };

        const result = parseAndValidateFeedback(
            feedback,
            transcript
        );

        expect(result.strengths[0].supported).toBe(false);
        expect(result.strengths[0].reason).toBe(
            'Insufficient evidence in candidate response'
        );
    });

    it('rejects malformed AI output', () => {
        expect(() =>
            parseAndValidateFeedback(
                {
                    strengths: [],
                    weaknesses: [],
                    recommendations: [],
                },
                transcript
            )
        ).toThrow(
            'Malformed AI feedback: confidence must be between 0 and 1'
        );
    });

    it('rejects invalid evidence references', () => {
        const feedback = {
            ...validFeedback,
            recommendations: [
                {
                    text: 'Improve the answer.',
                    evidenceRefs: [{ transcriptIndex: 99 }],
                },
            ],
        };

        expect(() =>
            parseAndValidateFeedback(feedback, transcript)
        ).toThrow(
            'Unsupported feedback recommendation: insufficient evidence'
        );
    });
});