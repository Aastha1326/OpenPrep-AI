const { createWorker } = require('tesseract.js');
const Jimp = require('jimp');

let workerPool = null;
let currentWorkerIndex = 0;
const WORKER_COUNT = 2; // Default pool size

// Initialize the worker pool lazily
async function getWorker() {
  if (!workerPool) {
    workerPool = await Promise.all(
      Array.from({ length: WORKER_COUNT }).map(async () => {
        const worker = await createWorker('eng');
        return worker;
      })
    );
  }
  
  // Round-robin selection
  const worker = workerPool[currentWorkerIndex];
  currentWorkerIndex = (currentWorkerIndex + 1) % WORKER_COUNT;
  return worker;
}

/**
 * Preprocess the image using Jimp (grayscale, increase contrast)
 * to improve Tesseract OCR accuracy, especially on handwritten notes.
 */
async function preprocessImage(imageBuffer) {
  try {
    const image = await Jimp.read(imageBuffer);
    
    // Convert to grayscale and increase contrast
    image
      .grayscale()
      .contrast(0.2); // +20% contrast to make text stand out
    
    return await image.getBufferAsync(Jimp.MIME_PNG);
  } catch (err) {
    console.error('[OCR Service] Error preprocessing image:', err.message);
    // Fallback to original buffer if preprocessing fails
    return imageBuffer;
  }
}

/**
 * Extract text from an image buffer using Tesseract.js
 * @param {Buffer} imageBuffer - The image data
 * @returns {Promise<{ extractedText: string, confidence: number, wordCount: number }>}
 */
async function extractTextFromImage(imageBuffer) {
  try {
    // 1. Preprocess image
    const processedBuffer = await preprocessImage(imageBuffer);
    
    // 2. Get a worker from the pool
    const worker = await getWorker();
    
    // 3. Perform OCR
    const { data } = await worker.recognize(processedBuffer);
    
    const extractedText = data.text || '';
    const wordCount = data.words ? data.words.length : 0;
    const confidence = data.confidence || 0; // 0 to 100
    
    return {
      extractedText: extractedText.trim(),
      confidence,
      wordCount,
    };
  } catch (error) {
    console.error('[OCR Service] Extraction failed:', error);
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Terminate all Tesseract workers in the pool.
 * Should be called during graceful shutdown.
 */
async function cleanupWorkers() {
  if (workerPool) {
    await Promise.all(workerPool.map((worker) => worker.terminate()));
    workerPool = null;
  }
}

module.exports = {
  extractTextFromImage,
  cleanupWorkers,
  preprocessImage, // Exported for testing
};
