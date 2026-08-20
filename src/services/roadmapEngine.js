/**
 * AI Study Roadmap Generator Engine
 * Weekly module milestone generators, task completion reducers, and readiness progress calculators.
 */

export interface RoadmapTask {
    id: string;
    title: string;
    estimatedMinutes: number;
    completed: boolean;
}

export interface RoadmapWeekModule {
    weekNumber: number;
    themeTitle: string;
    description: string;
    tasks: RoadmapTask[];
}

export const DEFAULT_PREPARATION_ROADMAP: RoadmapWeekModule[] = [
    {
        weekNumber: 1,
        themeTitle: "Core Data Structures & Complexity",
        description: "Master Hash Maps, Arrays, Two Pointers, and Sliding Window patterns.",
        tasks: [
            { id: "w1_t1", title: "Solve 5 Hash Map & Two Pointer Problems", estimatedMinutes: 90, completed: true },
            { id: "w1_t2", title: "Review Big-O Space & Time Complexity Analysis", estimatedMinutes: 45, completed: true },
            { id: "w1_t3", title: "Complete Mock Session on Array Eviction", estimatedMinutes: 60, completed: false }
        ]
    },
    {
        weekNumber: 2,
        themeTitle: "System Design Foundations",
        description: "Focus on Load Balancers, Caching Strategies (Redis), and Relational vs NoSQL DBs.",
        tasks: [
            { id: "w2_t1", title: "Diagram Global Rate Limiter on System Design Canvas", estimatedMinutes: 75, completed: false },
            { id: "w2_t2", title: "Study Database Sharding & Indexing Strategies", estimatedMinutes: 60, completed: false }
        ]
    }
];

export const calculateRoadmapProgress = (roadmap: RoadmapWeekModule[]) => {
    let totalTasks = 0;
    let completedTasks = 0;

    roadmap.forEach(w => {
        w.tasks.forEach(t => {
            totalTasks++;
            if (t.completed) completedTasks++;
        });
    });

    const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    return { totalTasks, completedTasks, completionPercentage };
};
