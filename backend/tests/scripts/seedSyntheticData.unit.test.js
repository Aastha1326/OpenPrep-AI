const seed = require('../../scripts/seedSyntheticData');
const { User, Exam, Subject, Topic, Quiz, QuizAttempt, ActivityLog } = require('../../models');

describe('Synthetic Data Seeder Script', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    
    // Mock bulkCreate methods
    vi.spyOn(User, 'bulkCreate').mockResolvedValue([]);
    vi.spyOn(Exam, 'bulkCreate').mockResolvedValue([]);
    vi.spyOn(Subject, 'bulkCreate').mockResolvedValue([]);
    vi.spyOn(Topic, 'bulkCreate').mockResolvedValue([]);
    vi.spyOn(Quiz, 'bulkCreate').mockResolvedValue([]);
    vi.spyOn(QuizAttempt, 'bulkCreate').mockResolvedValue([]);
    vi.spyOn(ActivityLog, 'bulkCreate').mockResolvedValue([]);
    
    // Stub process.exit to prevent test runner from exiting
    vi.spyOn(process, 'exit').mockImplementation(() => {});
  });

  it('should run seeding pipeline and call bulkCreate on all models', async () => {
    await seed();

    expect(User.bulkCreate).toHaveBeenCalled();
    expect(Exam.bulkCreate).toHaveBeenCalled();
    expect(Subject.bulkCreate).toHaveBeenCalled();
    expect(Topic.bulkCreate).toHaveBeenCalled();
    expect(Quiz.bulkCreate).toHaveBeenCalled();
    expect(QuizAttempt.bulkCreate).toHaveBeenCalled();
    expect(ActivityLog.bulkCreate).toHaveBeenCalled();
    expect(process.exit).toHaveBeenCalledWith(0);
  });
});
