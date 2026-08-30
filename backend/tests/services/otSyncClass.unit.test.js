const assert = require('assert');
const otSyncService = require('../../services/otSyncService');

async function testOTSyncClass() {
  console.log('Testing OTSyncService class methods...');

  // Test 1: getHistory initialization and retrieval
  const history = otSyncService.getHistory('note-test-1');
  assert.ok(Array.isArray(history), 'History should be an array');
  assert.strictEqual(history.length, 0, 'Initial history length should be 0');

  // Test 2: Character-level Insert transform
  const opA = { type: 'insert', position: 5, text: 'World', userId: 'user-1' };
  const opB = { type: 'insert', position: 0, text: 'Hello ', userId: 'user-2' };

  const transformedA = otSyncService.transform(opA, opB);
  assert.strictEqual(transformedA.position, 11, 'Position should shift right by length of opB text');
  assert.strictEqual(transformedA.text, 'World');

  // Test 3: applyOperation adds to history log & increments version
  const op1 = { type: 'insert', position: 0, text: 'Initial', userId: 'user-1' };
  const result1 = otSyncService.applyOperation('note-test-1', op1, 0);

  assert.strictEqual(result1.newVersion, 1, 'New version should be 1');
  assert.strictEqual(result1.transformedOp.text, 'Initial');

  const currentHistory = otSyncService.getHistory('note-test-1');
  assert.strictEqual(currentHistory.length, 1);
  assert.strictEqual(currentHistory[0].userId, 'user-1');

  console.log('✅ OTSyncService class tests passed successfully!');
}

if (require.main === module) {
  testOTSyncClass().catch((err) => {
    console.error('❌ OTSyncService class tests failed:', err);
    process.exit(1);
  });
}

module.exports = testOTSyncClass;
