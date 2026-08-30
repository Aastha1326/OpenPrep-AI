const { sequelize } = require('../models');
const { describe, it, expect } = require('vitest');

describe('Database Index & Query Optimization Suite', () => {
  it('should utilize idx_flashcards_user_due for fetching due flashcards', async () => {
    const query = `
      EXPLAIN SELECT * FROM "Flashcards" 
      WHERE "userId" = '00000000-0000-0000-0000-000000000000' 
        AND "nextReviewDate" <= NOW() 
        AND "isArchived" = false;
    `;
    const [results] = await sequelize.query(query);
    const plan = results.map(row => row['QUERY PLAN']).join('\n');
    
    // Check if the query plan uses index scan or bitmap index scan on idx_flashcards_user_due
    expect(plan).toMatch(/Index Scan|Bitmap Index Scan|idx_flashcards_user_due/i);
  });

  it('should utilize idx_quiz_attempts_user_exam for fetching user quiz attempts', async () => {
    const query = `
      EXPLAIN SELECT * FROM "QuizAttempts" 
      WHERE "userId" = '00000000-0000-0000-0000-000000000000' 
        AND "examId" = '00000000-0000-0000-0000-000000000000' 
      ORDER BY "createdAt" DESC;
    `;
    const [results] = await sequelize.query(query);
    const plan = results.map(row => row['QUERY PLAN']).join('\n');

    expect(plan).toMatch(/Index Scan|Bitmap Index Scan|idx_quiz_attempts_user_exam/i);
  });

  it('should utilize idx_progress_user_subject for fetching user topic progress', async () => {
    const query = `
      EXPLAIN SELECT * FROM "Progress" 
      WHERE "userId" = '00000000-0000-0000-0000-000000000000' 
        AND "subjectId" = '00000000-0000-0000-0000-000000000000';
    `;
    const [results] = await sequelize.query(query);
    const plan = results.map(row => row['QUERY PLAN']).join('\n');

    expect(plan).toMatch(/Index Scan|Bitmap Index Scan|idx_progress_user_subject/i);
  });

  it('should utilize idx_activity_logs_user_date for fetching activity streaks', async () => {
    const query = `
      EXPLAIN SELECT * FROM "ActivityLogs" 
      WHERE "userId" = '00000000-0000-0000-0000-000000000000' 
      ORDER BY "createdAt" DESC;
    `;
    const [results] = await sequelize.query(query);
    const plan = results.map(row => row['QUERY PLAN']).join('\n');

    expect(plan).toMatch(/Index Scan|Bitmap Index Scan|idx_activity_logs_user_date/i);
  });
});
