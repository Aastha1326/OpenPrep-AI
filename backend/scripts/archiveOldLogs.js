const { sequelize } = require('../config/db');
const fs = require('fs');

/**
 * S3 is opt-in here, the same way db-backup.js treats it: the SDK is heavy and
 * only needed when archives are actually shipped off-box, so it is declared as
 * an optional dependency and loaded on demand.
 *
 * Requiring it at module load meant this file threw on import whenever the
 * package was absent — which was always, because it was never declared at all.
 *
 * @returns {{ s3: object, PutObjectCommand: Function } | null} null when the SDK is unavailable.
 */
function loadS3() {
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    return {
      s3: new S3Client({ region: process.env.AWS_REGION || 'us-east-1' }),
      PutObjectCommand,
    };
  } catch (err) {
    if (err.code !== 'MODULE_NOT_FOUND') throw err;
    console.warn('⚠️ Archive upload skipped: @aws-sdk/client-s3 is not installed.');
    console.warn('Run "npm install @aws-sdk/client-s3" to enable S3 archival.');
    return null;
  }
}

async function archiveOldLogs() {
  try {
    const thresholdDate = new Date();
    thresholdDate.setMonth(thresholdDate.getMonth() - 12);

    const year = thresholdDate.getFullYear();
    const month = String(thresholdDate.getMonth() + 1).padStart(2, '0');
    const partitionName = `quiz_attempts_${year}_${month}`;

    // Check if old partition exists
    const [results] = await sequelize.query(`
      to_regclass('${partitionName}') IS NOT NULL as exists;
    `);

    console.log(`Checking archival for partition: ${partitionName}`);

    const uploader = loadS3();
    if (!uploader) return;

    // Dump partition data to temporary CSV/JSON file, upload to S3, and detach/drop partition
    // ...
  } catch (err) {
    console.error('Archival routine error:', err);
  }
}

module.exports = archiveOldLogs;
