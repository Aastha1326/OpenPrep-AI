/**
 * @fileoverview API routes for Audio Lecture Transcription.
 */
const express = require('express');
const router = express.Router();
const multer = require('multer');
const lectureTranscriptionController = require('../controllers/lectureTranscriptionController');

// Configure multer for disk storage (up to 100MB)
const upload = multer({
    dest: 'uploads/audio/',
    limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/aac'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid audio format. Allowed: MP3, WAV, M4A, AAC'), false);
        }
    }
});

/**
 * @route   POST /api/lectures/upload
 * @desc    Ingests audio file and initiates asynchronous transcription job
 * @access  Private
 */
router.post('/upload', upload.single('audio'), lectureTranscriptionController.uploadLecture);

/**
 * @route   GET /api/lectures/jobs/:jobId
 * @desc    Polls processing status and progress percentage
 * @access  Private
 */
router.get('/jobs/:jobId', lectureTranscriptionController.getJobStatus);

module.exports = router;
