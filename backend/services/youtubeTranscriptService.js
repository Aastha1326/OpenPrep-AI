/**
 * @fileoverview Service for fetching YouTube transcripts and generating flashcards via Gemini.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Mock function to simulate fetching a transcript. 
 * In production, integrate a library like 'youtube-transcript-api'.
 */
async function fetchTranscript(videoId) {
    // Simulated delay and response for demonstration
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `This is a simulated transcript for video ${videoId}. It covers the fundamentals of React, including components, state, props, and the useEffect hook. State allows components to remember information. Props are used to pass data from parent to child components. The useEffect hook handles side effects like data fetching.`;
}

/**
 * Chunks text into smaller segments to fit within token limits.
 */
function chunkText(text, maxChunkSize = 2000) {
    const words = text.split(' ');
    const chunks = [];
    let currentChunk = [];
    let currentLength = 0;

    for (const word of words) {
        if (currentLength + word.length + 1 > maxChunkSize) {
            chunks.push(currentChunk.join(' '));
            currentChunk = [word];
            currentLength = word.length;
        } else {
            currentChunk.push(word);
            currentLength += word.length + 1;
        }
    }
    if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
    }
    return chunks;
}

/**
 * Generates flashcards from a given text chunk.
 */
async function generateFlashcardsFromChunk(textChunk) {
    const prompt = `
    You are an expert educator. Based on the following lecture transcript chunk, generate high-quality spaced repetition flashcards.
    Transcript: "${textChunk}"

    Return a STRICT JSON array of objects. Do not include markdown formatting:
    [
      {
        "front": "string (the question or concept)",
        "back": "string (the concise answer or explanation)",
        "difficulty": "easy" | "medium" | "hard",
        "tags": ["string"]
      }
    ]
    Generate 3-5 flashcards per chunk. Ensure answers are concise and directly derived from the text.
  `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

    return JSON.parse(cleanJson);
}

/**
 * Main function to process a YouTube URL and return flashcards.
 */
async function processYouTubeToFlashcards(youtubeUrl) {
    try {
        // Extract video ID (simplified regex)
        const videoIdMatch = youtubeUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11}).*/);
        const videoId = videoIdMatch ? videoIdMatch[1] : 'unknown';

        const transcript = await fetchTranscript(videoId);
        const chunks = chunkText(transcript, 2000);

        let allFlashcards = [];
        for (const chunk of chunks) {
            const cards = await generateFlashcardsFromChunk(chunk);
            allFlashcards = [...allFlashcards, ...cards];
        }

        // Remove duplicates based on front text
        const uniqueCards = allFlashcards.filter((v, i, a) => a.findIndex(t => (t.front === v.front)) === i);

        return uniqueCards;
    } catch (error) {
        console.error('Error processing YouTube video:', error.message);
        throw new Error('Failed to process video. Ensure the URL is valid and public.');
    }
}

module.exports = {
    processYouTubeToFlashcards,
};
