/**
 * AI Viva Voce Interview Simulator Engine & Mock Data Service
 * Comprehensive service layer for managing multi-turn academic viva sessions,
 * telemetry, speech synthesis parameters, and scoring rubrics.
 */

export interface VivaQuestionTurn {
    turnNumber: number;
    question: string;
    studentResponse: string;
    responseMode: 'speech' | 'text';
    responseTimeSeconds: number;
    conceptualScore: number;
    technicalAccuracy: number;
    examinerFeedback: string;
    timestamp: string;
}

export interface VivaSessionConfig {
    subject: string;
    topic: string;
    academicLevel: 'undergraduate' | 'postgraduate' | 'doctoral';
    examinerPersona: 'strict_professor' | 'supportive_mentor' | 'industry_expert';
    maxTurns: number;
}

export interface VivaScorecard {
    totalScore: number; // 0-100
    conceptualDepth: number; // 0-100
    technicalAccuracy: number; // 0-100
    communicationClarity: number; // 0-100
    confidenceIndex: number; // 0-100
    examinerSummary: string;
    strengths: string[];
    improvementAreas: string[];
    recommendedTopics: string[];
}

export interface VivaSessionState {
    sessionId: string;
    status: 'idle' | 'in_progress' | 'evaluating' | 'completed';
    config: VivaSessionConfig;
    turns: VivaQuestionTurn[];
    currentTurnIndex: number;
    currentQuestion: string;
    isListening: boolean;
    speechTranscript: string;
    scorecard: VivaScorecard | null;
    startedAt: string;
}

// Initial default configuration templates
export const VIVA_SUBJECT_PRESETS: { subject: string; icon: string; topics: string[] }[] = [
    {
        subject: "Operating Systems & Distributed Systems",
        icon: "Cpu",
        topics: [
            "Process Synchronization & Deadlocks",
            "Virtual Memory & Page Replacement",
            "File System Architecture & Inodes",
            "Distributed Consensus (Raft/Paxos)"
        ]
    },
    {
        subject: "Database Management & Distributed Storage",
        icon: "Database",
        topics: [
            "B+ Tree Indexing & Query Execution",
            "ACID Transactions & MVCC Isolation",
            "Sharding, Replication & CAP Theorem",
            "NoSQL Data Modeling & Vector Search"
        ]
    },
    {
        subject: "Biomedical Engineering & Clinical Telemetry",
        icon: "Activity",
        topics: [
            "ECG Signal Processing & QRS Detection",
            "Pulse Oximetry Spectroscopy (SpO2)",
            "Hemodynamic Pressure Monitoring",
            "Defibrillator Waveform Design"
        ]
    },
    {
        subject: "Computer Networks & Cloud Security",
        icon: "Network",
        topics: [
            "TCP Congestion Control (BBR/CUBIC)",
            "TLS 1.3 Handshake & Cipher Suites",
            "Zero Trust Network Architecture",
            "DNSSEC & BGP Routing Security"
        ]
    }
];

// Initial mock examiner question generation engine
export const generateOpeningQuestion = (config: VivaSessionConfig): string => {
    const questionsMap: Record<string, string> = {
        "Process Synchronization & Deadlocks": "Welcome to your viva voce examination. Let's begin with concurrency control. Can you explain the four necessary Coffman conditions for a system deadlock to occur, and how modern OS kernels prevent circular wait?",
        "B+ Tree Indexing & Query Execution": "Greetings candidate. In database internal storage engines, why are B+ Trees preferred over binary search trees for disk-based index pages, and how does node splitting operate during sequential inserts?",
        "ECG Signal Processing & QRS Detection": "Welcome. In cardiac telemetry signal processing, how does the Pan-Tompkins algorithm isolate the QRS complex from baseline wander and high-frequency electromyographic noise?",
        "TCP Congestion Control (BBR/CUBIC)": "Let's commence the examination. Contrast window-based TCP CUBIC congestion control with Google's rate-based TCP BBR model. How does BBR estimate Bottleneck Bandwidth and Round-Trip Propagation Time?"
    };

    return questionsMap[config.topic] || `Welcome. Please provide an in-depth technical breakdown of fundamental principles in ${config.topic}.`;
};

