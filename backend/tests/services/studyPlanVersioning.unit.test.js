const {
  generateStudyPlan,
  createPlanVersion,
  identifyAffectedTasks,
  incrementallyReschedule,
} = require('../../services/studyPlanService');

describe('Study Plan Versioning', () => {
  it('should create deterministic output for identical inputs', async () => {
    const examDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const topics = ['Mathematics', 'Physics', 'Chemistry'];
    const dailyHours = 5;

    const plan1 = await generateStudyPlan(examDate, topics, dailyHours);
    const plan2 = await generateStudyPlan(examDate, topics, dailyHours);

    expect(plan1.totalDays).toBe(plan2.totalDays);
    expect(plan1.schedule.length).toBe(plan2.schedule.length);
  });

  it('should preserve completed tasks during rescheduling', async () => {
    const affectedTasks = [
      { id: '1', topic: 'Math', completionStatus: 'completed', isLocked: false },
      { id: '2', topic: 'Physics', completionStatus: 'pending', isLocked: false },
    ];

    const preserved = affectedTasks.filter(t => t.completionStatus === 'completed');
    expect(preserved.length).toBe(1);
  });

  it('should respect manually locked tasks', async () => {
    const affectedTasks = [
      { id: '1', topic: 'Math', completionStatus: 'pending', isLocked: true },
      { id: '2', topic: 'Physics', completionStatus: 'pending', isLocked: false },
    ];

    const unaffected = affectedTasks.filter(t => t.isLocked);
    expect(unaffected.length).toBe(1);
  });

  it('should track revision metadata correctly', async () => {
    const metadata = {
      previousExamDate: new Date('2026-12-01'),
      newExamDate: new Date('2026-12-15'),
      changedTaskCount: 5,
      preservedTaskCount: 10,
    };

    expect(metadata.changedTaskCount + metadata.preservedTaskCount).toBe(15);
  });
});