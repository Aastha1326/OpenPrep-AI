const assert = require('assert');
const User = require('../../models/User');

async function testUserElo() {
  console.log('Testing User ELO Rating & adjustRatings method...');

  // Test 1: ELO attribute default value
  const user = User.build({ name: 'Test Student', email: 'test@example.com' });
  assert.strictEqual(user.eloRating, 1200, 'Default ELO rating should be 1200');

  // Test 2: adjustRatings static function calculation & updates
  const mockWinner = { id: 'w1', eloRating: 1200, update: async (data) => Object.assign(mockWinner, data) };
  const mockLoser = { id: 'l1', eloRating: 1200, update: async (data) => Object.assign(mockLoser, data) };

  User.findByPk = async (id) => (id === 'w1' ? mockWinner : id === 'l1' ? mockLoser : null);

  const { newWinnerElo, newLoserElo } = await User.adjustRatings('w1', 'l1');
  assert.strictEqual(typeof newWinnerElo, 'number');
  assert.strictEqual(typeof newLoserElo, 'number');

  assert.strictEqual(newWinnerElo, 1216, 'Winner with equal ELO should gain 16 ELO points (kFactor 32)');
  assert.strictEqual(newLoserElo, 1184, 'Loser with equal ELO should lose 16 ELO points (kFactor 32)');
  assert.strictEqual(mockWinner.eloRating, 1216);
  assert.strictEqual(mockLoser.eloRating, 1184);

  // Test 3: Static method fallback
  assert.strictEqual(typeof User.statics.adjustRatings, 'function', 'User.statics.adjustRatings should be defined');

  console.log('✅ User ELO tests passed successfully!');
}

if (require.main === module) {
  testUserElo().catch((err) => {
    console.error('❌ User ELO tests failed:', err);
    process.exit(1);
  });
}

module.exports = testUserElo;
