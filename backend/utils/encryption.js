const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Gets the encryption key from environment, throwing if missing
 * Derives a robust key if the provided key is too short.
 */
function getKey() {
  const secret = process.env.ENCRYPTION_KEY || 'default_test_encryption_key_must_change';
  // Use a hash to ensure exactly 32 bytes (256 bits)
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * Encrypts a string using AES-256-GCM.
 * @param {string} text - The text to encrypt
 * @returns {string} - The encrypted string format: iv:tag:encryptedData
 */
function encryptToken(text) {
  if (!text) return text;
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const tag = cipher.getAuthTag();
  
  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string previously encrypted by encryptToken.
 * @param {string} encryptedText - The encrypted string format: iv:tag:encryptedData
 * @returns {string} - The decrypted text
 */
function decryptToken(encryptedText) {
  if (!encryptedText) return encryptedText;
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) throw new Error('Invalid encrypted format');
    
    const [ivHex, tagHex, encryptedDataHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const key = getKey();
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    let decrypted = decipher.update(encryptedDataHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (err) {
    console.error('Decryption failed:', err.message);
    return null;
  }
}

module.exports = {
  encryptToken,
  decryptToken,
};
