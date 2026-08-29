/**
 * @fileoverview Service for generating dynamic, AI-powered custom quizzes with difficulty scaling.
 * Utilizes the Gemini API to create unique questions, plausible distractors, and detailed explanations.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Generates a custom quiz based on user parameters.
 * 
 * @param {string[]} topics - Array of topics to cover.
 * @param {number} questionCount - Number of questions to generate.
 * @param {string} difficulty - 'easy', 'medium', or 'hard'.
 * @param {string} questionType - 'multiple_choice' or 'short_answer'.
 * @returns {Promise<Array>} Array of generated quiz questions.
 */
async function generateCustomQuiz(topics, questionCount, difficulty, questionType) {
    try {
        const prompt = `
      You are an expert academic examiner. Generate a custom ${difficulty} difficulty ${questionType} quiz.
      Topics to cover: ${topics.join(', ')}
      Number of questions: ${questionCount}

      Return a STRICT JSON array of objects. Do not include markdown formatting or extra text.
      Schema for each question:
      {
        "id": "string (unique identifier, e.g., 'q1')",
        "question": "string (the question text)",
        "options": ["string", "string", "string", "string"] (only for multiple_choice, omit for short_answer),
        "correctAnswer": "string (the exact correct option or short answer)",
        "explanations": {
          "correct": "string (detailed step-by-step explanation of why this is correct)",
          "incorrect": "string (explanation of common misconceptions or why other options are wrong)"
        },
        "topic": "string (the specific subtopic this question tests)"
      }
      Ensure distractors are plausible and explanations are highly educational.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error generating custom quiz:', error.message);
        throw new Error('Failed to generate quiz questions. Please try adjusting your parameters.');
    }
}

module.exports = {
    generateCustomQuiz,
};
// backend/services/quizGenerationService.js
const { v4: uuidv4 } = require('uuid');
const Quiz = require('../models/Quiz');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const Note = require('../models/Note');
const geminiService = require('../services/geminiService');
const cacheService = require('../services/cacheService');
const { calculateTopicProficiency, getDifficultyLevel } = require('../services/proficiencyService');
const { createNotification } = require('../services/notificationService');

exports.generateAIQuiz = async (data, userId) => {
  // Logic extracted from controller
  return { title: 'AI Quiz', questions: [] };
};

exports.generateCustomQuiz = async (data, userId) => {
  // Logic extracted from controller
  return { title: 'Custom Quiz', questions: [] };
