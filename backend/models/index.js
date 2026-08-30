const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');


const User = require('./User');
const Quiz = require('./Quiz');
const AIUsageLog = require('./AIUsageLog');
const ProviderHealthStatus = require('./ProviderHealthStatus');
const SchedulerVersion = require('./SchedulerVersion');

const FlashcardSchedulingState = require('./FlashcardSchedulingState');
const FlashcardReviewHistory = require('./FlashcardReviewHistory');
const ReviewSubmissionToken = require('./ReviewSubmissionToken');
const QuizValidationLog = require('./QuizValidationLog');
const Folder = require('./Folder');
const Exam = require('./Exam');
const Subject = require('./Subject');
const Topic = require('./Topic');
const SkillDependency = require('./SkillDependency');
const PYQ = require('./PYQ');

const StudyPlan = require('./StudyPlan');
const QuizAttempt = require('./QuizAttempt');

const Note = require('./Note');
const Question = require('./Question');
const QuestionComment = require('./QuestionComment');
const DoubtSession = require('./DoubtSession');
const DoubtSessionMessage = require('./DoubtSessionMessage');
const CommentVote = require('./CommentVote');
const CommentFlag = require('./CommentFlag');
const Flashcard = require('./Flashcard');
const FlashcardDeck = require('./FlashcardDeck');
const DeckCollaborator = require('./DeckCollaborator');
const Progress = require('./Progress');
const UserProgress = require('./UserProgress');
const Feedback = require('./Feedback');
const ActivityLog = require('./ActivityLog');
const AuditLog = require('./AuditLog');
const UsageQuota = require('./UsageQuota');
const Achievement = require('./Achievement');
const FocusSession = require('./FocusSession');
const FocusSessionLog = require('./FocusSessionLog');

const QuizTelemetryEvent = require('./QuizTelemetryEvent');
const QuizBookmark = require('./QuizBookmark');
const DeckRating = require('./DeckRating');
const UserBadge = require('./UserBadge');
const Badge = require('./Badge');
const BattleSession = require('./BattleSession');
const BattleParticipant = require('./BattleParticipant');
const PYQAnalysis = require('./PYQAnalysis');
const PYQQuestion = require('./PYQQuestion');
const Notification = require('./Notification');
const PushSubscription = require('./PushSubscription');
const ReadinessSnapshot = require('./ReadinessSnapshot');
const SubjectGoal = require('./SubjectGoal');
const StudyHabit = require('./StudyHabit')(sequelize, DataTypes);
const HabitLog = require('./HabitLog')(sequelize, DataTypes);
const HabitStreak = require('./HabitStreak')(sequelize, DataTypes);

const StudySquad = require('./StudySquad');
const SquadMember = require('./SquadMember');
const SquadChallenge = require('./SquadChallenge');
const SquadChallengeContribution = require('./SquadChallengeContribution');
const SquadAchievement = require('./SquadAchievement');
const SquadActivity = require('./SquadActivity');
const SquadActivityReaction = require('./SquadActivityReaction');
const Syllabus = require('./Syllabus');
const SyllabusTopic = require('./SyllabusTopic');
const VivaSession = require('./VivaSession');
const BountyQuestion = require('./BountyQuestion');
const BountyAnswer = require('./BountyAnswer');

