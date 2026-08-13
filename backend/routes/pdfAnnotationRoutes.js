const express = require('express');
const { getAnnotations, saveAnnotation } = require('../controllers/pdfAnnotationController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Get annotations for a specific document
router.get('/:id/annotations', protect, getAnnotations);

// Save an annotation (highlight or sticky note) for a document
router.post('/:id/annotations', protect, saveAnnotation);

module.exports = router;
