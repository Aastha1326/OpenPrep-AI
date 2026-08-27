const doubtService = require('../services/multimodalDoubtService');
const DoubtSession = require('../models/DoubtSessionModel');

/**
 * Processes an uploaded image and text to generate a solution.
 * 
 * @param {Object} req - Express request object (expects file in req.file).
 * @param {Object} res - Express response object.
 */
const solveDoubt = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'An image file is required.' });
        }

        const { context } = req.body;

        // Convert buffer to base64
        const base64Image = req.file.buffer.toString('base64');

        const solution = await doubtService.solveDoubt(base64Image, context || '');

        res.status(200).json({
            success: true,
            data: {
                solution,
                imageName: req.file.originalname,
            },
        });
    } catch (error) {
        console.error('Error solving doubt:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
    }
};

  // Start a new doubt-solving session with progressive hints
  async function startSession(req, res) {
    try {
      const { question } = req.body;
      if (!question) {
        return res.status(400).json({ success: false, message: 'Question text is required.' });
      }
      let base64Image = '';
      const imageUrls = [];
      if (req.file) {
        base64Image = req.file.buffer.toString('base64');
        imageUrls.push({ url: `data:${req.file.mimetype};base64,${base64Image}`, mimeType: req.file.mimetype });
      }
      // Get full answer using the Gemini-based doubt service
      const fullAnswer = await doubtService.solveDoubt(base64Image, question);
      const hints = [
        { level: 1, content: 'Hint 1: Identify the core concept.' },
        { level: 2, content: 'Hint 2: Recall relevant formulas.' },
        { level: 3, content: 'Hint 3: Outline step‑by‑step approach.' },
        { level: 4, content: fullAnswer },
      ];
      const session = await DoubtSession.create({
        studentId: req.user.id,
        question,
        imageUrls,
        hints,
        currentLevel: 0,
      });
      return res.status(201).json({ success: true, data: { sessionId: session.id, hint: hints[0] } });
    } catch (err) {
      console.error('Error starting doubt session:', err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
    }
  }

  // Reveal the next hint in an existing session
  async function revealHint(req, res) {
    try {
      const { id } = req.params;
      const session = await DoubtSession.findById(id);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found.' });
      }
      if (session.studentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
      const nextLevel = session.currentLevel + 1;
      if (nextLevel >= session.hints.length) {
        return res.status(200).json({ success: true, message: 'All hints already revealed.', hint: null });
      }
      session.currentLevel = nextLevel;
      await session.save();
      return res.status(200).json({ success: true, data: { hint: session.hints[nextLevel] } });
    } catch (err) {
      console.error('Error revealing hint:', err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
    }
  }

  // Send a follow-up message in an existing doubt session (multi-turn)
  async function sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, message: 'Message text is required.' });
      }
      const session = await DoubtSession.findById(id);
      if (!session) {
        return res.status(404).json({ success: false, message: 'Session not found.' });
      }
      if (session.studentId !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Not authorized.' });
      }
      // Build conversation context from existing hints and the new message
      const conversationContext = session.hints
        .filter((h) => h.level <= session.currentLevel)
        .map((h) => h.content)
        .join('\n');
      const fullPrompt = `${session.question}\n\nPrevious hints:\n${conversationContext}\n\nStudent follow-up: ${message}`;
      // Get AI response using the existing multimodal service
      const aiReply = await doubtService.solveDoubt('', fullPrompt);
      // Store the exchange in the session's hints array as a conversation entry
      session.hints.push({ level: session.hints.length + 1, content: `**Student:** ${message}\n\n**Tutor:** ${aiReply}` });
      await session.save();
      return res.status(200).json({ success: true, data: { reply: aiReply } });
    } catch (err) {
      console.error('Error sending message:', err);
      return res.status(500).json({ success: false, message: err.message || 'Internal server error.' });
    }
  }

module.exports = { solveDoubt, startSession, revealHint, sendMessage };
