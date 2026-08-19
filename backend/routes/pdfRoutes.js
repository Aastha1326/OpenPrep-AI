const express = require('express');
const router = express.Router();
const multer = require('multer');
const pdfParserService = require('../services/pdfParserService');

// Setup multer for MVP memory storage
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.post('/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (req.file.mimetype !== 'application/pdf') {
      return res.status(400).json({ message: 'Only PDF files are supported' });
    }

    // Pass buffer to parser service
    const generatedDecks = await pdfParserService.parseAndGenerate(req.file.buffer);

    res.status(200).json({ 
      message: 'Document successfully parsed and decks generated.',
      decks: generatedDecks 
    });

  } catch (err) {
    console.error('PDF Upload Error:', err);
    res.status(500).json({ message: 'Error processing document' });
  }
});

module.exports = router;
