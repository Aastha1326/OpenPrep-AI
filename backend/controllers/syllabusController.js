const pdfParse = require('pdf-parse');
const { Syllabus, SyllabusTopic, Note } = require('../models');
const { analyzeSyllabusGaps } = require('../services/gapDetectorService');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const prompts = require('../config/prompts');

// Initialize Gemini API client
const apiKey = process.env.GEMINI_API_KEY;
const genAI = (apiKey && apiKey !== 'your_gemini_api_key_here') ? new GoogleGenerativeAI(apiKey) : null;

exports.uploadSyllabus = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF syllabus file.' });
    }

    // 1. Parse PDF text
    let extractedText = '';
    try {
      const parsedPdf = await pdfParse(req.file.buffer);
      extractedText = parsedPdf.text || '';
    } catch (err) {
      console.error('PDF extraction failed, falling back to mock parser:', err);
    }

    // OCR / Scanned PDF fallback warning check
    if (extractedText.trim().length < 100) {
      extractedText = 'Mock Syllabus: Scanned PDF or Image uploaded. Analyzing standard college curriculum structure for general topics.';
    }

    const syllabusName = req.file.originalname.replace('.pdf', '') || 'Curriculum Syllabus';

    let topics = [];
    
    // 2. Call Gemini to extract module hierarchies
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = prompts.syllabus.extractStructure(extractedText);

        const result = await model.generateContent(prompt);
        const responseText = result.response.text().trim();
        // Clean JSON formatting if Gemini wrapped it in markdown codeblocks
        const cleanJson = responseText.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        topics = parsed.topics || [];
      } catch (err) {
        console.error('Failed to parse syllabus with Gemini:', err);
      }
    }

    // Fallback if Gemini failed or is unavailable
    if (topics.length === 0) {
      topics = [
        {
          moduleName: 'Module 1: General Core',
          title: 'Introduction to Core Concepts',
          subtopics: ['Core Definitions', 'Methodology Overview'],
          weightage: 50,
        },
        {
          moduleName: 'Module 2: Advanced Topics',
          title: 'System Implementation & Design',
          subtopics: ['Database Design', 'Client-Server Communication'],
          weightage: 50,
        }
      ];
    }

    // 3. Persist to database
    const syllabus = await Syllabus.create({
      userId: req.user.id,
      name: syllabusName,
    });

    for (const t of topics) {
      await SyllabusTopic.create({
        syllabusId: syllabus.id,
        moduleName: t.moduleName || 'General Core',
        title: t.title || 'Introduction',
        subtopics: t.subtopics || [],
        weightage: t.weightage || 0,
        coverageStatus: 'Unstudied Gap',
      });
    }

    // 4. Initial gap analysis
    const analysis = await analyzeSyllabusGaps(req.user.id, syllabus.id);

    res.status(201).json({
      success: true,
      data: {
        syllabusId: syllabus.id,
        name: syllabus.name,
        coveragePercentage: analysis.coveragePercentage,
        topics: analysis.topics,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.getGapAnalysis = async (req, res, next) => {
  try {
    const syllabusId = req.params.id;
    const userId = req.user.id;

    // Verify syllabus ownership
    const syllabus = await Syllabus.findOne({ where: { id: syllabusId, userId } });
    if (!syllabus) {
      return res.status(404).json({ success: false, error: 'Syllabus not found.' });
    }

    const analysis = await analyzeSyllabusGaps(userId, syllabusId);

    res.status(200).json({
      success: true,
      data: {
        syllabusId: syllabus.id,
        name: syllabus.name,
        coveragePercentage: analysis.coveragePercentage,
        topics: analysis.topics,
      },
    });
  } catch (error) {
    next(error);
  }
};

exports.generateNotesForGap = async (req, res, next) => {
  try {
    const topicId = req.params.topicId;
    const userId = req.user.id;

    const topic = await SyllabusTopic.findByPk(topicId);
    if (!topic) {
      return res.status(404).json({ success: false, error: 'Syllabus topic not found.' });
    }

    let generatedContent = `### Revision Notes: ${topic.title}\n\n`;
    generatedContent += `This study note covers the subtopics: ${topic.subtopics.join(', ')}.\n\n`;
    generatedContent += `Review these concepts regularly to transition this syllabus gap into a Covered status.`;

    // Call Gemini to generate comprehensive notes
    if (genAI) {
      try {
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = prompts.syllabus.generateNotesForGap(topic.title, topic.subtopics);
        const result = await model.generateContent(prompt);
        generatedContent = result.response.text().trim();
      } catch (err) {
        console.error('Failed to generate study notes with Gemini:', err);
      }
    }

    // Save note in database
    const note = await Note.create({
      user: userId,
      title: `${topic.title} Notes`,
      content: generatedContent,
      subject: '00000000-0000-0000-0000-000000000000', // Dummy general subject ID
    });

    // Update topic coverage state
    topic.linkedNoteId = note.id;
    topic.coverageStatus = 'Partially Covered';
    await topic.save();

    res.status(201).json({
      success: true,
      data: {
        noteId: note.id,
        title: note.title,
        content: note.content,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Keep existing getSyllabusCatalog for backward compatibility
exports.getSyllabusCatalog = async (req, res, next) => {
  try {
    const catalog = await Syllabus.findAll({ where: { userId: req.user.id } });
    res.status(200).json({ success: true, data: catalog });
  } catch (error) {
    next(error);
  }
};
