const { GoogleGenAI } = require('@google/genai');
const Quiz = require('../models/Quiz');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.getNextAdaptiveQuestion = async (req, res, next) => {
  try {
    const { quizId, currentStreak, streakType, currentDifficulty, answeredQuestionIds } = req.body;

    let nextDifficulty = currentDifficulty || 'Medium';

    // Adjust difficulty after every 3 consecutive correct or incorrect answers
    if (currentStreak >= 3) {
      if (streakType === 'correct' && currentDifficulty === 'Easy') nextDifficulty = 'Medium';
      else if (streakType === 'correct' && currentDifficulty === 'Medium') nextDifficulty = 'Hard';
      else if (streakType === 'incorrect' && currentDifficulty === 'Hard') nextDifficulty = 'Medium';
      else if (streakType === 'incorrect' && currentDifficulty === 'Medium') nextDifficulty = 'Easy';
    }

    const prompt = `
      Generate a single high-quality Multiple Choice Question (MCQ) of difficulty level "${nextDifficulty}" for an active quiz session.
      Avoid duplicating these previously asked question IDs: ${JSON.stringify(answeredQuestionIds || [])}.
      
      Return the output strictly as a JSON object matching this schema:
      {
        "id": "unique_question_id",
        "question": "Question text here?",
        "difficulty": "${nextDifficulty}",
        "options": ["Option A", "Option B", "Option C", "Option D"],
        "correctAnswer": 0,
        "explanation": "Detailed explanation."
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const questionData = JSON.parse(response.text);

    res.status(200).json({
      success: true,
      difficulty: nextDifficulty,
      question: questionData,
    });
  } catch (error) {
    next(error);
  }
};
