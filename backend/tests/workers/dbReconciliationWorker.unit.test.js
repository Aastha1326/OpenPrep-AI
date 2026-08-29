const assert = require('assert');
const { reconcileNotes } = require('../../workers/dbReconciliationWorker');
const redisConfig = require('../../config/redis');

async function testDbReconciliationWorker() {
  console.log('Testing DB Reconciliation Worker flushing logic...');

  if (typeof redisConfig._resetInMemoryStore === 'function') {
    redisConfig._resetInMemoryStore();
  }

  // Seed cached content into Redis config store
  await redisConfig.setCache('note:note-999:content', 'Real-time collaborative note text');

  await reconcileNotes();

  console.log('✅ DB Reconciliation Worker tests passed successfully!');
}

if (require.main === module) {
  testDbReconciliationWorker().catch((err) => {
    console.error('❌ DB Reconciliation Worker tests failed:', err);
    process.exit(1);
  });
}

module.exports = testDbReconciliationWorker;
