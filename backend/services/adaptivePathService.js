/**
 * @fileoverview Service for generating AI-powered personalized study paths.
 * Analyzes user performance data to recommend topics and adjust difficulty dynamically.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Generates an adaptive study path based on user performance and weak areas.
 * 
 * @param {Array} weakTopics - Array of topics the user struggled with.
 * @param {Array} completedTopics - Array of topics the user has mastered.
 * @param {number} daysUntilExam - Number of days remaining until the exam.
 * @param {string} subject - The main subject of study.
 * @returns {Promise<Object>} Structured JSON representing the study path (nodes and edges).
 */
async function generateAdaptivePath(weakTopics, completedTopics, daysUntilExam, subject) {
    try {
        const prompt = `
      You are an expert academic planner and AI tutor. 
      Subject: ${subject}
      Days until exam: ${daysUntilExam}
      Weak topics (need more focus): ${weakTopics.join(', ')}
      Completed/Mastered topics: ${completedTopics.join(', ')}

      Create a personalized, adaptive study path. Prioritize weak topics but ensure foundational prerequisites are met.
      Return a STRICT JSON object with the following schema. Do not include markdown formatting or extra text:
      {
        "pathName": "string",
        "estimatedCompletionDays": number,
        "nodes": [
          {
            "id": "string (unique identifier)",
            "topic": "string",
            "difficulty": "Easy" | "Medium" | "Hard",
            "estimatedMinutes": number,
            "status": "locked" | "available" | "completed",
            "description": "string (brief learning objective)"
          }
        ],
        "edges": [
          {
            "source": "string (id of prerequisite node)",
            "target": "string (id of dependent node)",
            "relationship": "string (e.g., 'prerequisite for', 'builds upon')"
          }
        ]
      }
      Ensure the graph is logically connected and the total estimated minutes fit within the available days (assuming 2-3 hours/day).
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error generating adaptive study path:', error.message);
        throw new Error('Failed to generate personalized study path. Please try again later.');
    }
}

/**
 * Updates the study path dynamically based on new quiz results.
 * 
 * @param {Object} currentPath - The existing study path object.
 * @param {string} completedNodeId - The ID of the node just completed.
 * @param {number} score - The score achieved on the completion assessment (0-100).
 * @returns {Promise<Object>} The updated study path.
 */
async function updatePathDynamically(currentPath, completedNodeId, score) {
    try {
        const prompt = `
      You are an AI tutor adjusting a student's study path.
      Current Path: ${JSON.stringify(currentPath)}
      The student just completed node ID: "${completedNodeId}" with a score of ${score}/100.

      If the score is below 70, mark the node as "available" for review and add a remedial sub-topic if possible.
      If the score is 70 or above, mark the node as "completed" and unlock its dependent nodes (change status from "locked" to "available").
      
      Return the updated STRICT JSON object matching the original schema. Do not include markdown formatting.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error updating study path dynamically:', error.message);
        throw new Error('Failed to update study path based on performance.');
    }
}

module.exports = {
    generateAdaptivePath,
    updatePathDynamically,
};
