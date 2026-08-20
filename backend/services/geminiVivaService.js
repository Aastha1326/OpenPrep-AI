/**
 * @fileoverview Service for handling Gemini API interactions for Oral Viva simulation.
 * Evaluates user responses, scores them, and generates contextual follow-up questions.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API with the key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Evaluates a user's spoken answer and generates a follow-up question.
 * 
 * @param {string} currentQuestion - The question asked to the user.
 * @param {string} userAnswer - The transcribed text of the user's answer.
 * @param {string} topic - The subject or topic of the viva.
 * @returns {Promise<Object>} Evaluation score, feedback, and the next question.
 */
async function evaluateVivaResponse(currentQuestion, userAnswer, topic) {
    try {
        const prompt = `
      You are an expert academic examiner conducting an oral viva voce on the topic of "${topic}".
      The question asked was: "${currentQuestion}"
      The student's transcribed answer is: "${userAnswer}"

      Please evaluate the answer and provide a JSON response with the following strict schema:
      {
        "score": number (1 to 10, based on accuracy, depth, and clarity),
        "feedback": string (constructive, encouraging feedback, max 2 sentences),
        "strengths": string[] (1-2 specific things the student did well),
        "weaknesses": string[] (1-2 areas for improvement),
        "nextQuestion": string (a logical, slightly deeper follow-up question based on their answer)
      }
      Ensure the output is valid JSON only, with no markdown formatting or extra text.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // Clean up markdown code blocks if Gemini returns them
        const cleanJson = text.replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error in Gemini Viva Evaluation:', error.message);
        throw new Error('Failed to evaluate response. Please try again.');
    }
}

/**
 * Generates an initial viva question for a given topic.
 * 
 * @param {string} topic - The subject or topic of the viva.
 * @returns {Promise<string>} The initial question.
 */
async function generateInitialQuestion(topic) {
    try {
        const prompt = `
      You are an expert academic examiner. Generate a foundational, open-ended oral viva question 
      for a student studying "${topic}". The question should be clear, concise, and designed to 
      test fundamental understanding. Return ONLY the question text, no other formatting.
    `;
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text().trim().replace(/^["']|["']$/g, '');
    } catch (error) {
        console.error('Error generating initial question:', error.message);
        throw new Error('Failed to generate initial question.');
    }
}

module.exports = {
    evaluateVivaResponse,
    generateInitialQuestion,
};
