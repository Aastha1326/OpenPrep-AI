/**
 * @fileoverview REST controller for whiteboard persistence, management, and AI OCR.
 */
const { Whiteboard } = require('../models');
const { transcribeHandwriting } = require('../services/handwritingOcrService');

/**
 * Fetches saved whiteboards for a specific squad
 */
const getSquadWhiteboards = async (req, res) => {
  try {
    const { squadId } = req.params;
    const boards = await Whiteboard.findAll({
      where: { squadId },
      order: [['updatedAt', 'DESC']],
    });
    res.status(200).json({ success: true, data: boards });
  } catch (error) {
    console.error('Error fetching squad whiteboards:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Creates a new whiteboard instance for a squad
 */
const createWhiteboard = async (req, res) => {
  try {
    const { squadId, name, roomId } = req.body;
    const actualRoomId = roomId || `room_${Date.now()}`;

    // Find or create whiteboard by roomId
    const [board, created] = await Whiteboard.findOrCreate({
      where: { roomId: actualRoomId },
      defaults: {
        squadId,
        name: name || 'Collaborative Whiteboard',
        state: { strokes: [], nodes: [], edges: [] },
      },
    });

    res.status(created ? 201 : 200).json({ success: true, data: board });
  } catch (error) {
    console.error('Error creating whiteboard:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Retrieves the full canvas state for a specific room
 */
const getWhiteboardState = async (req, res) => {
  try {
    const { roomId } = req.params;
    let board = await Whiteboard.findOne({ where: { roomId } });

    if (!board) {
      // If whiteboard doesn't exist yet, we initialize it
      board = await Whiteboard.create({
        roomId,
        name: 'Collaborative Whiteboard',
        state: { strokes: [], nodes: [], edges: [] },
      });
    }

    res.status(200).json({ success: true, data: board });
  } catch (error) {
    console.error('Error fetching whiteboard state:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Saves a serialized snapshot of the canvas state and generates/saves a PNG thumbnail
 */
const saveWhiteboardSnapshot = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { state, previewUrl } = req.body;

    if (!state || typeof state !== 'object') {
      return res.status(400).json({ success: false, message: 'Valid state object is required' });
    }

    const [board] = await Whiteboard.findOrCreate({
      where: { roomId },
      defaults: {
        name: 'Collaborative Whiteboard',
        state,
        previewUrl,
      },
    });

    // Update state and previewUrl if the record already existed
    board.state = state;
    if (previewUrl) {
      board.previewUrl = previewUrl;
    }
    await board.save();

    console.log(`[Controller] Saved snapshot for whiteboard ${roomId}`);
    res.status(200).json({ success: true, message: 'Snapshot saved successfully', data: board });
  } catch (error) {
    console.error('Error saving snapshot:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

/**
 * Handwriting OCR: converts sketched math equations to editable LaTeX formulas
 */
const transcribeMathOCR = async (req, res) => {
  try {
    const { image } = req.body; // Base64 data URL or raw base64 string
    if (!image) {
      return res.status(400).json({ success: false, message: 'Image data is required' });
    }

    // Strip out standard data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const result = await transcribeHandwriting(buffer, 'image/png');

    // Extract LaTeX output from Gemini transcription
    let latex = result.transcription;

    // Clean up LaTeX response formatting (e.g. if Gemini wrapped it in markdown codeblocks)
    latex = latex.replace(/```latex/g, '').replace(/```/g, '').trim();

    res.status(200).json({
      success: true,
      latex,
      confidence: result.confidence,
    });
  } catch (error) {
    console.error('Error transcribing math handwriting:', error);
    res.status(500).json({ success: false, message: error.message || 'OCR transcription failed' });
  }
};

/**
 * Archives or deletes a whiteboard
 */
const deleteWhiteboard = async (req, res) => {
  try {
    const { id } = req.params;
    await Whiteboard.destroy({ where: { id } });
    console.log(`[Controller] Deleted whiteboard ${id}`);
    res.status(200).json({ success: true, message: 'Whiteboard deleted successfully' });
  } catch (error) {
    console.error('Error deleting whiteboard:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
  getSquadWhiteboards,
  createWhiteboard,
  getWhiteboardState,
  saveWhiteboardSnapshot,
  transcribeMathOCR,
  deleteWhiteboard,
};
