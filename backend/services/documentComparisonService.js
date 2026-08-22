/**
 * @fileoverview Service for comparing two documents and analyzing conceptual overlap.
 * Utilizes the Gemini API to identify shared concepts, unique points, and contradictions.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Compares two text documents and categorizes their content.
 * 
 * @param {string} textA - Content of the first document.
 * @param {string} textB - Content of the second document.
 * @returns {Promise<Object>} Structured comparison analysis.
 */
async function compareDocuments(textA, textB) {
    try {
        const prompt = `
      You are an expert academic analyst. Compare the following two study documents.
      
      Document A:
      """${textA.substring(0, 3000)}"""
      
      Document B:
      """${textB.substring(0, 3000)}"""

      Return a STRICT JSON object with the following schema. Do not include markdown formatting:
      {
        "sharedConcepts": [
          {
            "concept": "string",
            "description": "string (how it is treated in both)"
          }
        ],
        "uniqueToA": [
          {
            "point": "string",
            "importance": "high" | "medium" | "low"
          }
        ],
        "uniqueToB": [
          {
            "point": "string",
            "importance": "high" | "medium" | "low"
          }
        ],
        "contradictions": [
          {
            "topic": "string",
            "conflict": "string (brief explanation of the discrepancy)"
          }
        ],
        "summaryReport": "string (1-2 paragraphs highlighting the most critical gaps and overall synergy)"
      }
      Limit arrays to top 5 items each for conciseness.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error comparing documents:', error.message);
        throw new Error('Failed to compare documents. Ensure texts are not empty.');
    }
}

module.exports = {
    compareDocuments,
};
