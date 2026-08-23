/**
 * @fileoverview Service for extracting transcripts and summarizing lecture videos.
 * Utilizes the Gemini API to chunk content and generate timestamped key points.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Mock function to simulate fetching a video transcript.
 * In production, integrate a library like 'youtube-transcript-api' or a speech-to-text service.
 */
async function fetchVideoTranscript(videoId) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    return `00:00 Introduction to the topic of machine learning. 01:30 We will discuss supervised learning algorithms. 03:45 Linear regression is a fundamental concept where we fit a line to data points. 05:20 Next, we explore decision trees and how they split data based on features. 08:10 Finally, we will cover model evaluation metrics like accuracy and F1 score.`;
}

/**
 * Chunks transcript text and generates concise summaries with precise timestamps.
 */
async function summarizeLecture(transcript) {
    try {
        const prompt = `
      You are an expert academic summarizer. Analyze the following lecture transcript which includes timestamps.
      Transcript: "${transcript}"

      Return a STRICT JSON object with the following schema. Do not include markdown formatting:
      {
        "title": "string (a concise title for the lecture)",
        "overview": "string (2-3 sentence summary of the entire lecture)",
        "keyPoints": [
          {
            "timestamp": "string (MM:SS format)",
            "seconds": number (total seconds for programmatic seeking),
            "heading": "string (short topic name)",
            "summary": "string (1-2 sentence explanation of the concept)"
          }
        ]
      }
      Ensure timestamps are accurate to the provided text.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error summarizing lecture:', error.message);
        throw new Error('Failed to summarize the lecture. Please check the video URL and try again.');
    }
}

module.exports = {
    fetchVideoTranscript,
    summarizeLecture,
};
