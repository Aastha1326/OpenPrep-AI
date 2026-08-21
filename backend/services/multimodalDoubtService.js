/**
 * @fileoverview Service for processing images and text to provide step-by-step doubt solutions.
 * Leverages Gemini's vision capabilities for multi-modal analysis.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Use a model that supports vision capabilities
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Analyzes an image and optional text to provide a structured solution.
 * 
 * @param {string} base64Image - The image data in base64 format (without the data URI prefix).
 * @param {string} userText - Optional text context provided by the user.
 * @returns {Promise<string>} Markdown-formatted step-by-step solution.
 */
async function solveDoubt(base64Image, userText) {
    try {
        const prompt = `
      You are an expert academic tutor. A student has uploaded an image of a problem (e.g., math equation, diagram, code snippet) along with some context.
      
      User Context: "${userText || 'No additional context provided.'}"

      Please analyze the image and provide a solution. Your response MUST follow this structure:
      1. **Problem Identification**: Briefly state what the problem is asking.
      2. **Step-by-Step Solution**: Break down the solution logically. Use LaTeX formatting for math (e.g., $x^2$) and code blocks for code.
      3. **Key Concept**: Mention the core academic concept being tested.
      
      Be clear, encouraging, and precise.
    `;

        const imageParts = [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: "image/jpeg", // Assuming JPEG for simplicity, can be dynamic
                },
            },
        ];

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        return response.text();
    } catch (error) {
        console.error('Error in multimodal doubt solving:', error.message);
        throw new Error('Failed to analyze the image. Please ensure it is clear and try again.');
    }
}

module.exports = {
    solveDoubt,
};
