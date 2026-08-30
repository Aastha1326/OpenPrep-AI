/**
 * @fileoverview Service for managing multi-turn AI study companion conversations.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Generates a response based on the conversation history and user input.
 * 
 * @param {Array} history - Array of previous messages.
 * @param {string} newUserMessage - The latest message from the user.
 * @returns {Promise<string>} The AI's response.
 */
async function generateStudyResponse(history, newUserMessage) {
    try {
        // Construct a system prompt to enforce the persona
        const systemPrompt = "You are an expert, encouraging, and concise AI study companion. Your goal is to help students understand complex topics through guided questioning and clear explanations. Do not just give answers; guide the user to the solution. Format math with LaTeX.";

        // Format history for Gemini API
        const chatHistory = history.map(msg => ({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }],
        }));

        // Start chat with history
        const chat = model.startChat({
            history: chatHistory,
            generationConfig: {
                maxOutputTokens: 500,
                temperature: 0.7,
            },
        });

        const result = await chat.sendMessage(newUserMessage);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error generating study response:', error.message);
        throw new Error('Failed to get a response from the study companion.');
    }
}

module.exports = {
    generateStudyResponse,
};