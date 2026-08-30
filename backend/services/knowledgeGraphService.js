/**
 * @fileoverview Service for generating AI-driven concept maps and knowledge graphs.
 * Utilizes the Gemini API to extract key concepts and their relationships from text.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Analyzes text or topics to generate a structured knowledge graph.
 * 
 * @param {string} inputText - The study notes or syllabus topics to analyze.
 * @returns {Promise<Object>} A structured object containing nodes and edges.
 */
async function generateKnowledgeGraph(inputText) {
    try {
        const prompt = `
      You are an expert educational analyst. Analyze the following study material or syllabus:
      "${inputText}"

      Extract the key concepts and their relationships to build a knowledge graph.
      Return a STRICT JSON object with the following schema. Do not include markdown formatting or extra text:
      {
        "nodes": [
          {
            "id": "string (unique identifier, e.g., 'concept_1')",
            "label": "string (short concept name)",
            "description": "string (brief 1-2 sentence definition)",
            "category": "string (e.g., 'Core Topic', 'Subtopic', 'Example')"
          }
        ],
        "edges": [
          {
            "source": "string (id of source node)",
            "target": "string (id of target node)",
            "relationship": "string (e.g., 'is part of', 'leads to', 'depends on')"
          }
        ]
      }
      Ensure there are at least 5 nodes and corresponding edges. Make the relationships logical and educational.
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error generating knowledge graph:', error.message);
        throw new Error('Failed to generate concept map. Please check your input and try again.');
    }
}

module.exports = {
    generateKnowledgeGraph,
};
