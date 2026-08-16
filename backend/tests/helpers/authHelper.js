const jwt = require('jsonwebtoken');

/**
 * Helper to generate a valid JWT for authentication in integration tests.
 * @param {string} userId - The UUID of the user.
 * @returns {string} The signed JWT access token.
 */
function generateTestToken(userId) {
  const secret = process.env.JWT_SECRET || 'test_secret_key_for_jest_integration_tests';
  return jwt.sign(
    { id: userId, type: 'access' },
    secret,
    { expiresIn: '1h' }
  );
}

module.exports = {
  generateTestToken,
};
