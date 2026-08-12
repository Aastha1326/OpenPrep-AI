const { GoogleGenAI } = require('@google/genai');
const fs = require('fs');

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.processHandwrittenNote = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Please upload an image file (JPG, PNG, WEBP)' });
    }

    const filePath = req.file.path;
    const mimeType = req.file.mimetype;

    // Read file data for Gemini Vision API
    const imagePart = {
      inlineData: {
        data: Buffer.from(fs.readFileSync(filePath)).toString('base64'),
        mimeType: mimeType,
      },
    };

    const prompt = `
      You are an expert OCR and academic assistant. Analyze this image of handwritten study notes.
      Extract all handwritten text, diagrams description, and mathematical formulas with high accuracy.
      Format the output cleanly in structured Markdown format, preserving headings, bullet points, and LaTeX notation for equations where applicable.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [prompt, imagePart],
    });

    // Clean up temporary uploaded file
    fs.unlinkSync(filePath);

    res.status(200).json({
      success: true,
      markdown: response.text,
    });
  } catch (error) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};