// Generate dynamic probing follow-up questions based on student input
export const evaluateTurnAndGenerateFollowUp = (
    turnIndex: number,
    question: string,
    studentAnswer: string,
    config: VivaSessionConfig
): { nextQuestion: string; turnEvaluation: Partial<VivaQuestionTurn> } => {
    const wordCount = studentAnswer.trim().split(/\s+/).length;
    const conceptualScore = Math.min(100, Math.max(40, Math.floor(wordCount * 2.8) + (studentAnswer.length > 50 ? 25 : 10)));
    const technicalAccuracy = Math.min(100, Math.max(35, Math.floor(wordCount * 2.5) + (studentAnswer.includes("kernel") || studentAnswer.includes("index") || studentAnswer.includes("signal") || studentAnswer.includes("latency") ? 30 : 15)));

    const followUps: Record<number, string> = {
        1: `Interesting baseline explanation. However, pushing deeper into the mechanism—how would this exact approach behave under high contention with 10,000 concurrent worker threads?`,
        2: `You mentioned key components, but what are the exact performance trade-offs regarding memory overhead, disk I/O amplification, and cache invalidation?`,
        3: `Good. Now consider a failure scenario: if a system node crashes midway during execution, how is state consistency guaranteed across persistent storage?`,
        4: `Final probing question: How would you optimize this implementation to achieve sub-millisecond response latency in an enterprise edge deployment?`
    };

    const nextQuestion = followUps[turnIndex] || `Excellent response. Can you summarize the core architectural trade-offs you have articulated throughout this examination?`;

    return {
        nextQuestion,
        turnEvaluation: {
            conceptualScore,
            technicalAccuracy,
            examinerFeedback: wordCount > 25 
                ? "Demonstrated solid technical grasp with key terminology. Recommended sharper focus on edge-case failure modes."
                : "Response was somewhat brief. Examiner required a follow-up to evaluate conceptual depth."
        }
    };
};

// Generate final Viva Scorecard
export const calculateVivaScorecard = (turns: VivaQuestionTurn[], config: VivaSessionConfig): VivaScorecard => {
    if (turns.length === 0) {
        return {
            totalScore: 0,
            conceptualDepth: 0,
            technicalAccuracy: 0,
            communicationClarity: 0,
            confidenceIndex: 0,
            examinerSummary: "No examination turns completed.",
            strengths: [],
            improvementAreas: [],
            recommendedTopics: []
        };
    }

    const avgConceptual = Math.round(turns.reduce((acc, t) => acc + t.conceptualScore, 0) / turns.length);
    const avgTechnical = Math.round(turns.reduce((acc, t) => acc + t.technicalAccuracy, 0) / turns.length);
    const avgTime = turns.reduce((acc, t) => acc + t.responseTimeSeconds, 0) / turns.length;
    
    const communicationClarity = Math.min(98, Math.max(50, Math.round(100 - avgTime * 0.5)));
    const confidenceIndex = Math.min(96, Math.round((avgConceptual + avgTechnical + communicationClarity) / 3));
    const totalScore = Math.round((avgConceptual * 0.4) + (avgTechnical * 0.4) + (communicationClarity * 0.2));

    return {
        totalScore,
        conceptualDepth: avgConceptual,
        technicalAccuracy: avgTechnical,
        communicationClarity,
        confidenceIndex,
        examinerSummary: `Candidate completed a ${turns.length}-turn technical viva voce on ${config.topic}. Showed strong command over foundational concepts with excellent articulation under academic pressure.`,
        strengths: [
            "Articulate technical vocabulary and precise terminology",
            "Effective multi-turn reasoning under probing follow-up questions",
            "Strong structural explanation of core system mechanisms"
        ],
        improvementAreas: [
            "Provide quantitative benchmarks when discussing performance trade-offs",
            "Elaborate on hardware-level memory and bus constraints",
            "Include explicit error handling and fault tolerance recovery steps"
        ],
        recommendedTopics: [
            "Advanced Lock-Free Data Structures",
            "Cache Line Bouncing & NUMA Optimization",
            "Formal Verification of Distributed Protocols"
        ]
    };
};
