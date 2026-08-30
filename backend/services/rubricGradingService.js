const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Automatically grades transcribed student answers against reference keys and rubric configurations using Gemini.
 */
async function evaluateAnswerAgainstRubric(transcribedText, modelAnswer, rubricDescription) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: { responseMimeType: 'application/json' }
  });

  const prompt = `
    You are an expert exam evaluator. Grade the student's transcribed answer against the official model answer and rubric criteria.
    
    Student Transcribed Answer:
    """
    ${transcribedText}
    """
    
    Official Model Answer:
    """
    ${modelAnswer}
    """
    
    Rubric Criteria & Marks Allocation:
    """
    ${rubricDescription}
    """
    
    Return a JSON object containing the evaluation results:
    {
      "totalScore": number,
      "maxScore": number,
      "criteria": [
        {
          "name": "Step Method" | "Calculation Accuracy" | "Final Answer" | "Diagram Accuracy",
          "score": number,
          "maxScore": number,
          "feedback": "string detailing what was done well or missed"
        }
      ],
      "feedbackAnnotations": [
        {
          "line": number (approximate line number starting from 1 of student answer),
          "severity": "info" | "warning" | "error",
          "message": "comment pointing to specific error or suggestion"
        }
      ],
      "overallFeedback": "detailed constructive feedback outlining what needs to be improved"
    }
  `;

  try {
    const response = await model.generateContent(prompt);
    const resultText = response.response.text();
    return JSON.parse(resultText);
  } catch (err) {
    console.error('[RubricGradingService] Gemini grading failed:', err.message);
    // Return a fallback evaluation structure if JSON parse or API fails
    return {
      totalScore: 0,
      maxScore: 10,
      criteria: [
        { name: 'Step Method', score: 0, maxScore: 3, feedback: 'Grading failed.' },
        { name: 'Calculation Accuracy', score: 0, maxScore: 3, feedback: 'Grading failed.' },
        { name: 'Final Answer', score: 0, maxScore: 2, feedback: 'Grading failed.' },
        { name: 'Diagram Accuracy', score: 0, maxScore: 2, feedback: 'Grading failed.' }
      ],
      feedbackAnnotations: [
        { line: 1, severity: 'error', message: 'Could not complete AI grading evaluation.' }
      ],
      overallFeedback: 'The grading service experienced an error. Please try again.'
    };
  }
}

module.exports = {
  evaluateAnswerAgainstRubric,
};
