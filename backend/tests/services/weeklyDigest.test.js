const { sendWeeklyDigests } = require('../../services/weeklyDigestService');
const User = require('../../models/User');
const Progress = require('../../models/Progress');
const Topic = require('../../models/Topic');
const Subject = require('../../models/Subject');
const ActivityLog = require('../../models/ActivityLog');
const sendEmail = require('../../services/emailService');
const { v4: uuidv4 } = require('uuid');

// Mock nodemailer email service
vi.mock('../../services/emailService', () => {
  return {
    default: vi.fn().mockImplementation(() => Promise.resolve({ success: true })),
  };
});

describe('Weekly Email Study Summary Service Tests', () => {
  let testUser;
  let testSubject;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create a dummy user
    testUser = await User.create({
      name: 'Test Student',
      email: `student_${Date.now()}_${Math.random()}@test.com`,
      password: 'Password123!',
      isEmailVerified: true,
      receiveWeeklyDigest: true,
      streakCount: 5,
    });

    // Create a dummy subject
    testSubject = await Subject.create({
      id: uuidv4(),
      name: 'Mathematics',
      user: testUser.id,
    });
  });

  afterEach(async () => {
    // Cleanup database
    await ActivityLog.destroy({ where: { user: testUser.id } });
    await Progress.destroy({ where: { user: testUser.id } });
    await Topic.destroy({ where: { user: testUser.id } });
    await Subject.destroy({ where: { id: testSubject.id } });
    await User.destroy({ where: { id: testUser.id } });
  });

  it('should compile weekly study hours from logs and send digest emails', async () => {
    // 1. Simulate logging study hours (which creates ActivityLog entries)
    await ActivityLog.create({
      user: testUser.id,
      activityType: 'study_plan_create',
      description: 'Studied for 2.5 hours',
    });

    await ActivityLog.create({
      user: testUser.id,
      activityType: 'study_plan_create',
      description: 'Studied for 1.5 hours',
    });

    // 2. Simulate completing a topic
    const testTopic = await Topic.create({
      id: uuidv4(),
      name: 'Algebra',
      subject: testSubject.id,
      user: testUser.id,
      status: 'Strong',
    });

    await Progress.create({
      user: testUser.id,
      subject: testSubject.id,
      topic: testTopic.id,
      completionPercentage: 100,
      studyHours: 4.0,
    });

    // 3. Simulate a weak topic
    const weakTopic = await Topic.create({
      id: uuidv4(),
      name: 'Geometry',
      subject: testSubject.id,
      user: testUser.id,
      status: 'Weak',
    });

    await Progress.create({
      user: testUser.id,
      subject: testSubject.id,
      topic: weakTopic.id,
      completionPercentage: 20,
      studyHours: 1.0,
    });

    // Run the weekly digest job
    await sendWeeklyDigests();

    // Verify sendEmail was called with whitelisted user details
    expect(sendEmail).toHaveBeenCalled();
    const sentArgs = vi.mocked(sendEmail).mock.calls[0][0];
    
    expect(sentArgs.to).toBe(testUser.email);
    expect(sentArgs.subject).toBe('Weekly Study Digest — OpenPrep AI');
    expect(sentArgs.text).toContain('Study Hours Logged: 4.0');
    expect(sentArgs.text).toContain('Completed Topics: 1');
    expect(sentArgs.text).toContain('Current Streak: 5 days');
    expect(sentArgs.attachments).toBeDefined();
    expect(sentArgs.attachments).toHaveLength(1);
    expect(sentArgs.attachments[0].filename).toContain('mastery_analytics_');
    expect(sentArgs.attachments[0].contentType).toBe('application/pdf');
    expect(Buffer.isBuffer(sentArgs.attachments[0].content)).toBe(true);
  });

  it('should skip users who have receiveWeeklyDigest set to false', async () => {
    // Disable weekly digests for user
    await testUser.update({ receiveWeeklyDigest: false });

    // Run weekly digest job
    await sendWeeklyDigests();

    // Verify email was NOT sent
    expect(sendEmail).not.toHaveBeenCalled();
  });
});
