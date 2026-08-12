const { GoogleGenAI } = require('@google/genai');
const pdfParse = require('pdf-parse');
const fs = require('fs');
const PYQDraft = require('../models/PYQDraft'); // Draft review queue model

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.parsePyqPdf = async (req, res, next) => {
  const startTime = Date.now();
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a multi-page PYQ PDF file.' });
    }

    const dataBuffer = fs.readFileSync(req.file.path);
    const pdfData = await pdfParse(dataBuffer);
    
    // Clean up temporary uploaded file
    fs.unlinkSync(req.file.path);

    const extractedText = pdfData.text;

    const prompt = `
      You are an expert academic parser. Analyze the following multi-page Previous Year Question (PYQ) paper text and extract all questions into a structured JSON array.
      
      For each question, extract:
      1. questionNumber (integer or string)
      2. questionText (string)
      3. options (array of 4 strings: [A, B, C, D])
      4. correctAnswer (string or index matching option)
      5. topicCategorization (string subject/topic tag)
      6. yearMetadata (extracted year if present, e.g. 2024 or 2025)

      Text Content:
      """
      ${extractedText}
      """

      Return strictly as a JSON object matching this schema:
      {
        "paperTitle": "Extracted Paper Title or Subject",
        "questions": [
          {
            "questionNumber": 1,
            "questionText": "...",
            "options": ["...", "...", "...", "..."],
            "correctAnswer": "...",
            "topicCategorization": "...",
            "yearMetadata": 2025
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const parsedData = JSON.parse(response.text);

    // Store extracted questions in draft review queue
    const draftRecords = [];
    if (parsedData.questions && Array.isArray(parsedData.questions)) {
      for (const q of parsedData.questions) {
        const draft = await PYQDraft.create({
          paperTitle: parsedData.paperTitle || 'PYQ Paper',
          questionNumber: q.questionNumber,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          topic: q.topicCategorization,
          year: q.yearMetadata,
          status: 'pending_review',
        });
        draftRecords.push(draft);
      }
    }

    const executionTime = Date.now() - startTime;

    res.status(200).json({
      success: true,
      executionTimeMs: executionTime,
      totalParsed: draftRecords.length,
      paperTitle: parsedData.paperTitle,
      drafts: draftRecords,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};
