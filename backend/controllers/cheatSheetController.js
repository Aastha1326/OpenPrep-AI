const { GoogleGenAI } = require('@google/genai');
const Subject = require('../models/Subject');
const Chapter = require('../models/Chapter');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.generateCheatSheet = async (req, res, next) => {
  try {
    const { subjectId, chapterId } = req.query;

    if (!subjectId) {
      return res.status(400).json({ success: false, error: 'subjectId query parameter is required' });
    }

    const subject = await Subject.findByPk(subjectId, {
      include: [{ model: Chapter, as: 'chapters' }],
    });

    if (!subject) {
      return res.status(404).json({ success: false, error: 'Subject not found' });
    }

    let targetChapters = subject.chapters || [];
    if (chapterId) {
      targetChapters = targetChapters.filter((c) => c.id.toString() === chapterId.toString());
    }

    const chapterTitles = targetChapters.map((c) => c.name).join(', ');

    const prompt = `
      You are an expert academic tutor in STEM subjects (Physics, Mathematics, Chemistry).
      Generate a comprehensive Formula Cheat Sheet for the subject "${subject.name}" (Chapters/Topics: ${chapterTitles || 'All core chapters'}).
      
      Include:
      1. Essential formulas and mathematical equations formatted strictly using KaTeX syntax (e.g., $E = mc^2$ or $$ \\int x dx $$).
      2. Key definitions and fundamental theorems.
      3. Quick-reference notes for exam revision.
      
      Return the output in clean JSON format matching this structure:
      {
        "subjectName": "${subject.name}",
        "sections": [
          {
            "category": "Core Formulas",
            "items": [
              { "title": "Equation Name", "formula": "$...$", "description": "Explanation of variables" }
            ]
          }
        ]
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    const cheatSheetData = JSON.parse(response.text);

    res.status(200).json({
      success: true,
      cheatSheet: cheatSheetData,
    });
  } catch (error) {
    next(error);
  }
};
