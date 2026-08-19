'use strict';
const bcrypt = require('bcryptjs');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await queryInterface.bulkInsert('Users', [
      {
        id: '111e4567-e89b-12d3-a456-426614174000',
        name: 'Demo Admin User',
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        provider: 'local',
        authProvider: 'local',
        streakCount: 5,
        studyHours: 12.5,
        avatar: '',
        isEmailVerified: true,
        receiveWeeklyDigest: true,
        dailyReminderTime: '09:00',
        examCountdownPreferences: JSON.stringify({
          targetExamDate: null,
          targetScore: null,
          milestones: []
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '222e4567-e89b-12d3-a456-426614174000',
        name: 'Demo Student User',
        email: 'student@example.com',
        password: hashedPassword,
        role: 'student',
        provider: 'local',
        authProvider: 'local',
        streakCount: 2,
        studyHours: 4.2,
        avatar: '',
        isEmailVerified: true,
        receiveWeeklyDigest: true,
        dailyReminderTime: '09:00',
        examCountdownPreferences: JSON.stringify({
          targetExamDate: null,
          targetScore: null,
          milestones: []
        }),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ], {});
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('Users', {
      email: {
        [Sequelize.Op.in]: ['admin@example.com', 'student@example.com']
      }
    }, {});
  }
};
