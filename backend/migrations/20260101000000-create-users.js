'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true
      },
      password: {
        type: Sequelize.STRING,
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('student', 'contributor', 'admin'),
        defaultValue: 'student'
      },
      provider: {
        type: Sequelize.STRING,
        defaultValue: 'local'
      },
      socialId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      googleId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      githubId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      avatarUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      authProvider: {
        type: Sequelize.ENUM('local', 'google', 'github'),
        defaultValue: 'local'
      },
      streakCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      streakLastActive: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      streakFreezes: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      studyHours: {
        type: Sequelize.FLOAT,
        defaultValue: 0
      },
      avatar: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      leaderboardVisible: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      receiveWeeklyDigest: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        allowNull: false
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      emailVerificationToken: {
        type: Sequelize.STRING
      },
      emailVerificationExpire: {
        type: Sequelize.DATE
      },
      resetPasswordToken: {
        type: Sequelize.STRING
      },
      resetPasswordExpire: {
        type: Sequelize.DATE
      },
      resetPasswordOtpHash: {
        type: Sequelize.STRING,
        allowNull: true
      },
      resetPasswordOtpExpires: {
        type: Sequelize.DATE,
        allowNull: true
      },
      resetPasswordAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      refreshTokens: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      refreshTokenExpire: {
        type: Sequelize.DATE
      },
      loginAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lockoutUntil: {
        type: Sequelize.DATE,
        allowNull: true
      },
      sm2EasyFactorModifier: {
        type: Sequelize.FLOAT,
        defaultValue: 1.0
      },
      sm2IntervalModifier: {
        type: Sequelize.FLOAT,
        defaultValue: 1.0
      },
      sm2Step1Interval: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      sm2Step2Interval: {
        type: Sequelize.INTEGER,
        defaultValue: 6
      },
      googleCalendarRefreshToken: {
        type: Sequelize.STRING,
        allowNull: true
      },
      syncGoogleCalendar: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      hideActivityFromSquad: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      pushSubscription: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      dailyReminderTime: {
        type: Sequelize.STRING,
        defaultValue: '09:00'
      },
      examCountdownPreferences: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {
          targetExamDate: null,
          targetScore: null,
          milestones: []
        }
      },
      dailyAiUsageCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastAiUsageReset: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      xp: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      level: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      badges: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      skillPoints: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      unlockedNodes: {
        type: Sequelize.JSONB,
        defaultValue: ['root']
      },
      streakFreezesEquippedThisMonth: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastStreakFreezeEquipMonth: {
        type: Sequelize.STRING,
        allowNull: true
      },
      currentStreak: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      longestStreak: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      lastActivityDate: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      streakFreezesAvailable: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
    // Drop enum types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_role";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_Users_authProvider";');
  }
};
