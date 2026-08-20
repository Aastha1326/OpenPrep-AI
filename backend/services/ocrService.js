const { createWorker } = require('tesseract.js');
const Jimp = require('jimp');
const pdfParse = require('pdf-parse');
const { loadEnv } = require('../config/env');

const config = loadEnv();
const OCR_TIMEOUT_MS = config?.OCR_TIMEOUT_MS || 60000;

let workerPool = null;
let currentWorkerIndex = 0;
const WORKER_COUNT = 2; // Default pool size

// Track worker health to detect and replace unhealthy workers
let workerHealth = new Map(); // workerIndex -> { isHealthy: boolean, lastError: string, errorCount: number }

// Initialize the worker pool lazily
async function getWorker() {
  if (!workerPool) {
    workerPool = await Promise.all(
      Array.from({ length: WORKER_COUNT }).map(async () => {
        const worker = await createWorker('eng');
        return worker;
      })
    );
    
    // Initialize health tracking for all workers
    for (let i = 0; i < WORKER_COUNT; i++) {
      workerHealth.set(i, { isHealthy: true, lastError: null, errorCount: 0 });
    }
  }
  
  // Round-robin selection with health check
  let attempts = 0;
  const maxAttempts = WORKER_COUNT;
  
  while (attempts < maxAttempts) {
    const workerIndex = currentWorkerIndex;
    currentWorkerIndex = (currentWorkerIndex + 1) % WORKER_COUNT;
    
    const health = workerHealth.get(workerIndex);
    if (health && health.isHealthy) {
      return { worker: workerPool[workerIndex], index: workerIndex };
    }
    
    attempts++;
  }
  
  // If all workers are unhealthy, return the first one anyway (will be replaced on failure)
  return { worker: workerPool[0], index: 0 };
}

// Replace an unhealthy worker with a fresh one
async function replaceWorker(workerIndex) {
  if (!workerPool || workerIndex < 0 || workerIndex >= workerPool.length) {
    return;
  }
  
  try {
    // Terminate the unhealthy worker
    const oldWorker = workerPool[workerIndex];
    if (oldWorker) {
      await oldWorker.terminate().catch((err) => {
        console.error(`[OCR Service] Error terminating worker ${workerIndex}:`, err.message);
      });
    }
    
    // Create a new worker
    const newWorker = await createWorker('eng');
    workerPool[workerIndex] = newWorker;
    
    // Reset health status
    workerHealth.set(workerIndex, { isHealthy: true, lastError: null, errorCount: 0 });
    
    console.log(`[OCR Service] Worker ${workerIndex} replaced successfully`);
  } catch (error) {
    console.error(`[OCR Service] Failed to replace worker ${workerIndex}:`, error.message);
    // Mark as unhealthy even if replacement failed
    workerHealth.set(workerIndex, { 
      isHealthy: false, 
      lastError: `Replacement failed: ${error.message}`, 
      errorCount: (workerHealth.get(workerIndex)?.errorCount || 0) + 1 
    });
  }
}

// Mark a worker as unhealthy and trigger replacement
async function handleWorkerFailure(workerIndex, error) {
  if (!workerHealth.has(workerIndex)) {
    return;
  }
  
  const health = workerHealth.get(workerIndex);
  health.isHealthy = false;
  health.lastError = error.message || 'Unknown error';
  health.errorCount += 1;
  
  console.error(`[OCR Service] Worker ${workerIndex} marked as unhealthy:`, error.message);
  
  // Replace the worker asynchronously (don't block the current request)
  replaceWorker(workerIndex).catch((err) => {
    console.error(`[OCR Service] Async worker replacement failed for index ${workerIndex}:`, err.message);
  });
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
  let workerObj = null;
  let timeoutId = null;
  
  try {
    // 1. Preprocess image
    const processedBuffer = await preprocessImage(imageBuffer);
    
    // 2. Get a worker from the pool
    workerObj = await getWorker();
    const { worker, index: workerIndex } = workerObj;
    
    // 3. Perform OCR with timeout
    const ocrPromise = worker.recognize(processedBuffer);
    
    // Create timeout promise that also handles worker cleanup
    const timeoutPromise = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        reject(new Error(`OCR operation timed out after ${OCR_TIMEOUT_MS}ms`));
      }, OCR_TIMEOUT_MS);
    });
    
    // Race between OCR and timeout
    const { data } = await Promise.race([ocrPromise, timeoutPromise]);
    
    // Clear timeout if OCR completed successfully
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    const extractedText = data.text || '';
    const wordCount = data.words ? data.words.length : 0;
    const confidence = data.confidence || 0; // 0 to 100
    
    return {
      extractedText: extractedText.trim(),
      confidence,
      wordCount,
    };
  } catch (error) {
    // Clear timeout if still active
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    
    // Handle timeout specifically
    if (error.message && error.message.includes('timed out')) {
      console.error('[OCR Service] OCR timeout:', error.message);
      
      // Mark worker as unhealthy and replace it
      if (workerObj) {
        await handleWorkerFailure(workerObj.index, error);
      }
      
      throw new Error('OCR operation timed out. Please try again with a smaller or clearer image.');
    }
    
    // Handle worker failures
    console.error('[OCR Service] Extraction failed:', error);
    
    // Mark worker as unhealthy if we have a worker reference
    if (workerObj) {
      await handleWorkerFailure(workerObj.index, error);
    }
    
    throw new Error('Failed to extract text from image');
  }
}

/**
 * Extract text from a PDF buffer using pdf-parse
 * @param {Buffer} pdfBuffer - The PDF data
 * @returns {Promise<{ extractedText: string, confidence: number, wordCount: number }>}
 */
async function extractTextFromPDF(pdfBuffer) {
  try {
    const data = await pdfParse(pdfBuffer);
    
    const extractedText = data.text || '';
    const wordCount = extractedText.split(/\s+/).filter(Boolean).length;
    const confidence = 95; // PDF text extraction is typically high confidence
    
    return {
      extractedText: extractedText.trim(),
      confidence,
      wordCount,
    };
  } catch (error) {
    console.error('[OCR Service] PDF extraction failed:', error);
    throw new Error('Failed to extract text from PDF');
  }
}

/**
 * Terminate all Tesseract workers in the pool.
 * Should be called during graceful shutdown.
 */
async function cleanupWorkers() {
  if (workerPool) {
    await Promise.all(
      workerPool.map((worker, index) => 
        worker.terminate().catch((err) => {
          console.error(`[OCR Service] Error terminating worker ${index} during cleanup:`, err.message);
        })
      )
    );
    workerPool = null;
  }
  
  // Clear health tracking
  workerHealth.clear();
}

module.exports = {
  extractTextFromImage,
  extractTextFromPDF,
  cleanupWorkers,
  preprocessImage, // Exported for testing
  replaceWorker, // Exported for testing
  handleWorkerFailure, // Exported for testing
  getWorker, // Exported for testing
};
