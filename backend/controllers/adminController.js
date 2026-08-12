const { invalidateCache } = require('../config/redis');

exports.updateSubjectCatalog = async (req, res, next) => {
  try {
    const { subjectId } = req.params;
    // Perform database update logic...

    // Automatically invalidate cached syllabus catalog when admin updates subjects/topics
    await invalidateCache('syllabus_catalog_*');

    res.status(200).json({
      success: true,
      message: 'Subject updated and cache invalidated successfully.',
    });
  } catch (error) {
    next(error);
  }
};
