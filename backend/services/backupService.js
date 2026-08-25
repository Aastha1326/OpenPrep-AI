const { spawn } = require('child_process');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Load environment variables from backend .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const getDbUrl = () => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is required');
  }
  return url;
};

const obfuscateUrl = (url) => url.replace(/:([^:@]+)@/, ':****@');

// Encrypt file using AES-256-CBC
function encryptFile(inputPath, outputPath, key) {
  return new Promise((resolve, reject) => {
    const iv = crypto.randomBytes(16);
    const secret = crypto.createHash('sha256').update(key).digest();
    const cipher = crypto.createCipheriv('aes-256-cbc', secret, iv);

    const input = fs.createReadStream(inputPath);
    const output = fs.createWriteStream(outputPath);

    output.write(iv);

    input.pipe(cipher).pipe(output);

    output.on('finish', () => resolve());
    output.on('error', (err) => reject(err));
    input.on('error', (err) => reject(err));
  });
}

// Decrypt file using AES-256-CBC
function decryptFile(inputPath, outputPath, key) {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(inputPath);
    
    input.once('readable', () => {
      const iv = input.read(16);
      if (!iv || iv.length < 16) {
        return reject(new Error('Invalid backup file: Missing IV'));
      }

      const secret = crypto.createHash('sha256').update(key).digest();
      const decipher = crypto.createDecipheriv('aes-256-cbc', secret, iv);
      const output = fs.createWriteStream(outputPath);

      input.pipe(decipher).pipe(output);

      output.on('finish', () => resolve());
      output.on('error', (err) => reject(err));
    });

    input.on('error', (err) => reject(err));
  });
}

// Upload file to S3
async function uploadToS3(filePath, fileName) {
  if (!process.env.AWS_S3_BUCKET) {
    console.warn('⚠️ S3 upload skipped: AWS_S3_BUCKET is not set.');
    return false;
  }

  console.log(`Attempting upload to S3 bucket: ${process.env.AWS_S3_BUCKET}...`);
  try {
    const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `backups/${fileName}`,
        Body: fs.createReadStream(filePath),
      })
    );
    console.log('✅ Successfully uploaded backup archive to S3!');
    return true;
  } catch (s3Err) {
    if (s3Err.code === 'MODULE_NOT_FOUND') {
      console.warn('⚠️ S3 upload skipped: @aws-sdk/client-s3 is not installed.');
    } else {
      console.error('❌ S3 upload failed:', s3Err.message);
    }
    return false;
  }
}

// Prune old backups in S3 (30-day retention)
async function pruneS3Backups(bucketName, maxAgeDays = 30) {
  try {
    const { S3Client, ListObjectsV2Command, DeleteObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
      Prefix: 'backups/',
    });

    const response = await s3.send(listCommand);
    const contents = response.Contents || [];
    const now = Date.now();
    const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;

    for (const item of contents) {
      const ageMs = now - new Date(item.LastModified).getTime();
      if (ageMs > maxAgeMs) {
        console.log(`Pruning old S3 backup object: ${item.Key}`);
        await s3.send(new DeleteObjectCommand({
          Bucket: bucketName,
          Key: item.Key,
        }));
      }
    }
  } catch (err) {
    console.error('Failed to prune old S3 backups:', err.message);
  }
}

function pruneLocalBackups(dir, maxAgeDays = 14) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const prunedFiles = [];

  files.forEach((file) => {
    if (file.endsWith('.sql.gz') || file.endsWith('.enc')) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const ageMs = now - stat.mtimeMs;
      if (ageMs > maxAgeMs) {
        fs.unlinkSync(filePath);
        prunedFiles.push(file);
        console.log(`Pruned old backup file: ${file}`);
      }
    }
  });

  return prunedFiles;
}

// Perform complete backup and encryption flow
function runBackupFlow(options = {}) {
  return new Promise((resolve, reject) => {
    const dbUrl = options.dbUrl || getDbUrl();
    const backupsDir = options.backupsDir || path.join(__dirname, '../backups');

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = options.timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    const plainFileName = `backup-${timestamp}.sql.gz`;
    const plainFilePath = path.join(backupsDir, plainFileName);
    const encFileName = `${plainFileName}.enc`;
    const encFilePath = path.join(backupsDir, encFileName);

    console.log('Starting database dump...');
    const pgDump = spawn('pg_dump', ['--clean', '--if-exists', '--no-owner', `--dbname=${dbUrl}`]);
    const gzip = zlib.createGzip();
    const writeStream = fs.createWriteStream(plainFilePath);

    pgDump.stdout.pipe(gzip).pipe(writeStream);

    let stderrOutput = '';
    pgDump.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    pgDump.on('error', (err) => {
      if (fs.existsSync(plainFilePath)) fs.unlinkSync(plainFilePath);
      reject(err);
    });

    pgDump.on('close', async (code) => {
      if (code !== 0) {
        if (fs.existsSync(plainFilePath)) fs.unlinkSync(plainFilePath);
        return reject(new Error(`pg_dump process exited with code ${code}. ${stderrOutput}`));
      }

      try {
        console.log('Encrypting database dump file...');
        const encryptionKey = process.env.BACKUP_ENCRYPTION_KEY || 'default-secure-backup-key-123456';
        await encryptFile(plainFilePath, encFilePath, encryptionKey);

        // Delete plain file to ensure security
        if (fs.existsSync(plainFilePath)) {
          fs.unlinkSync(plainFilePath);
        }

        console.log(`✅ Database backup encrypted successfully: ${encFileName}`);

        // Upload to S3 if configured
        if (process.env.AWS_S3_BUCKET) {
          await uploadToS3(encFilePath, encFileName);
          await pruneS3Backups(process.env.AWS_S3_BUCKET, options.s3MaxAgeDays || 30);
        }

        // Prune local backups
        pruneLocalBackups(backupsDir, options.maxAgeDays || 14);

        resolve({
          fileName: encFileName,
          filePath: encFilePath,
          sizeBytes: fs.statSync(encFilePath).size,
        });
      } catch (err) {
        if (fs.existsSync(plainFilePath)) fs.unlinkSync(plainFilePath);
        if (fs.existsSync(encFilePath)) fs.unlinkSync(encFilePath);
        reject(err);
      }
    });
  });
}

module.exports = {
  runBackupFlow,
  encryptFile,
  decryptFile,
  uploadToS3,
  pruneS3Backups,
  pruneLocalBackups,
};