// User associations
User.hasMany(Exam, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Subject, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Topic, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(PYQ, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Bounty, { foreignKey: 'authorId', as: 'bounties', onDelete: 'CASCADE' });
Bounty.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
Bounty.belongsTo(User, { foreignKey: 'winnerId', as: 'winner' });

Bounty.hasMany(BountySolution, { foreignKey: 'bountyId', as: 'solutions', onDelete: 'CASCADE' });
BountySolution.belongsTo(Bounty, { foreignKey: 'bountyId', as: 'bounty' });
BountySolution.belongsTo(User, { foreignKey: 'authorId', as: 'author' });

BountySolution.hasMany(BountySolutionVote, { foreignKey: 'solutionId', as: 'votes', onDelete: 'CASCADE' });
BountySolutionVote.belongsTo(BountySolution, { foreignKey: 'solutionId', as: 'solution' });
User.hasMany(StudyPlan, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(LearningPath, { foreignKey: 'userId', onDelete: 'CASCADE' });
LearningPath.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });
User.hasMany(Quiz, { foreignKey: 'createdBy', onDelete: 'CASCADE' });
User.hasMany(QuizAttempt, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Note, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Flashcard, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Question, { foreignKey: 'user', onDelete: 'CASCADE' });
Question.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
User.hasMany(QuestionComment, { foreignKey: 'authorId', onDelete: 'CASCADE' });
QuestionComment.belongsTo(User, { foreignKey: 'authorId', as: 'author' });
QuestionComment.hasMany(QuestionComment, { foreignKey: 'parentCommentId', as: 'replies', onDelete: 'CASCADE' });
QuestionComment.belongsTo(QuestionComment, { foreignKey: 'parentCommentId', as: 'parent' });
QuestionComment.hasMany(CommentVote, { foreignKey: 'commentId', onDelete: 'CASCADE' });
CommentVote.belongsTo(QuestionComment, { foreignKey: 'commentId', as: 'comment' });
QuestionComment.hasMany(CommentFlag, { foreignKey: 'commentId', onDelete: 'CASCADE' });
CommentFlag.belongsTo(QuestionComment, { foreignKey: 'commentId', as: 'comment' });
CommentFlag.belongsTo(User, { foreignKey: 'reporterId', as: 'reporter' });
User.hasMany(DoubtSession, { foreignKey: 'studentId', onDelete: 'CASCADE' });
DoubtSession.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
DoubtSession.hasMany(DoubtSessionMessage, { foreignKey: 'sessionId', as: 'messages', onDelete: 'CASCADE' });
DoubtSessionMessage.belongsTo(DoubtSession, { foreignKey: 'sessionId', as: 'session' });
Note.hasMany(Question, { foreignKey: 'noteId', onDelete: 'CASCADE' });
Question.belongsTo(Note, { foreignKey: 'noteId', as: 'noteRef' });
User.hasMany(FlashcardDeck, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Progress, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Feedback, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(ActivityLog, { foreignKey: 'user', onDelete: 'CASCADE' });
User.hasMany(Achievement, { foreignKey: 'userId', as: 'achievements', onDelete: 'CASCADE' });
User.hasMany(UserBadge, { foreignKey: 'userId', as: 'badgesRef', onDelete: 'CASCADE' });
User.hasMany(UsageQuota, { foreignKey: 'userId', onDelete: 'CASCADE' });
User.hasMany(VivaSession, { foreignKey: 'userId', as: 'vivaSessions', onDelete: 'CASCADE' });
VivaSession.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

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
Subject.hasMany(FlashcardDeck, { foreignKey: 'subject', onDelete: 'SET NULL' });
Subject.hasMany(Progress, { foreignKey: 'subject', onDelete: 'CASCADE' });
Subject.hasMany(VivaSession, { foreignKey: 'subjectId', as: 'vivaSessions', onDelete: 'CASCADE' });
VivaSession.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subjectRef' });

// FlashcardDeck associations
FlashcardDeck.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
FlashcardDeck.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef', onDelete: 'SET NULL' });
FlashcardDeck.hasMany(Flashcard, { foreignKey: 'deckId', onDelete: 'CASCADE' });
Flashcard.belongsTo(FlashcardDeck, { foreignKey: 'deckId', as: 'deckRef' });

// DeckCollaborator associations
FlashcardDeck.hasMany(DeckCollaborator, { foreignKey: 'deckId', onDelete: 'CASCADE' });
DeckCollaborator.belongsTo(FlashcardDeck, { foreignKey: 'deckId', as: 'deckRef' });

User.hasMany(DeckCollaborator, { foreignKey: 'userId', onDelete: 'CASCADE' });
DeckCollaborator.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

DeckCollaborator.belongsTo(User, { foreignKey: 'invitedBy', as: 'invitedByRef' });

// Topic associations
Topic.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef', onDelete: 'CASCADE' });
Topic.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
Topic.hasMany(Quiz, { foreignKey: 'topic', onDelete: 'SET NULL' });
Topic.hasMany(Note, { foreignKey: 'topic', onDelete: 'CASCADE' });
Topic.hasMany(Flashcard, { foreignKey: 'topic', onDelete: 'CASCADE' });
Topic.hasMany(Progress, { foreignKey: 'topic', onDelete: 'CASCADE' });

Topic.hasMany(SkillDependency, {
  foreignKey: 'skillId',
  as: 'dependencies',
  onDelete: 'CASCADE',
});

Topic.hasMany(SkillDependency, {
  foreignKey: 'prerequisiteSkillId',
  as: 'dependents',
  onDelete: 'CASCADE',
});

SkillDependency.belongsTo(Topic, {
  foreignKey: 'skillId',
  as: 'skill',
});

SkillDependency.belongsTo(Topic, {
  foreignKey: 'prerequisiteSkillId',
  as: 'prerequisite',
});

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
QuizAttempt.hasOne(ExamIntegrityReport, { foreignKey: 'quizAttemptId', as: 'integrityReport', onDelete: 'CASCADE' });
ExamIntegrityReport.belongsTo(QuizAttempt, { foreignKey: 'quizAttemptId', as: 'attemptRef' });
ExamIntegrityReport.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

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

// Badge associations
Badge.hasMany(UserBadge, { foreignKey: 'badgeCode', sourceKey: 'id', as: 'userBadges' });
UserBadge.belongsTo(Badge, { foreignKey: 'badgeCode', targetKey: 'id', as: 'badge' });

// FocusSession associations
FocusSession.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

// FocusSessionLog associations
FocusSessionLog.belongsTo(User, { foreignKey: 'user', as: 'userRef' });

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
Subject.hasOne(SubjectGoal, { foreignKey: 'subject', as: 'goal', onDelete: 'CASCADE' });
SubjectGoal.belongsTo(Subject, { foreignKey: 'subject', as: 'subjectRef' });
// StudySquad associationsUser.hasMany(SubjectGoal, { foreignKey: 'user', as: 'subjectGoals', onDelete: 'CASCADE' });
SubjectGoal.belongsTo(User, { foreignKey: 'user', as: 'userRef' });
User.hasMany(StudySquad, { foreignKey: 'adminUserId', as: 'ownedSquads', onDelete: 'CASCADE' });
StudySquad.belongsTo(User, { foreignKey: 'adminUserId', as: 'adminRef' });

StudySquad.hasMany(SquadMember, { foreignKey: 'squadId', onDelete: 'CASCADE' });
SquadMember.belongsTo(StudySquad, { foreignKey: 'squadId', as: 'squadRef' });

User.hasMany(SquadMember, { foreignKey: 'userId', onDelete: 'CASCADE' });
SquadMember.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

StudySquad.hasMany(SquadChallenge, { foreignKey: 'squadId', onDelete: 'CASCADE' });
SquadChallenge.belongsTo(StudySquad, { foreignKey: 'squadId', as: 'squadRef' });

SquadChallenge.hasMany(SquadChallengeContribution, { foreignKey: 'challengeId', onDelete: 'CASCADE' });
SquadChallengeContribution.belongsTo(SquadChallenge, { foreignKey: 'challengeId', as: 'challengeRef' });

User.hasMany(SquadChallengeContribution, { foreignKey: 'userId', onDelete: 'CASCADE' });
SquadChallengeContribution.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

StudySquad.hasMany(SquadAchievement, { foreignKey: 'squadId', onDelete: 'CASCADE' });
SquadAchievement.belongsTo(StudySquad, { foreignKey: 'squadId', as: 'squadRef' });

StudySquad.hasMany(SquadActivity, { foreignKey: 'squadId', onDelete: 'CASCADE' });
SquadActivity.belongsTo(StudySquad, { foreignKey: 'squadId', as: 'squadRef' });

User.hasMany(SquadActivity, { foreignKey: 'userId', onDelete: 'CASCADE' });
SquadActivity.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

SquadActivity.hasMany(SquadActivityReaction, { foreignKey: 'activityId', onDelete: 'CASCADE' });
SquadActivityReaction.belongsTo(SquadActivity, { foreignKey: 'activityId', as: 'activityRef' });

User.hasMany(SquadActivityReaction, { foreignKey: 'userId', onDelete: 'CASCADE' });
SquadActivityReaction.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

// Syllabus associations
User.hasMany(Syllabus, { foreignKey: 'userId', onDelete: 'CASCADE' });
Syllabus.belongsTo(User, { foreignKey: 'userId', as: 'userRef' });

Syllabus.hasMany(SyllabusTopic, { foreignKey: 'syllabusId', onDelete: 'CASCADE' });
SyllabusTopic.belongsTo(Syllabus, { foreignKey: 'syllabusId', as: 'syllabusRef' });

SyllabusTopic.belongsTo(Note, { foreignKey: 'linkedNoteId', as: 'linkedNote', onDelete: 'SET NULL' });

// Bounty associations
User.hasMany(BountyQuestion, { foreignKey: 'userId', as: 'bountyQuestions', onDelete: 'CASCADE' });
BountyQuestion.belongsTo(User, { foreignKey: 'userId', as: 'creator' });

Subject.hasMany(BountyQuestion, { foreignKey: 'subjectId', as: 'bountyQuestions', onDelete: 'SET NULL' });
BountyQuestion.belongsTo(Subject, { foreignKey: 'subjectId', as: 'subjectRef' });

BountyQuestion.hasMany(BountyAnswer, { foreignKey: 'questionId', as: 'answers', onDelete: 'CASCADE' });
BountyAnswer.belongsTo(BountyQuestion, { foreignKey: 'questionId', as: 'question' });

User.hasMany(BountyAnswer, { foreignKey: 'userId', as: 'bountyAnswers', onDelete: 'CASCADE' });
BountyAnswer.belongsTo(User, { foreignKey: 'userId', as: 'author' });

module.exports = {  sequelize,  User,  Exam,
  Subject,
  Topic,
  PYQ,
  StudyPlan,
  Quiz,
  QuizAttempt,
  Note,
  Question,
  SchedulerVersion,
  FlashcardSchedulingState,
  FlashcardReviewHistory,
  ReviewSubmissionToken,
  QuestionComment,
  DoubtSession,
  DoubtSessionMessage,
  CommentVote,
  CommentFlag,
  ModeratorAuditLog,
  Flashcard,
  FlashcardDeck,
  DeckCollaborator,
  Progress,
  UserProgress,
  Feedback,
  ActivityLog,
  AuditLog,
  UsageQuota,
  Achievement,
  FocusSession,
  QuizValidationLog,
  QuizTelemetryEvent,
  QuizBookmark,
  DeckRating,
  StudyGoal,
  StudyGoalProgress,
  WeeklyStudyReport,
  StudyMilestone,
  UserMilestone,
  FocusSessionLog,
  UserBadge,
  Badge,
  BattleSession,
  BattleParticipant,
  PYQAnalysis,
  PYQQuestion,
  Notification,
  PushSubscription,
  ReadinessSnapshot,
  SubjectGoal,
  StudySquad,
  SquadMember,
  SquadChallenge,
  SquadChallengeContribution,
  SquadAchievement,
  SquadActivity,
  SquadActivityReaction,
  FlashcardDeck,
  DeckCollaborator,
  VivaSession,
  BountyQuestion,
  BountyAnswer,
};
