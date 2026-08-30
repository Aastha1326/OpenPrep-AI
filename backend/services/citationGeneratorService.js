/**
 * @fileoverview Service for generating structured academic citations from URLs or text snippets.
 * Utilizes the Gemini API to identify source types and format citations in multiple styles.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Analyzes a URL or text snippet and generates structured citation data.
 * 
 * @param {string} input - The URL or text snippet to cite.
 * @returns {Promise<Object>} Structured citation data (author, title, date, publisher, etc.).
 */
async function generateCitationData(input) {
    try {
        const prompt = `
      You are an expert academic librarian. Analyze the following input (which may be a URL, book title, or paper snippet) and extract the metadata to generate a structured citation object.
      Input: "${input}"

      Return a STRICT JSON object with the following schema. Do not include markdown formatting:
      {
        "sourceType": "website" | "journal" | "book" | "unknown",
        "title": "string",
        "author": "string",
        "year": "string (YYYY)",
        "publisher": "string",
        "url": "string (if applicable)",
        "rawInput": "string"
      }
      If information is missing, use "Unknown" for that field.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error generating citation data:', error.message);
        throw new Error('Failed to parse citation data. Please check the input and try again.');
    }
}

/**
 * Formats structured citation data into a specific academic style.
 * 
 * @param {Object} citationData - The structured citation object.
 * @param {string} style - 'APA', 'MLA', or 'Chicago'.
 * @returns {string} The formatted citation string.
 */
function formatCitation(citationData, style) {
    const { author, year, title, publisher, url, sourceType } = citationData;
    const authorFormatted = author === 'Unknown' ? 'Unknown Author' : author;
    const yearFormatted = year === 'Unknown' ? 'n.d.' : `(${year})`;
    const titleFormatted = sourceType === 'journal' || sourceType === 'website' ? title : `*${title}*`;

    switch (style.toUpperCase()) {
        case 'APA':
            return `${authorFormatted} ${yearFormatted}. ${title}. ${publisher}. ${url ? `Retrieved from ${url}` : ''}`.replace(/\s+/g, ' ').trim();
        case 'MLA':
            return `${authorFormatted}. "${title}." ${publisher}, ${year === 'Unknown' ? 'n.d.' : year}. ${url ? `Web. ${url}` : ''}`.replace(/\s+/g, ' ').trim();
        case 'CHICAGO':
            return `${authorFormatted}. "${title}." ${publisher}, ${year === 'Unknown' ? 'n.d.' : year}. ${url ? `Accessed via ${url}` : ''}`.replace(/\s+/g, ' ').trim();
        default:
            return `${authorFormatted}. ${title}. ${publisher}, ${year}.`;
    }
}

module.exports = {
    generateCitationData,
    formatCitation,
};
