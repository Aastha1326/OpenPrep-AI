/**
 * AI Interview Simulation Engine
 * Core domain logic for technical interview question evaluation,
 * confidence scoring algorithms, answer feedback synthesis, and candidate analytics.
 */

export interface InterviewQuestion {
    id: string;
    roleCategory: 'Frontend Engineer' | 'Backend Engineer' | 'System Design';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    questionText: string;
    keyConcepts: string[];
    sampleIdealAnswer: string;
}

export interface CandidateResponseRecord {
    id: string;
    questionId: string;
    questionText: string;
    userAnswerText: string;
    timeTakenSeconds: number;
    clarityScore: number;
    technicalDepthScore: number;
    overallConfidenceScore: number;
    aiFeedbackSummary: string;
    strengths: string[];
    areasToImprove: string[];
}

export const MOCK_INTERVIEW_QUESTIONS: InterviewQuestion[] = [
    {
        id: "q_101",
        roleCategory: "Frontend Engineer",
        difficulty: "Medium",
        questionText: "How does the React Virtual DOM diffing algorithm work, and what role do 'keys' play in list rendering reconciliation?",
        keyConcepts: ["Virtual DOM", "Reconciliation Algorithm", "Keys in Lists", "O(N) Heuristic Diffing"],
        sampleIdealAnswer: "React uses a heuristic O(N) diffing algorithm. When diffing two trees, React compares root elements first. Keys give elements a persistent identity across renders, allowing React to match items in dynamic lists without re-rendering un-shifted siblings."
    },
    {
        id: "q_102",
        roleCategory: "Backend Engineer",
        difficulty: "Hard",
        questionText: "Explain how you would handle race conditions when updating user balance ledgers in a distributed microservice architecture.",
        keyConcepts: ["Pessimistic vs Optimistic Locking", "Database Transactions (ACID)", "Idempotency Keys", "Distributed Mutex / Redis Redlock"],
        sampleIdealAnswer: "To prevent double-spending in a distributed system, I would combine idempotency keys at the API gateway layer with database-level optimistic concurrency control (using version numbers or SELECT FOR UPDATE pessimistic row locks)."
    },
    {
        id: "q_103",
        roleCategory: "System Design",
        difficulty: "Hard",
        questionText: "Design a high-throughput real-time notification engine that can deliver millions of push alerts per minute with low latency.",
        keyConcepts: ["Message Queue (Kafka/RabbitMQ)", "WebSocket Server Cluster", "Push Notification Service (APNs/FCM)", "Rate Limiting & Backpressure"],
        sampleIdealAnswer: "The architecture would utilize Apache Kafka as an ingestion bus to handle bursts, partitioned by User ID. Workers consume events and forward them to a distributed WebSocket connection gateway cluster maintained in Redis."
    }
];

export const calculateCandidateOverallScore = (responses: CandidateResponseRecord[]): number => {
    if (responses.length === 0) return 0;
    const sum = responses.reduce((acc, curr) => acc + curr.overallConfidenceScore, 0);
    return Math.round(sum / responses.length);
};
