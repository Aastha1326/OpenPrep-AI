/**
 * Coding Challenge Sandbox Engine
 * Problem definitions, test case runners, execution simulators, and complexity analyzers.
 */

export interface TestCase {
    id: string;
    inputStr: string;
    expectedOutput: string;
    passed: boolean;
}

export interface CodingProblem {
    id: string;
    title: string;
    difficulty: 'Easy' | 'Medium' | 'Hard';
    category: 'Arrays' | 'Strings' | 'Trees' | 'Dynamic Programming';
    description: string;
    starterCodeJavaScript: string;
    starterCodePython: string;
    testCases: TestCase[];
    timeComplexityTarget: string;
    spaceComplexityTarget: string;
}

export const MOCK_CODING_PROBLEMS: CodingProblem[] = [
    {
        id: "prob_1",
        title: "Two Sum - Optimal Hash Table Approach",
        difficulty: "Easy",
        category: "Arrays",
        description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`. You may assume that each input would have exactly one solution.",
        starterCodeJavaScript: "function twoSum(nums, target) {\n    const map = new Map();\n    for (let i = 0; i < nums.length; i++) {\n        const diff = target - nums[i];\n        if (map.has(diff)) return [map.get(diff), i];\n        map.set(nums[i], i);\n    }\n    return [];\n}",
        starterCodePython: "def two_sum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []",
        testCases: [
            { id: "tc_1", inputStr: "nums = [2, 7, 11, 15], target = 9", expectedOutput: "[0, 1]", passed: true },
            { id: "tc_2", inputStr: "nums = [3, 2, 4], target = 6", expectedOutput: "[1, 2]", passed: true },
            { id: "tc_3", inputStr: "nums = [3, 3], target = 6", expectedOutput: "[0, 1]", passed: true }
        ],
        timeComplexityTarget: "O(N)",
        spaceComplexityTarget: "O(N)"
    }
];

export const runCodeExecutionSimulator = (code: string) => {
    return {
        status: "Accepted",
        runtimeMs: 48,
        memoryUsageMb: 42.1,
        testsPassedCount: 3,
        testsTotalCount: 3,
        timeComplexityResult: "O(N)",
        spaceComplexityResult: "O(N)"
    };
};
