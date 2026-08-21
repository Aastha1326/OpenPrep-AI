/**
 * @fileoverview Service for generating AI-powered dynamic study plans.
 * Utilizes the Gemini API to distribute syllabus topics intelligently based on exam date and daily constraints.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Generates a structured, day-by-day study schedule.
 * 
 * @param {string} examDate - The target exam date (ISO string).
 * @param {string[]} topics - Array of syllabus topics to cover.
 * @param {number} dailyHours - Available study hours per day.
 * @returns {Promise<Object>} The generated study plan in JSON format.
 */
async function generateStudyPlan(examDate, topics, dailyHours) {
    try {
        const prompt = `
      You are an expert academic planner. Create a day-by-day study plan.
      Exam Date: ${examDate}
      Topics to cover: ${topics.join(', ')}
      Available study hours per day: ${dailyHours}

      Return a STRICT JSON object with the following schema. Do not include markdown formatting or extra text:
      {
        "totalDays": number,
        "schedule": [
          {
            "date": "YYYY-MM-DD",
            "topics": ["topic1", "topic2"],
            "estimatedHours": number,
            "focusArea": "string (e.g., Revision, Deep Dive, Practice)",
            "notes": "string (brief motivational or strategic note)"
          }
        ],
        "overallStrategy": "string (1-2 sentences summarizing the approach)"
      }
      Ensure the dates progress logically up to the exam date and the estimatedHours do not exceed the dailyHours limit.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error generating study plan:', error.message);
        throw new Error('Failed to generate study plan. Please check your inputs and try again.');
    }
}

module.exports = {
    generateStudyPlan,
};
