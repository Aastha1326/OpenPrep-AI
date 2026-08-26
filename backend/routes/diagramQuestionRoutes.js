const express = require('express');
const multer = require('multer');
const {
  generateDiagramHotspots,
  verifyHotspotClick,
} = require('../controllers/diagramQuestionController');
const { protect } = require('../middleware/auth');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

const router = express.Router();

router.post('/generate', protect, upload.single('image'), generateDiagramHotspots);
router.post('/verify', protect, verifyHotspotClick);

module.exports = router;
