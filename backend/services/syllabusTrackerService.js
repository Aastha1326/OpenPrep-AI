/**
 * @fileoverview Service for parsing syllabus text, tracking mastery levels, and predicting completion dates.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Parses raw syllabus text into a structured hierarchy of modules, topics, and subtopics.
 * @param {string} syllabusText - The raw text of the syllabus.
 * @returns {Promise<Array>} Structured syllabus data.
 */
async function parseSyllabus(syllabusText) {
    try {
        const prompt = `
      You are an expert academic planner. Parse the following syllabus text into a structured JSON array of modules, topics, and subtopics.
      Syllabus: "${syllabusText}"
      
      Return STRICT JSON only, no markdown:
      [
        {
          "id": "mod_1",
          "name": "Module Name",
          "topics": [
            {
              "id": "top_1",
              "name": "Topic Name",
              "subtopics": [
                { "id": "sub_1", "name": "Subtopic Name", "mastery": "not_started" }
              ]
            }
          ]
        }
      ]
      Mastery levels must be exactly: "not_started", "reviewing", or "mastered".
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();
        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error parsing syllabus:', error.message);
        throw new Error('Failed to parse syllabus. Please ensure the text is clear and structured.');
    }
}

/**
 * Calculates the predicted completion date based on historical study velocity.
 * @param {Array} syllabusData - The structured syllabus data.
 * @param {number} itemsCompletedPerDay - Average number of subtopics mastered per day.
 * @returns {string} Predicted completion date in ISO format.
 */
function predictCompletionDate(syllabusData, itemsCompletedPerDay) {
    let totalSubtopics = 0;
    let completedSubtopics = 0;

    syllabusData.forEach(mod => {
        mod.topics.forEach(top => {
            top.subtopics.forEach(sub => {
                totalSubtopics++;
                if (sub.mastery === 'mastered') {
                    completedSubtopics++;
                }
            });
        });
    });

    const remaining = totalSubtopics - completedSubtopics;
    if (itemsCompletedPerDay <= 0) return null;

    const daysRemaining = Math.ceil(remaining / itemsCompletedPerDay);
    const predictedDate = new Date();
    predictedDate.setDate(predictedDate.getDate() + daysRemaining);

    return predictedDate.toISOString().split('T')[0];
}

module.exports = {
    parseSyllabus,
    predictCompletionDate,
};
