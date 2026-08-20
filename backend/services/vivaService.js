const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = (apiKey && apiKey !== 'your_gemini_api_key_here') ? new GoogleGenerativeAI(apiKey) : null;

const examinerSystemPrompt = `
You are a strict yet supportive academic examiner conducting an oral viva voce examination.
Your job is to test the student's depth of understanding, request derivations or deeper explanations when answers are brief or vague, and ask logical follow-up questions.
Keep your questions concise, professional, and targeted to academic concepts.
`;

/**
 * Generates the initial technical question for the subject
 * @param {string} subjectName
 * @returns {Promise<string>}
 */
const generateFirstQuestion = async (subjectName) => {
  if (!genAI) {
    return `Welcome to the viva voce examination for ${subjectName || 'General Studies'}. Let's begin: Can you explain the difference between processes and threads in Operating Systems, and how they share resources?`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `
      ${examinerSystemPrompt}
      Subject: ${subjectName}.
      Ask a challenging, open-ended introductory technical viva question. Keep it concise (under 2 sentences).
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini first question failed:', err);
    return `Let's begin: Please explain the core working principles of ${subjectName || 'this subject'}.`;
  }
};

/**
 * Generates follow-up technical questions based on history and student answer
 * @param {string} subjectName
 * @param {object[]} turnsHistory
 * @param {string} studentAnswer
 * @returns {Promise<string>}
 */
const generateFollowUp = async (subjectName, turnsHistory, studentAnswer) => {
  if (!genAI) {
    return `Thank you for your response. That is a reasonable explanation. Can you elaborate further on how we handle optimization or edge cases under that scenario?`;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const formattedHistory = turnsHistory
      .map((t) => `${t.speaker === 'AI' ? 'Examiner' : 'Student'}: ${t.text}`)
      .join('\n');

    const prompt = `
      ${examinerSystemPrompt}
      Subject: ${subjectName}.
      
      Here is the conversation history:
      ${formattedHistory}
      
      Student responded: "${studentAnswer}"
      
      Based on the student's answer, ask a challenging follow-up question. 
      If they were vague or made errors, prompt them to clarify.
      Keep the follow-up concise (under 2 sentences).
    `;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (err) {
    console.error('Gemini follow up failed:', err);
    return `Can you explain the main limitations or trade-offs of the approach you just described?`;
  }
};

/**
 * Generates final Performance Scorecard evaluation JSON
 * @param {string} subjectName
 * @param {object[]} turnsHistory
 * @returns {Promise<object>}
 */
const generateFinalScorecard = async (subjectName, turnsHistory) => {
  const fallbackScorecard = {
    score: 75,
    conceptualDepth: 70,
    technicalAccuracy: 80,
    communicationClarity: 75,
    feedback: 'Good overall performance. Work on explaining mathematical derivations and structural edge cases more clearly.',
    masteryBreakdown: [
      { area: 'Conceptual Depth', score: 70 },
      { area: 'Technical Accuracy', score: 80 },
      { area: 'Communication Clarity', score: 75 }
    ]
  };

  if (!genAI) {
    return fallbackScorecard;
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const formattedHistory = turnsHistory
      .map((t) => `${t.speaker === 'AI' ? 'Examiner' : 'Student'}: ${t.text}`)
      .join('\n');

    const prompt = `
      You are an academic evaluator scoring a student's oral viva voce interview.
      Subject: ${subjectName}
      
      Analyze the interview transcript:
      ${formattedHistory}

      Evaluate performance out of 100 on three rubrics:
      1. Conceptual Depth (understanding of foundational concepts, ability to explain details)
      2. Technical Accuracy (correctness of definitions, terms, and statements)
      3. Communication Clarity (articulateness, focus of answer)

      Return STRICTLY a JSON object matching this structure:
      {
        "score": number (average score out of 100),
        "conceptualDepth": number (0-100),
        "technicalAccuracy": number (0-100),
        "communicationClarity": number (0-100),
        "feedback": "string (verbal constructive advice)",
        "masteryBreakdown": [
          { "area": "Conceptual Depth", "score": number },
          { "area": "Technical Accuracy", "score": number },
          { "area": "Communication Clarity", "score": number }
        ]
      }
      Do not include any code block tags, markdown, or text outside the JSON object.
    `;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (err) {
    console.error('Gemini evaluation failed:', err);
    return fallbackScorecard;
  }
};

module.exports = {
  generateFirstQuestion,
  generateFollowUp,
  generateFinalScorecard,
};
