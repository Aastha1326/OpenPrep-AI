describe('Exam Countdown & Velocity Tracker Calculations', () => {
  const calculateDaysUntilExam = (targetDateStr, todayDate) => {
    if (!targetDateStr) return null;
    const targetDate = new Date(targetDateStr);
    const today = new Date(todayDate);
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);
    const diffTime = targetDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getPaceStatus = (loggedMinutes, requiredMinutes, hasTargetDate) => {
    if (!hasTargetDate) return null;
    if (loggedMinutes >= requiredMinutes) return 'On Track';
    if (loggedMinutes >= requiredMinutes * 0.5) return 'Slightly Behind';
    return 'Action Required';
  };

  it('correctly computes positive days remaining for future exams', () => {
    const today = '2026-08-14';
    const examDate = '2026-09-01'; // 18 days in the future
    const days = calculateDaysUntilExam(examDate, today);
    expect(days).toBe(18);
  });

  it('returns 0 if exam is today', () => {
    const today = '2026-08-14';
    const examDate = '2026-08-14';
    const days = calculateDaysUntilExam(examDate, today);
    expect(days).toBe(0);
  });

  it('categorizes learning pace status correctly based on logged vs required minutes', () => {
    // Case 1: Logged meets or exceeds required minutes
    expect(getPaceStatus(120, 100, true)).toBe('On Track');
    expect(getPaceStatus(100, 100, true)).toBe('On Track');

    // Case 2: Logged is behind but >= 50% of required minutes
    expect(getPaceStatus(60, 100, true)).toBe('Slightly Behind');
    expect(getPaceStatus(50, 100, true)).toBe('Slightly Behind');

    // Case 3: Logged is < 50% of required minutes
    expect(getPaceStatus(40, 100, true)).toBe('Action Required');
    expect(getPaceStatus(0, 100, true)).toBe('Action Required');

    // Case 4: No target exam date set
    expect(getPaceStatus(100, 100, false)).toBeNull();
  });
});
