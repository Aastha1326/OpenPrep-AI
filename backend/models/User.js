const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const User = sequelize.define(
  'User',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: { msg: 'Please add a name' },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: { msg: 'Email already exists' },
      validate: {
        isEmail: { msg: 'Please add a valid email' },
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: {
          args: [8],
          msg: 'Password must be at least 8 characters long',
        },
      },
    },
    role: {
      type: DataTypes.ENUM('student', 'contributor', 'admin'),
      defaultValue: 'student',
    },
    provider: {
      type: DataTypes.STRING,
      defaultValue: 'local',
    },
    socialId: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    streakCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    streakLastActive: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    streakFreezes: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    studyHours: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    avatar: {
      type: DataTypes.STRING,
      defaultValue: '',
    },
    leaderboardVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    receiveWeeklyDigest: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    },
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    emailVerificationToken: {
      type: DataTypes.STRING,
    },
    emailVerificationExpire: {
      type: DataTypes.DATE,
    },
    resetPasswordToken: {
      type: DataTypes.STRING,
    },
    resetPasswordExpire: {
      type: DataTypes.DATE,
    },
    resetPasswordOtpHash: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordOtpExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    resetPasswordAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    refreshTokens: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    refreshTokenExpire: {
      type: DataTypes.DATE,
    },
    loginAttempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lockoutUntil: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    sm2EasyFactorModifier: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
    },
    sm2IntervalModifier: {
      type: DataTypes.FLOAT,
      defaultValue: 1.0,
    },
    sm2Step1Interval: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    sm2Step2Interval: {
      type: DataTypes.INTEGER,
      defaultValue: 6,
    },
    leaderboardVisible: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    receiveWeeklyDigest: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    pushSubscription: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    dailyReminderTime: {
      type: DataTypes.STRING,
      defaultValue: '09:00',
    },
    xp: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    level: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    badges: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    skillPoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    unlockedNodes: {
      type: DataTypes.JSONB,
      defaultValue: ['root'],
    },
    streakFreezesEquippedThisMonth: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    lastStreakFreezeEquipMonth: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    hooks: {
      beforeSave: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
    },
  }
);

// Match user entered password to hashed password in database
User.prototype.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate and hash reset/verification tokens
User.prototype.generateToken = function (field) {
  const token = crypto.randomBytes(32).toString('hex');
  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  if (field === 'resetPassword') {
    this.resetPasswordToken = hashed;
    this.resetPasswordExpire = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  } else if (field === 'emailVerification') {
    this.emailVerificationToken = hashed;
    this.emailVerificationExpire = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  }
  return token;
};

module.exports = User;
