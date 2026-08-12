const { GoogleGenAI } = require('@google/genai');
const pdfParse = require('pdf-parse');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.generateQuizFromPdf = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a valid PDF chapter file (up to 15MB)' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    
    // Clean up temporary uploaded file
    fs.unlinkSync(req.file.path);

    const extractedText = pdfData.text.slice(0, 15000); // Limit context window length if necessary

    const prompt = `
      You are an expert exam creator and educator. Analyze the following textbook/syllabus PDF text content and generate a practice test consisting of 15 high-quality questions (mix of Multiple Choice Questions and Subjective questions).
      
      Text Content:
      """
      ${extractedText}
      """

      Return the output strictly as a JSON object matching this schema:
      {
        "title": "Generated Quiz Title based on content",
        "questions": [
          {
            "question": "Question text here?",
            "type": "mcq", // or "subjective"
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correctAnswer": "Option A",
            "explanation": "Detailed explanation of why this is correct."
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const quizData = JSON.parse(response.text);

    res.status(200).json({
      success: true,
      quiz: quizData,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};
