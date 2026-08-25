/**
 * @fileoverview Web Scraping & Readability Pipeline for the Smart Web Clipper.
 * Extracts core article content, strips clutter, and uses AI to distill notes.
 */
const axios = require('axios');
const cheerio = require('cheerio');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Fetches and cleans web article content using Readability and Cheerio.
 * @param {string} url - The URL of the web page to clip.
 * @returns {Promise<Object>} Cleaned text, title, and extracted images.
 */
async function extractArticleContent(url) {
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 OpenPrep-Clipper/1.0'
            },
            timeout: 10000
        });

        const dom = new JSDOM(response.data, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        if (!article) {
            throw new Error('Could not parse article content. The page might not be a standard article.');
        }

        // Use cheerio to extract images from the cleaned content
        const $ = cheerio.load(article.content);
        const images = [];
        $('img').each((i, el) => {
            const src = $(el).attr('src');
            const alt = $(el).attr('alt') || 'Extracted image';
            if (src && !src.startsWith('data:')) {
                images.push({ src: new URL(src, url).href, alt });
            }
        });

        return {
            title: article.title,
            textContent: article.textContent,
            htmlContent: article.content,
            images: images.slice(0, 3), // Limit to top 3 images
            url: url
        };
    } catch (error) {
        console.error(`[WebClipper] Error extracting content from ${url}:`, error.message);
        throw new Error('Failed to fetch or parse the web page. Ensure the URL is public and accessible.');
    }
}

/**
 * Uses AI to distill the article into a concise summary, key takeaways, and auto-tags.
 * @param {string} title - The article title.
 * @param {string} textContent - The cleaned text content.
 * @returns {Promise<Object>} AI-generated summary, takeaways, and tags.
 */
async function distillArticle(title, textContent) {
    try {
        // Truncate text to avoid token limits (approx 4000 chars)
        const truncatedText = textContent.length > 4000 ? textContent.substring(0, 4000) + '...' : textContent;

        const prompt = `
      You are an expert academic note-taker. Analyze the following article and return a STRICT JSON object.
      Title: ${title}
      Content: ${truncatedText}

      Return JSON with this exact schema (no markdown, no extra text):
      {
        "summary": "string (2-3 sentence concise overview)",
        "keyTakeaways": ["string", "string", "string"],
        "suggestedSubject": "string (e.g., Computer Science, Biology, History)",
        "tags": ["string", "string", "string"]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('[WebClipper] AI distillation error:', error.message);
        // Fallback to basic extraction if AI fails
        return {
            summary: 'AI summary generation failed. Please review the raw text.',
            keyTakeaways: ['Review the extracted text manually.'],
            suggestedSubject: 'General',
            tags: ['clipped', 'web']
        };
    }
}

module.exports = {
    extractArticleContent,
    distillArticle,
};
