const PDFAnnotation = require('../models/PDFAnnotation');
const sanitizeHtml = require('sanitize-html');
exports.getAnnotations = async (req, res, next) => {
  try {
    const { id: documentId } = req.params;

    const annotations = await PDFAnnotation.findAll({
      where: {
        documentId,
        userId: req.user.id,
      },
    });

    res.status(200).json({ success: true, data: annotations });
  } catch (error) {
    next(error);
  }
};

exports.saveAnnotation = async (req, res, next) => {
  try {
    const { id: documentId } = req.params;
    const { pageNumber, rectsData, color, commentText } = req.body;
    const safeCommentText = commentText
      ? sanitizeHtml(commentText, { allowedTags: [], allowedAttributes: {} })
      : commentText;

    const annotation = await PDFAnnotation.create({
      documentId,
      userId: req.user.id,
      pageNumber,
      rectsData,
      color: color || '#FFE900',
      commentText: safeCommentText,
    });
    res.status(201).json({ success: true, data: annotation });
  } catch (error) {
    next(error);
  }
};
