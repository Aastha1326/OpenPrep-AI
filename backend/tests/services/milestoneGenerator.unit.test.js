const { generateMilestones, MILESTONE_TYPES } = require('../../services/milestoneGeneratorService');

describe('milestoneGeneratorService', () => {
  describe('generateMilestones', () => {
    it('returns an empty array when end date precedes start date', () => {
      const milestones = generateMilestones({
        startDate: '2026-08-10',
        endDate: '2026-08-01',
      });
      expect(milestones).toEqual([]);
    });

    it('returns an empty array for invalid dates', () => {
      expect(generateMilestones({ startDate: 'not-a-date', endDate: '2026-08-01' })).toEqual([]);
      expect(generateMilestones({ startDate: '2026-08-01', endDate: null })).toEqual([]);
    });

    it('creates weekly checkpoints, mid-course, final review and exam day milestones', () => {
      const milestones = generateMilestones({
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        examName: 'Semester Exams',
      });

      const types = milestones.map((m) => m.type);
      expect(types).toContain(MILESTONE_TYPES.WEEKLY_CHECKPOINT);
      expect(types).toContain(MILESTONE_TYPES.MID_COURSE_REVIEW);
      expect(types).toContain(MILESTONE_TYPES.FINAL_REVIEW);
      expect(types).toContain(MILESTONE_TYPES.EXAM_DAY);
    });

    it('sorts milestones ascending and keeps every date within the plan range', () => {
      const start = '2026-08-01';
      const end = '2026-08-31';
      const milestones = generateMilestones({ startDate: start, endDate: end });

      const dates = milestones.map((m) => m.date);
      expect(dates).toEqual([...dates].sort());
      dates.forEach((d) => {
        expect(d >= start).toBe(true);
        expect(d <= end).toBe(true);
      });
    });

    it('never assigns two milestones to the same date', () => {
      for (const end of ['2026-08-07', '2026-08-14', '2026-08-31', '2026-10-20']) {
        const milestones = generateMilestones({ startDate: '2026-08-01', endDate: end });
        const dates = milestones.map((m) => m.date);
        expect(new Set(dates).size).toBe(dates.length);
      }
    });

    it('places the exam day milestone exactly on the end date', () => {
      const milestones = generateMilestones({ startDate: '2026-08-01', endDate: '2026-08-31' });
      const examDay = milestones.find((m) => m.type === MILESTONE_TYPES.EXAM_DAY);
      expect(examDay).toBeTruthy();
      expect(examDay.date).toBe('2026-08-31');
      expect(examDay.status).toBe('pending');
    });

    it('places the final review the day before the exam for plans of 3+ days', () => {
      const milestones = generateMilestones({ startDate: '2026-08-01', endDate: '2026-08-31' });
      const finalReview = milestones.find((m) => m.type === MILESTONE_TYPES.FINAL_REVIEW);
      expect(finalReview.date).toBe('2026-08-30');
    });

    it('omits weekly and mid-course milestones for very short plans', () => {
      const milestones = generateMilestones({ startDate: '2026-08-01', endDate: '2026-08-03' });
      const types = milestones.map((m) => m.type);
      expect(types).toEqual([MILESTONE_TYPES.FINAL_REVIEW, MILESTONE_TYPES.EXAM_DAY]);
    });

    it('gives every milestone a stable shape', () => {
      const milestones = generateMilestones({ startDate: '2026-08-01', endDate: '2026-08-31' });
      milestones.forEach((m) => {
        expect(m.id).toMatch(/^[0-9a-f-]{36}$/);
        expect(typeof m.title).toBe('string');
        expect(m.title.length).toBeGreaterThan(0);
        expect(m.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        expect(typeof m.type).toBe('string');
        expect(typeof m.description).toBe('string');
        expect(m.description.length).toBeGreaterThan(0);
        expect(m.status).toBe('pending');
        expect(typeof m.topicCount).toBe('number');
      });
    });

    it('enriches weekly checkpoint descriptions with covered topics from daily goals', () => {
      const dailyGoals = [
        { date: '2026-08-01', tasks: [{ topicName: 'Linear Regression', title: 'Study LR' }] },
        { date: '2026-08-02', tasks: [{ topicName: 'Neural Networks', title: 'Study NN' }] },
      ];
      const milestones = generateMilestones({
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        dailyGoals,
      });

      const weekOne = milestones.find((m) => m.type === MILESTONE_TYPES.WEEKLY_CHECKPOINT);
      expect(weekOne.description).toContain('Linear Regression');
      expect(weekOne.description).toContain('Neural Networks');
      expect(weekOne.topicCount).toBe(2);
    });

    it('counts each topic once even when repeated across days', () => {
      const dailyGoals = [
        { date: '2026-08-01', tasks: [{ topicName: 'SQL', title: 'Study SQL' }] },
        { date: '2026-08-02', tasks: [{ topicName: 'SQL', title: 'SQL practice' }] },
      ];
      const milestones = generateMilestones({
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        dailyGoals,
      });

      const weekOne = milestones.find((m) => m.type === MILESTONE_TYPES.WEEKLY_CHECKPOINT);
      expect(weekOne.topicCount).toBe(1);
    });

    it('includes the exam name in the exam day title when provided', () => {
      const milestones = generateMilestones({
        startDate: '2026-08-01',
        endDate: '2026-08-31',
        examName: 'Semester Exams',
      });
      const examDay = milestones.find((m) => m.type === MILESTONE_TYPES.EXAM_DAY);
      expect(examDay.title).toContain('Semester Exams');
    });
  });
});
