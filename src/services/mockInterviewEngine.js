/**
 * AI Technical Mock Interview Engine
 * Question domain taxonomies, AI prompt scoring algorithms, voice feedback simulators, and scorecard generators.
 */

export interface InterviewQuestion {
    id: string;
    title: string;
    domain: 'System Design' | 'Algorithms' | 'Frontend Architecture' | 'Behavioral';
    difficulty: 'Medium' | 'Hard';
    prompt: string;
    keyPointsExpected: string[];
    suggestedDurationMins: number;
}

export interface InterviewScorecard {
    technicalAccuracyScore: number;
    communicationScore: number;
    problemSolvingScore: number;
    overallRating: number;
    aiFeedbackSummary: string;
    areasOfImprovement: string[];
}

export const MOCK_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
    {
        id: "q_101",
        title: "Design a Global Rate Limiter Service for Distributed APIs",
        domain: "System Design",
        difficulty: "Hard",
        prompt: "How would you design a rate-limiting service supporting 100,000 requests per second across multiple geographical regions? Compare Token Bucket vs Sliding Window Logs.",
        keyPointsExpected: [
            "Token Bucket / Leaky Bucket algorithm trade-offs",
            "Redis cluster atomic operations (INCR / EVAL Lua scripts)",
            "Handling latency with local edge node caching",
            "Graceful fallback behavior during cache partition failures"
        ],
        suggestedDurationMins: 15
    },
    {
        id: "q_102",
        title: "Implement an LRU Cache with O(1) Get and Put Operations",
        domain: "Algorithms",
        difficulty: "Medium",
        prompt: "Explain how to combine a Hash Map and a Doubly Linked List to implement an LRU cache with fixed capacity. Write out the node insertion and eviction logic.",
        keyPointsExpected: [
            "Hash Map for O(1) key lookups to node pointers",
            "Doubly Linked List for O(1) head/tail node eviction",
            "Handling edge cases like updating existing keys"
        ],
        suggestedDurationMins: 10
    }
];

export const evaluateInterviewResponse = (responseLength: number, keyPointsMatchedCount: number): InterviewScorecard => {
    const technicalAccuracyScore = Math.min(98, 70 + keyPointsMatchedCount * 7);
    const communicationScore = Math.min(95, 75 + Math.floor(responseLength / 30));
    const problemSolvingScore = Math.min(96, 68 + keyPointsMatchedCount * 8);
    const overallRating = Math.round((technicalAccuracyScore + communicationScore + problemSolvingScore) / 3);

    return {
        technicalAccuracyScore,
        communicationScore,
        problemSolvingScore,
        overallRating,
        aiFeedbackSummary: "Excellent architectural breakdown! You demonstrated strong mastery of distributed cache eviction and atomic Lua script execution. Consider elaborating more on fallback degradation strategies.",
        areasOfImprovement: [
            "Detail localized edge memory consumption under peak loads",
            "Explain rate limit header standards (X-RateLimit-Remaining)"
        ]
    };
};
