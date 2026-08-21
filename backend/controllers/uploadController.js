const fs = require('fs');
const storageService = require('../services/storageService');

exports.uploadImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No image file uploaded' });
    }

    // Use storage service to handle upload based on configured provider
    const { url } = await storageService.uploadExistingFile(
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      'image'
    );

    res.status(200).json({
      success: true,
      url: url,
    });
  } catch (error) {
    // Clean up local file if upload failed
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    
    // Pass to error handling middleware
    next(error);
  }
};
