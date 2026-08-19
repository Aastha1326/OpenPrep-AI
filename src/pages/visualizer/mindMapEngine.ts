/**
 * Interactive AI Mind Map & Dynamic Concept Node Graph Visualizer Engine
 * Data models, graph layout algorithms, node presets, and detail aggregators.
 */

export interface MindMapNode {
    id: string;
    label: string;
    category: 'root' | 'subject' | 'subtopic' | 'concept' | 'formula';
    description: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    keyFormulas?: string[];
    flashcardCount: number;
    masteryPercentage: number;
    children?: string[]; // Child node IDs
    position: { x: number; y: number };
}

export interface MindMapEdge {
    id: string;
    source: string;
    target: string;
    label?: string;
    animated?: boolean;
    type?: 'smoothstep' | 'straight' | 'default';
}

export interface MindMapGraphData {
    id: string;
    title: string;
    subject: string;
    nodes: MindMapNode[];
    edges: MindMapEdge[];
    createdAt: string;
}

// Preset Mind Map Data for Demonstration & Instant Rendering
export const PRESET_MIND_MAPS: Record<string, MindMapGraphData> = {
    "os_concurrency": {
        id: "mm_os_101",
        title: "Operating Systems: Concurrency & Synchronization Topology",
        subject: "Computer Science",
        createdAt: "2026-08-19",
        nodes: [
            {
                id: "node_root",
                label: "OS Concurrency Control",
                category: "root",
                description: "Core kernel mechanics governing multi-threaded thread management, shared memory protection, and synchronization primitives.",
                difficultyLevel: "advanced",
                flashcardCount: 24,
                masteryPercentage: 88,
                children: ["node_deadlock", "node_sync", "node_threads"],
                position: { x: 450, y: 50 }
            },
            {
                id: "node_deadlock",
                label: "System Deadlocks",
                category: "subject",
                description: "State where a set of processes are permanently blocked because each process holds a resource required by another.",
                difficultyLevel: "intermediate",
                keyFormulas: ["Coffman Conditions: {Mutex, Hold&Wait, NoPreemption, CircularWait}"],
                flashcardCount: 8,
                masteryPercentage: 92,
                children: ["node_bankers", "node_lock_ordering"],
                position: { x: 150, y: 220 }
            },
            {
                id: "node_sync",
                label: "Synchronization Primitives",
                category: "subject",
                description: "Hardware and software abstractions providing atomic mutual exclusion across execution pipelines.",
                difficultyLevel: "intermediate",
                keyFormulas: ["Peterson Algorithm", "CAS: Compare-And-Swap(addr, old, new)"],
                flashcardCount: 10,
                masteryPercentage: 82,
                children: ["node_semaphores", "node_monitors"],
                position: { x: 450, y: 220 }
            },
            {
                id: "node_threads",
                label: "Thread Execution Models",
                category: "subject",
                description: "User-space vs Kernel-space threading mechanisms (1:1, N:1, M:N hybrid scheduling models).",
                difficultyLevel: "beginner",
                flashcardCount: 6,
                masteryPercentage: 95,
                children: ["node_context_switch"],
                position: { x: 750, y: 220 }
            },
            {
                id: "node_bankers",
                label: "Banker's Safety Algorithm",
                category: "concept",
                description: "Dijkstra's deadlock avoidance protocol testing for safe states by simulating maximum resource allocation matrices.",
                difficultyLevel: "advanced",
                keyFormulas: ["Need[i,j] = Max[i,j] - Allocation[i,j]"],
                flashcardCount: 4,
                masteryPercentage: 78,
                position: { x: 50, y: 400 }
            },
            {
                id: "node_lock_ordering",
                label: "Lock Acquisition Hierarchies",
                category: "concept",
                description: "Enforcing strict global ordering on mutex locks to eliminate circular wait conditions statically at compile time.",
                difficultyLevel: "intermediate",
                flashcardCount: 3,
                masteryPercentage: 90,
                position: { x: 250, y: 400 }
            },
            {
                id: "node_semaphores",
                label: "Dijkstra Semaphores (P & V)",
                category: "concept",
                description: "Integer atomic counter variables modified only through wait() [P] and signal() [V] operations.",
                difficultyLevel: "intermediate",
                keyFormulas: ["wait(S): S.value--; if (S.value < 0) block();"],
                flashcardCount: 5,
                masteryPercentage: 85,
                position: { x: 400, y: 400 }
            },
            {
                id: "node_monitors",
                label: "Condition Variables & Monitors",
                category: "concept",
                description: "High-level language synchronization construct enclosing private data with mutual exclusion access functions.",
                difficultyLevel: "advanced",
                flashcardCount: 4,
                masteryPercentage: 74,
                position: { x: 550, y: 400 }
            },
            {
                id: "node_context_switch",
                label: "Thread Context Switch Overhead",
                category: "concept",
                description: "Saving CPU registers, Program Counter (PC), and Stack Pointer (SP) while switching process memory maps.",
                difficultyLevel: "intermediate",
                flashcardCount: 3,
                masteryPercentage: 91,
                position: { x: 750, y: 400 }
            }
        ],
        edges: [
            { id: "e_root_deadlock", source: "node_root", target: "node_deadlock", label: "Causes & Prevention", type: "smoothstep", animated: true },
            { id: "e_root_sync", source: "node_root", target: "node_sync", label: "Kernel Primitives", type: "smoothstep", animated: true },
            { id: "e_root_threads", source: "node_root", target: "node_threads", label: "Execution Units", type: "smoothstep" },
            { id: "e_deadlock_bankers", source: "node_deadlock", target: "node_bankers", label: "Avoidance" },
            { id: "e_deadlock_lock", source: "node_deadlock", target: "node_lock_ordering", label: "Prevention" },
            { id: "e_sync_semaphores", source: "node_sync", target: "node_semaphores", label: "Atomic Counters" },
            { id: "e_sync_monitors", source: "node_sync", target: "node_monitors", label: "Language Level" },
            { id: "e_threads_context", source: "node_threads", target: "node_context_switch", label: "CPU Switching" }
        ]
    }
};

// Generate dynamic nodes from user text prompt
export const generateMindMapFromText = (topicTitle: string): MindMapGraphData => {
    return {
        id: `mm_custom_${Date.now()}`,
        title: topicTitle,
        subject: "AI Synthesized Syllabus Map",
        createdAt: new Date().toISOString().split('T')[0],
        nodes: [
            {
                id: "custom_root",
                label: topicTitle,
                category: "root",
                description: `AI-generated core concept map breakdown for ${topicTitle}.`,
                difficultyLevel: "intermediate",
                flashcardCount: 15,
                masteryPercentage: 85,
                position: { x: 450, y: 50 }
            },
            {
                id: "custom_sub1",
                label: `${topicTitle} Foundations`,
                category: "subject",
                description: "Primary theoretical principles, axioms, and core definitions.",
                difficultyLevel: "beginner",
                flashcardCount: 5,
                masteryPercentage: 90,
                position: { x: 200, y: 220 }
            },
            {
                id: "custom_sub2",
                label: "Architectural Mechanics",
                category: "subject",
                description: "Internal structural components, system pipelines, and workflow layers.",
                difficultyLevel: "intermediate",
                flashcardCount: 6,
                masteryPercentage: 80,
                position: { x: 700, y: 220 }
            }
        ],
        edges: [
            { id: "e_c_1", source: "custom_root", target: "custom_sub1", animated: true },
            { id: "e_c_2", source: "custom_root", target: "custom_sub2", animated: true }
        ]
    };
};
