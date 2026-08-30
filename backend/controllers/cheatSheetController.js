const { GoogleGenAI } = require('@google/genai');
const Subject = require('../models/Subject');
const Topic = require('../models/Topic');
const prompts = require('../config/prompts');

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

    const prompt = prompts.cheatSheet.generateCheatSheet(subject.name, chapterTitles);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: { responseMimeType: 'application/json' },
    });

    try {
      require('../services/metricsService').recordTokensConsumed(
        'gemini-2.5-flash',
        response.usageMetadata?.promptTokenCount,
        response.usageMetadata?.candidatesTokenCount
      );
    } catch (e) {}

    const cheatSheetData = JSON.parse(response.text);

    res.status(200).json({
      success: true,
      cheatSheet: cheatSheetData,
    });
  } catch (error) {
    next(error);
  }
};
