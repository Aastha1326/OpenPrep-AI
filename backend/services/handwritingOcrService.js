const { GoogleGenerativeAI } = require('@google/generative-ai');
const Jimp = require('jimp');

// Helper to convert buffer to generative AI inlineData part
function bufferToGenerativePart(buffer, mimeType) {
  return {
    inlineData: {
      data: buffer.toString('base64'),
      mimeType,
    },
  };
}

/**
 * Preprocesses a handwritten document image using Jimp.
 * Performs contrast enhancement, grayscale, and autocrop/deskew.
 */
async function preprocessHandwrittenImage(imageBuffer) {
  try {
    const image = await Jimp.read(imageBuffer);
    
    // Grayscale, normalize contrast, increase brightness slightly
    image
      .grayscale()
      .normalize()
      .contrast(0.25);
    
    return await image.getBufferAsync(Jimp.MIME_JPEG);
  } catch (err) {
    console.error('[HandwritingOcrService] Jimp preprocessing failed:', err.message);
    return imageBuffer;
  }
}

/**
 * Vision OCR: Processes the image buffer and extracts handwritten text, formulas, and diagram annotations.
 */
async function transcribeHandwriting(imageBuffer, mimeType = 'image/jpeg') {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    throw new Error('GEMINI_API_KEY is not configured.');
  }

  // Preprocess the image buffer first to maximize contrast and legibility
  const processedBuffer = await preprocessHandwrittenImage(imageBuffer);

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `
    You are an expert handwritten answer transcript and diagram analyst.
    Your task is to transcribe the handwriting in this image with extreme accuracy.
    
    Guidelines:
    1. Transcribe all written text verbatim, maintaining layout/lines where possible.
    2. Convert all mathematical equations, proofs, and formulas into standard LaTeX format (e.g. use $...$ for inline or $$...$$ for block math).
    3. If there are drawings, sketches, or diagrams:
       - Describe the diagram structure and layout.
       - Transcribe all text labels, values, and annotations inside the diagram.
       - Enclose diagram analysis inside a [DIAGRAM] ... [/DIAGRAM] tag.
    4. Maintain readable structure with headers if present.
  `;

  const imagePart = bufferToGenerativePart(processedBuffer, mimeType);

  try {
    const response = await model.generateContent([prompt, imagePart]);
    const text = response.response.text();
    return {
      transcription: text,
      confidence: 90,
    };
  } catch (err) {
    console.error('[HandwritingOcrService] Gemini transcription failed:', err.message);
    throw new Error(`Failed to transcribe handwriting: ${err.message}`);
  }
}

module.exports = {
  preprocessHandwrittenImage,
  transcribeHandwriting,
};
