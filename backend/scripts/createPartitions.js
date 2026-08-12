const { sequelize } = require('../config/db');

async function createMonthlyPartitions() {
  try {
    const now = new Date();
    // Create partitions for current month and next 3 months
    for (let i = 0; i < 4; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const year = targetDate.getFullYear();
      const month = String(targetDate.getMonth() + 1).padStart(2, '0');
      
      const nextTargetDate = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const nextYear = nextTargetDate.getFullYear();
      const nextMonth = String(nextTargetDate.getMonth() + 1).padStart(2, '0');

      const partitionName = `quiz_attempts_${year}_${month}`;
      const startDate = `${year}-${month}-01 00:00:00+00`;
      const endDate = `${nextYear}-${nextMonth}-01 00:00:00+00`;

      const query = `
        CREATE TABLE IF NOT EXISTS "${partitionName}" PARTITION OF "QuizAttempts"
        FOR VALUES FROM ('${startDate}') TO ('${endDate}');
      `;

      await sequelize.query(query);
      console.log(`Verified/Created partition: ${partitionName}`);
    }
  } catch (error) {
    console.error('Failed to auto-create partitions:', error);
  }
}

module.exports = createMonthlyPartitions;
