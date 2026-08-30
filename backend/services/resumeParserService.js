/**
 * @fileoverview Service for extracting text from resumes and analyzing skill gaps using Gemini.
 */
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

/**
 * Analyzes resume text against a job description to identify skill gaps.
 * 
 * @param {string} resumeText - Extracted text from the user's resume.
 * @param {string} jobDescription - The target job description text.
 * @param {string} targetRole - The target job title.
 * @returns {Promise<Object>} Structured skill gap analysis.
 */
async function analyzeSkillGap(resumeText, jobDescription, targetRole) {
    try {
        const prompt = `
      You are an expert technical recruiter and career coach. 
      Analyze the following resume text against the provided job description for the role of "${targetRole}".
      
      Resume Text:
      """${resumeText}"""
      
      Job Description:
      """${jobDescription}"""

      Return a STRICT JSON object with the following schema. Do not include markdown formatting:
      {
        "overallMatchScore": number (0-100),
        "skills": [
          {
            "name": string,
            "category": "Technical" | "Soft" | "Tool",
            "currentProficiency": number (1-5, based on resume),
            "requiredProficiency": number (1-5, based on JD),
            "gap": number (required - current, can be negative)
          }
        ],
        "recommendations": [
          {
            "skill": string,
            "action": string (e.g., "Generate a quiz on React Hooks", "Review System Design basics")
          }
        ]
      }
    `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const cleanJson = response.text().replace(/```json\n?|\n?```/g, '').trim();

        return JSON.parse(cleanJson);
    } catch (error) {
        console.error('Error in skill gap analysis:', error.message);
        throw new Error('Failed to analyze skill gap. Please ensure the text is readable.');
    }
}

module.exports = {
    analyzeSkillGap,
};
