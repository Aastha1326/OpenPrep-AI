/**
 * @fileoverview Controller for code execution and automated grading.
 */
const gradingService = require('../services/gradingService');

/**
 * Executes code against sample visible test cases
 */
const runSample = async (req, res) => {
    try {
        const { language, code, testCases } = req.body;

        if (!language || !code || !Array.isArray(testCases)) {
            return res.status(400).json({ success: false, message: 'language, code, and testCases array are required' });
        }

        const result = await gradingService.gradeSubmission(language, code, testCases);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error running sample:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * Grades code against complete hidden test suite
 */
const submitForGrading = async (req, res) => {
    try {
        const { language, code, problemId } = req.body;

        // Mock hidden test cases fetching based on problemId
        const hiddenTestCases = [
            { input: "10\n", expectedOutput: "55" },
            { input: "100\n", expectedOutput: "5050" }
        ];

        const result = await gradingService.gradeSubmission(language, code, hiddenTestCases);
        res.status(200).json({ success: true, data: result });
    } catch (error) {
        console.error('Error submitting for grading:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    runSample,
    submitForGrading,
};
