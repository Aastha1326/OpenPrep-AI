/**
 * @fileoverview Controller for managing study group creation, matching, and membership.
 */
const matchingService = require('../services/matchingService');
// const StudyGroup = require('../models/StudyGroup');

/**
 * Creates a new study group.
 */
const createGroup = async (req, res) => {
    try {
        const { name, subject, examDate, maxMembers, nextSessionTime } = req.body;
        // const hostId = req.user.id;

        if (!name || !subject) {
            return res.status(400).json({ success: false, message: 'Name and subject are required.' });
        }

        // Mock DB creation
        const newGroup = {
            id: `group_${Date.now()}`,
            name,
            subject,
            examDate,
            maxMembers: maxMembers || 5,
            currentMembers: 1,
            nextSessionTime,
            status: 'open',
        };

        res.status(201).json({
            success: true,
            data: newGroup,
        });
    } catch (error) {
        console.error('Error creating study group:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Gets recommended study groups for a user.
 */
const getRecommendations = async (req, res) => {
    try {
        const { subject, examDate } = req.query;

        if (!subject) {
            return res.status(400).json({ success: false, message: 'Subject is required for matching.' });
        }

        const recommendations = await matchingService.findMatchingGroups(subject, examDate);

        res.status(200).json({
            success: true,
            data: recommendations,
        });
    } catch (error) {
        console.error('Error getting recommendations:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

/**
 * Joins a study group.
 */
const joinGroup = async (req, res) => {
    try {
        const { groupId } = req.params;

        // Mock DB update
        // const group = await StudyGroup.findByPk(groupId);
        // if (group.currentMembers < group.maxMembers) {
        //   group.currentMembers += 1;
        //   await group.save();
        // }

        res.status(200).json({
            success: true,
            message: 'Successfully joined the study group.',
        });
    } catch (error) {
        console.error('Error joining group:', error);
        res.status(500).json({ success: false, message: 'Internal server error.' });
    }
};

module.exports = {
    createGroup,
    getRecommendations,
    joinGroup,
};
