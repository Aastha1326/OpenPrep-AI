const express = require('express');
const {
  getAnnotations,
  saveAnnotation,
  syncAnnotations,
  exportHighlights,
} = require('../controllers/pdfAnnotationController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

// Get annotations for a specific document
router.get('/:id/annotations', protect, getAnnotations);

// Save a single annotation (highlight or sticky note) for a document
router.post('/:id/annotations', protect, saveAnnotation);

// Sync/bulk update annotations for a document
router.put('/:id/annotations', protect, syncAnnotations);

// Export highlights and notes as a Cornell-style Markdown study sheet
router.post('/:id/export-highlights', protect, exportHighlights);

module.exports = router;
