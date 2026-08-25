/**
 * @fileoverview Test case assertion and grading engine.
 * Runs submissions against visible and hidden evaluation test cases.
 */
const codeExecutionService = require('./codeExecutionService');

/**
 * Grades code against a suite of test cases.
 * @param {string} language - Programming language
 * @param {string} code - User's source code
 * @param {Array} testCases - Array of { input, expectedOutput }
 * @returns {Promise<Object>} Grading report
 */
const gradeSubmission = async (language, code, testCases) => {
    try {
        const results = [];
        let passedCount = 0;
        let maxTime = 0;
        let maxMemory = 0;

        for (const [index, tc] of testCases.entries()) {
            const executionResult = await codeExecutionService.executeCode(language, code, tc.input);

            const passed = executionResult.run.stdout.trim() === tc.expectedOutput.trim();
            if (passed) passedCount++;

            const time = parseFloat(executionResult.run.time);
            const memory = parseFloat(executionResult.run.memory);

            maxTime = Math.max(maxTime, time);
            maxMemory = Math.max(maxMemory, memory);

            results.push({
                testCase: index + 1,
                passed,
                expected: tc.expectedOutput,
                actual: executionResult.run.stdout.trim(),
                time: `${time}s`,
                memory: `${memory}MB`,
                error: executionResult.run.stderr || null
            });
        }

        return {
            total: testCases.length,
            passed: passedCount,
            score: Math.round((passedCount / testCases.length) * 100),
            maxTime: `${maxTime}s`,
            maxMemory: `${maxMemory}MB`,
            details: results
        };
    } catch (error) {
        console.error('Error grading submission:', error.message);
        throw new Error('Grading process failed.');
    }
};

module.exports = {
    gradeSubmission,
};
