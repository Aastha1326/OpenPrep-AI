/**
 * @fileoverview Service for analyzing user responses for confidence and sentiment using Gemini.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Analyzes a user's text response for confidence, sentiment, and keywords.
 * 
 * @param {string} userResponse - The text to analyze.
 * @returns {Promise<Object>} Structured analysis data.
 */
async function analyzeResponseSentiment(userResponse) {
    try {
        const prompt = `
      You are an expert communication coach analyzing a candidate's interview response.
      Response: "${userResponse}"

      Return a STRICT JSON object with the following schema. No markdown:
      {
        "confidenceScore": number (1 to 10, based on assertiveness, clarity, and lack of filler words),
        "sentiment": "positive" | "neutral" | "negative",
        "keywords": string[] (top 3-5 technical or domain-specific terms used),
        "feedback": string (1 sentence on how to improve delivery)
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error in sentiment analysis:', error.message);
        throw new Error('Failed to analyze response sentiment.');
    }
}

module.exports = {
    analyzeResponseSentiment,
};
