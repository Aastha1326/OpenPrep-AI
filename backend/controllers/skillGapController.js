/**
 * @fileoverview Controller for handling resume uploads and skill gap analysis requests.
 */
const skillGapService = require('../services/resumeParserService');
const {
    getSkillGraph,
    addDependency,
} = require('../services/skillDependencyService');// const SkillAnalysis = require('../models/SkillAnalysis'); // Uncomment when model is registered

/**
 * Processes a resume file and job description to generate a skill gap report.
 * 
 * @param {Object} req - Express request object (expects file in req.file).
 * @param {Object} res - Express response object.
 */
const analyzeResume = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Resume file is required.' });
        }

        const { jobDescription, targetRole } = req.body;
        if (!jobDescription || !targetRole) {
            return res.status(400).json({ success: false, message: 'Job description and target role are required.' });
        }

        // In production, use a library like 'pdf-parse' or 'mammoth' to extract text from req.file.buffer
        // For this implementation, we simulate extracted text based on file presence
        const mockResumeText = `Experienced software developer with 3 years of experience in JavaScript, React, Node.js, and PostgreSQL. Strong problem-solving skills and experience with Git and Docker.`;

        const analysisResult = await skillGapService.analyzeSkillGap(
            mockResumeText,
            jobDescription,
            targetRole
        );

        // TODO: Save to database
        // await SkillAnalysis.create({
        //   userId: req.user.id,
        //   targetRole,
        //   overallMatchScore: analysisResult.overallMatchScore,
        //   extractedSkills: analysisResult.skills,
        //   recommendations: analysisResult.recommendations,
        // });

        res.status(200).json({
            success: true,
            data: analysisResult,
        });
    } catch (error) {
        console.error('Error analyzing resume:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error.' });
    }
};

/**
 * Retrieves historical skill gap analyses for a user.
 */
const getHistory = async (req, res) => {
    try {
        // Mock response for history
        res.status(200).json({
            success: true,
            data: [], // Replace with SkillAnalysis.findAll({ where: { userId: req.user.id } })
        });
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};
const getDependencyGraph = async (req, res) => {
    try {
        const graph = await getSkillGraph(req.user.id);

        return res.status(200).json({
            success: true,
            data: graph,
        });
    } catch (error) {
        console.error('Error fetching skill dependency graph:', error);

        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to fetch skill dependency graph.',
        });
    }
};

const createDependency = async (req, res) => {
    try {
        const {
            skillId,
            prerequisiteSkillId,
            dependencyType,
            weight,
        } = req.body;

        if (!skillId || !prerequisiteSkillId) {
            return res.status(400).json({
                success: false,
                message: 'skillId and prerequisiteSkillId are required.',
            });
        }

        const dependency = await addDependency({
            skillId,
            prerequisiteSkillId,
            dependencyType,
            weight,
        });

        return res.status(201).json({
            success: true,
            data: dependency,
        });
    } catch (error) {
        console.error('Error creating skill dependency:', error);

        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to create skill dependency.',
        });
    }
module.exports = {
    analyzeResume,
    getHistory,
    getDependencyGraph,
    createDependency,
};