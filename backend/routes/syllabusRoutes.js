const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { uploadSyllabus, getGapAnalysis, generateNotesForGap, getSyllabusCatalog } = require('../controllers/syllabusController');

const router = express.Router();
const upload = multer({
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter(req, file, cb) {
    if (!file.originalname.match(/\.(pdf)$/)) {
      return cb(new Error('Please upload a PDF document.'));
    }
    cb(null, true);
  },
});

router.post('/upload', protect, upload.single('syllabus'), uploadSyllabus);
router.get('/:id/gap-analysis', protect, getGapAnalysis);
router.post('/topics/:topicId/generate-notes', protect, generateNotesForGap);
router.get('/', protect, getSyllabusCatalog);

module.exports = router;
