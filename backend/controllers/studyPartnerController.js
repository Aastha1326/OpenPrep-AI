/**
 * @fileoverview Controller for managing study partner requests and shared hub data.
 */
const matchmakingService = require('../services/partnerMatchmakingService');
// const PartnerRequest = require('../models/PartnerRequest');
// const User = require('../models/User');

/**
 * Fetches potential study partner matches for the current user.
 */
const getPotentialMatches = async (req, res) => {
    try {
        // const userId = req.user.id;

        // Mock current user data
        const currentUser = {
            subjects: ['Calculus', 'Physics', 'Computer Science'],
            proficiency: { 'Calculus': 'beginner', 'Physics': 'intermediate', 'Computer Science': 'advanced' },
            availableDays: ['Monday', 'Wednesday', 'Friday']
        };

        // Mock potential partners from DB
        const potentialPartners = [
            {
                id: 'user_1',
                name: 'Alice Johnson',
                avatar: 'AJ',
                subjects: ['Calculus', 'Physics'],
                proficiency: { 'Calculus': 'advanced', 'Physics': 'advanced' },
                availableDays: ['Monday', 'Wednesday', 'Thursday']
            },
            {
                id: 'user_2',
                name: 'Bob Smith',
                avatar: 'BS',
                subjects: ['Computer Science', 'History'],
                proficiency: { 'Computer Science': 'intermediate', 'History': 'beginner' },
                availableDays: ['Tuesday', 'Thursday', 'Saturday']
            }
        ];

        const matches = potentialPartners.map(partner => {
            const compatibility = matchmakingService.calculateCompatibility(currentUser, partner);
            return { ...partner, compatibility };
        }).sort((a, b) => b.compatibility.score - a.compatibility.score);

        res.status(200).json({ success: true, data: matches });
    } catch (error) {
        console.error('Error fetching matches:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Sends a study partner request.
 */
const sendRequest = async (req, res) => {
    try {
        const { targetUserId } = req.body;
        // const userId = req.user.id;

        if (!targetUserId) {
            return res.status(400).json({ success: false, message: 'targetUserId is required.' });
        }

        // Mock request creation
        // await PartnerRequest.create({ senderId: userId, receiverId: targetUserId, status: 'pending' });

        res.status(200).json({ success: true, message: 'Study partner request sent successfully.' });
    } catch (error) {
        console.error('Error sending request:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

/**
 * Fetches the shared resource hub data for an accepted partner pair.
 */
const getSharedHub = async (req, res) => {
    try {
        const { partnerId } = req.params;

        // Mock shared hub data
        const sharedHub = {
            partnerName: 'Alice Johnson',
            tasks: [
                { id: 't1', title: 'Review Calculus Chapter 4', completed: false, assignedTo: 'both' },
                { id: 't2', title: 'Share Physics formula sheet', completed: true, assignedTo: 'user_1' }
            ],
            resources: [
                { id: 'r1', title: 'MIT OpenCourseWare Calculus Link', type: 'link', url: 'https://example.com' },
                { id: 'r2', title: 'Midterm Study Guide.pdf', type: 'file' }
            ]
        };

        res.status(200).json({ success: true, data: sharedHub });
    } catch (error) {
        console.error('Error fetching shared hub:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

module.exports = {
    getPotentialMatches,
    sendRequest,
    getSharedHub,
};
