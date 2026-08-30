/**
 * @fileoverview Controller for managing the user's reference library and citation generation.
 */
const citationService = require('../services/citationGeneratorService');
// const Reference = require('../models/Reference');

/**
 * Processes an input to generate and save a new citation.
 */
const createCitation = async (req, res) => {
    try {
        const { input, subject, project } = req.body;
        // const userId = req.user.id;

        if (!input || input.trim().length < 5) {
            return res.status(400).json({ success: false, message: 'Valid input (URL or text) is required.' });
        }

        const citationData = await citationService.generateCitationData(input);

        // Mock saving to database
        const newReference = {
            id: `ref_${Date.now()}`,
            ...citationData,
            subject: subject || 'General',
            project: project || 'Unassigned',
            createdAt: new Date().toISOString()
        };

        res.status(201).json({
            success: true,
            data: newReference,
            message: 'Citation generated and saved successfully.'
        });
    } catch (error) {
        console.error('Error creating citation:', error);
        res.status(500).json({ success: false, message: error.message || 'Internal server error' });
    }
};

/**
 * Fetches the user's reference library, optionally filtered by subject or project.
 */
const getReferences = async (req, res) => {
    try {
        const { subject, project } = req.query;

        // Mock database fetch
        const mockReferences = [
            {
                id: 'ref_1',
                sourceType: 'journal',
                title: 'The Impact of AI on Education',
                author: 'Smith, J. & Doe, A.',
                year: '2023',
                publisher: 'Journal of Educational Technology',
                url: 'https://example.com/ai-education',
                subject: 'Computer Science',
                project: 'Final Thesis',
                createdAt: '2023-10-01T12:00:00Z'
            },
            {
                id: 'ref_2',
                sourceType: 'book',
                title: 'Introduction to Algorithms',
                author: 'Cormen, T. H. et al.',
                year: '2009',
                publisher: 'MIT Press',
                url: '',
                subject: 'Computer Science',
                project: 'Midterm Review',
                createdAt: '2023-09-15T08:30:00Z'
            }
        ];

        let filtered = mockReferences;
        if (subject) filtered = filtered.filter(r => r.subject === subject);
        if (project) filtered = filtered.filter(r => r.project === project);

        res.status(200).json({ success: true, data: filtered });
    } catch (error) {
        console.error('Error fetching references:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Deletes a reference from the user's library.
 */
const deleteReference = async (req, res) => {
    try {
        const { id } = req.params;

        // Mock deletion
        res.status(200).json({ success: true, message: 'Reference deleted successfully.' });
    } catch (error) {
        console.error('Error deleting reference:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    createCitation,
    getReferences,
    deleteReference,
};
