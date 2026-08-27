const EventEmitter = require('events');
const cacheService = require('./cacheService');

const invalidationEvents = new EventEmitter();

const userPatterns = (userId) => [
  `openprep:cache:route:${userId}:*`,
  `user_${userId}:*`,
  `openprep:cache:user:${userId}:*`,
];

const invalidateUser = async (userId) => {
  if (!userId) return;
  await cacheService.del(userPatterns(userId));
};

const invalidateExam = async (examId) => {
  if (!examId) return;
  await cacheService.del([
    `openprep:cache:exam:${examId}:*`,
    `exam:${examId}:*`,
    `openprep:cache:route:*:openprep:cache:exam:${examId}:*`,
  ]);
};

invalidationEvents.on('userChanged', (userId) => {
  invalidateUser(userId).catch((error) => console.warn('[Cache] User invalidation failed:', error.message));
});
invalidationEvents.on('examChanged', (examId) => {
  invalidateExam(examId).catch((error) => console.warn('[Cache] Exam invalidation failed:', error.message));
});
invalidationEvents.on('globalChanged', () => {
  cacheService.del(['openprep:cache:route:*', 'leaderboard:*']).catch((error) => {
    console.warn('[Cache] Global invalidation failed:', error.message);
  });
});

module.exports = {
  invalidationEvents,
  invalidateUser,
  invalidateExam,
  emitUserChanged: (userId) => invalidationEvents.emit('userChanged', userId),
  emitExamChanged: (examId) => invalidationEvents.emit('examChanged', examId),
  emitGlobalChanged: () => invalidationEvents.emit('globalChanged'),
};
