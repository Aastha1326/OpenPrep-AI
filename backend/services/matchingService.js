/**
 * @fileoverview Service for matching users with relevant study groups.
 */

/**
 * Finds study groups that match the user's subject and have available slots.
 * 
 * @param {string} subject - The subject the user wants to study.
 * @param {string} examDate - The user's exam date (optional).
 * @returns {Promise<Array>} A list of recommended study groups.
 */
async function findMatchingGroups(subject, examDate) {
    try {
        // Mock database query
        // const groups = await StudyGroup.findAll({
        //   where: {
        //     subject: { [Op.iLike]: `%${subject}%` },
        //     status: 'open',
        //     currentMembers: { [Op.lt]: sequelize.col('maxMembers') }
        //   },
        //   order: [['examDate', 'ASC']]
        // });

        // Simulated response
        const mockGroups = [
            {
                id: 'group-1',
                name: 'Calculus Final Prep',
                subject: 'Mathematics',
                hostName: 'Alice',
                currentMembers: 2,
                maxMembers: 4,
                nextSessionTime: new Date(Date.now() + 86400000).toISOString(),
            },
            {
                id: 'group-2',
                name: 'Linear Algebra Study Buddies',
                subject: 'Mathematics',
                hostName: 'Bob',
                currentMembers: 1,
                maxMembers: 3,
                nextSessionTime: new Date(Date.now() + 172800000).toISOString(),
            }
        ];

        return mockGroups.filter(g => g.subject.toLowerCase().includes(subject.toLowerCase()));
    } catch (error) {
        console.error('Error matching study groups:', error.message);
        throw new Error('Failed to find matching study groups.');
    }
}

module.exports = {
    findMatchingGroups,
};
