const { sequelize } = require('../config/db');

// Import all models
const User = require('./User');
const Exam = require('./Exam');
const Subject = require('./Subject');
const Topic = require('./Topic');
const PYQ = require('./PYQ');
const StudyPlan = require('./StudyPlan');
const Quiz = require('./Quiz');
const QuizAttempt = require('./QuizAttempt');
const Note = require('./Note');
const Flashcard = require('./Flashcard');
const Progress = require('./Progress');
const Feedback = require('./Feedback');
const ActivityLog = require('./ActivityLog');
const UsageQuota = require('./UsageQuota');
const Achievement = require('./Achievement');
const FocusSession = require('./FocusSession');
const QuizTelemetryEvent = require('./QuizTelemetryEvent');
const QuizBookmark = require('./QuizBookmark');
const UserBadge = require('./UserBadge');
const BattleSession = require('./BattleSession');
const BattleParticipant = require('./BattleParticipant');
const PYQAnalysis = require('./PYQAnalysis');
const PYQQuestion = require('./PYQQuestion');
const Notification = require('./Notification');
const PushSubscription = require('./PushSubscription');
const ReadinessSnapshot = require('./ReadinessSnapshot');
const PodcastEpisode = require('./PodcastEpisode');
const Syllabus = require('./Syllabus');
const SyllabusTopic = require('./SyllabusTopic');
// User associations
User.hasMany(Exam, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Subject, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Topic, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(PYQ, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(StudyPlan, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Quiz, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
User.hasMany(QuizAttempt, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Note, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Flashcard, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Progress, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Feedback, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(ActivityLog, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Achievement, { foreignKey: 'userId', as: 'achievements', onDelete: 'CASCADE' });
User.hasMany(UserBadge, { foreignKey: 'userId', as: 'badgesRef', onDelete: 'CASCADE' });

// Exam associations
Exam.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
Exam.hasMany(Subject, { foreignKey: 'exam', onDelete: 'CASCADE' });
Exam.hasMany(PYQ, { foreignKey: 'exam', onDelete: 'CASCADE' });
Exam.hasMany(StudyPlan, { foreignKey: 'exam', onDelete: 'CASCADE' });

// Subject associations
Subject.belongsTo(Exam, { foreignKey: 'exam', as: 'examRef', onDelete: 'CASCADE' });
Subject.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
Subject.hasMany(Topic, { foreignKey: 'subject', onDelete: 'CASCADE' });
Subject.hasMany(PYQ, { foreignKey: 'subject', onDelete: 'CASCADE' });
Subject.hasMany(Quiz, { foreignKey: 'subject', onDelete: 'CASCADE' });
Subject.hasMany(Note, { foreignKey: 'subject', onDelete: 'CASCADE' });
Subject.hasMany(Flashcard, { foreignKey: 'subject', onDelete: 'CASCADE' });
Subject.hasMany(Progress, { foreignKey: 'subject', onDelete: 'CASCADE' });

// Topic associations
Topic.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef', onDelete: 'CASCADE' });
Topic.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
Topic.hasMany(Quiz, { foreignKey: 'topic', onDelete: 'SET NULL' });
Topic.hasMany(Note, { foreignKey: 'topic', onDelete: 'CASCADE' });
Topic.hasMany(Flashcard, { foreignKey: 'topic', onDelete: 'CASCADE' });
Topic.hasMany(Progress, { foreignKey: 'topic', onDelete: 'CASCADE' });

// PYQ associations
PYQ.belongsTo(Exam, { foreignKey: 'exam', as: 'examRef' });
PYQ.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef', onDelete: 'CASCADE' });
PYQ.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

// StudyPlan associations
StudyPlan.belongsTo(Exam, { foreignKey: 'exam', as: 'examRef' });
StudyPlan.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

// Quiz associations
Quiz.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef', onDelete: 'CASCADE' });
Quiz.belongsTo(Topic, { foreignKey: 'topic', as: 'topicRef', onDelete: 'SET NULL' });
Quiz.belongsTo(User, { foreignKey: 'createdBy', as: 'creatorRef' });
Quiz.hasMany(QuizAttempt, { foreignKey: 'quiz', onDelete: 'CASCADE' });
Quiz.hasMany(QuizTelemetryEvent, { foreignKey: 'quiz', onDelete: 'CASCADE' });

// QuizAttempt associations
QuizAttempt.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
QuizAttempt.belongsTo(Quiz, { foreignKey: 'quiz', as: 'quizRef', onDelete: 'CASCADE' });

// Note associations
Note.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef', onDelete: 'CASCADE' });
Note.belongsTo(Topic, { foreignKey: 'topic', as: 'topicRef', onDelete: 'CASCADE' });
Note.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

// Flashcard associations
Flashcard.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
Flashcard.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef', onDelete: 'CASCADE' });
Flashcard.belongsTo(Topic, { foreignKey: 'topic', as: 'topicRef', onDelete: 'CASCADE' });

// Progress associations
Progress.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
Progress.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef', onDelete: 'CASCADE' });
Progress.belongsTo(Topic, { foreignKey: 'topic', as: 'topicRef', onDelete: 'CASCADE' });

// Feedback associations
Feedback.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

// ActivityLog associations
ActivityLog.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

// Achievement associations
Achievement.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

// UserBadge associations
UserBadge.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

// FocusSession associations
FocusSession.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

// QuizTelemetryEvent associations
QuizTelemetryEvent.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
QuizTelemetryEvent.belongsTo(Quiz, { foreignKey: 'quiz', as: 'quizRef', onDelete: 'CASCADE' });
User.hasMany(QuizTelemetryEvent, { foreignKey: 'user', onDelete: 'CASCADE' });

// QuizBookmark associations
QuizBookmark.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
QuizBookmark.belongsTo(Quiz, { foreignKey: 'quiz', as: 'quizRef', onDelete: 'CASCADE' });
User.hasMany(QuizBookmark, { foreignKey: 'user', onDelete: 'CASCADE' });
Quiz.hasMany(QuizBookmark, { foreignKey: 'quiz', onDelete: 'CASCADE' });

// BattleSession and BattleParticipant associations
User.hasMany(BattleSession, { foreignKey: 'hostUserId', onDelete: 'CASCADE' });
BattleSession.belongsTo(User, { foreignKey: 'hostUserId', as: 'hostRef' });

BattleSession.hasMany(BattleParticipant, { foreignKey: 'battleId', onDelete: 'CASCADE' });
BattleParticipant.belongsTo(BattleSession, { foreignKey: 'battleId', as: 'battleRef' });

User.hasMany(BattleParticipant, { foreignKey: 'userId', onDelete: 'CASCADE' });
BattleParticipant.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

BattleSession.belongsTo(Quiz, { foreignKey: 'quizId', as: 'quizRef', onDelete: 'SET NULL' });

// PYQAnalysis and PYQQuestion associations
User.hasMany(PYQAnalysis, { foreignKey: 'userId', onDelete: 'CASCADE' });
PYQAnalysis.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

Subject.hasMany(PYQAnalysis, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
PYQAnalysis.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subjectRef' });

PYQAnalysis.hasMany(PYQQuestion, { foreignKey: 'pyqAnalysisId', onDelete: 'CASCADE' });
PYQQuestion.belongsTo(PYQAnalysis, { foreignKey: 'pyqAnalysisId', as: 'analysisRef' });

// Notification & PushSubscription associations
User.hasMany(Notification, { foreignKey: 'user', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

User.hasMany(PushSubscription, { foreignKey: 'user', onDelete: 'CASCADE' });
PushSubscription.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

User.hasMany(ReadinessSnapshot, { foreignKey: 'userId', onDelete: 'CASCADE' });
ReadinessSnapshot.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

Subject.hasMany(ReadinessSnapshot, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
ReadinessSnapshot.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subjectRef' });

User.hasMany(PodcastEpisode, { foreignKey: 'userId', onDelete: 'CASCADE' });
PodcastEpisode.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

Subject.hasMany(PodcastEpisode, { foreignKey: 'subjectId', onDelete: 'CASCADE' });
PodcastEpisode.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subjectRef' });

User.hasMany(Syllabus, { foreignKey: 'userId', onDelete: 'CASCADE' });
Syllabus.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

Syllabus.hasMany(SyllabusTopic, { foreignKey: 'syllabusId', onDelete: 'CASCADE' });
SyllabusTopic.belongsTo(Syllabus, { foreignKey: 'syllabusId', as: 'syllabusRef' });

Note.hasMany(SyllabusTopic, { foreignKey: 'linkedNoteId', onDelete: 'SET NULL' });
SyllabusTopic.belongsTo(Note, { foreignKey: 'linkedNoteRef', as: 'linkedNoteRef' });

module.exports = {  sequelize,  User,
  Exam,
  Subject,
  Topic,
  PYQ,
  StudyPlan,
  Quiz,
  QuizAttempt,
  Note,
  Flashcard,
  Progress,
  Feedback,
  ActivityLog,
  UsageQuota,
  Achievement,
  UserBadge,
  FocusSession,
  QuizTelemetryEvent,
  QuizBookmark,
  BattleSession,
  BattleParticipant,
  PYQAnalysis,
  PYQQuestion,
  Notification,
  PushSubscription,
  ReadinessSnapshot,
  PodcastEpisode,
  Syllabus,
  SyllabusTopic,
};