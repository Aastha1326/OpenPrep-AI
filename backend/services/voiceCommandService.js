/**
 * @fileoverview Service for processing complex voice queries via the Gemini API.
 * Acts as a fallback when frontend command parsing is insufficient.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Processes a transcribed voice command that requires contextual understanding.
 * 
 * @param {string} transcript - The transcribed voice input.
 * @param {string} userContext - Optional context about the user's current study topic.
 * @returns {Promise<Object>} Actionable response or answer.
 */
async function processComplexVoiceQuery(transcript, userContext = '') {
    try {
        const prompt = `
      You are a hands-free study assistant. The user has spoken the following command or question:
      "${transcript}"
      
      Current study context: "${userContext}"

      Determine the user's intent. If it's a direct question about the study context, answer it concisely (max 3 sentences). 
      If it's a command (e.g., "summarize this", "create a flashcard"), acknowledge the command and state what action would be taken.
      
      Return a STRICT JSON object:
      {
        "intent": "question" | "command" | "navigation",
        "action": "string (e.g., 'create_flashcard', 'summarize_note', 'answer_question')",
        "response": "string (the spoken response to read back to the user)"
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error processing voice query:', error.message);
        throw new Error('Failed to process voice command. Please try rephrasing.');
    }
}

module.exports = {
    processComplexVoiceQuery,
};
