const { spawn } = require('child_process');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const getDbUrl = () =>
  process.env.DATABASE_URL ||
  'postgresql://postgres:NISHIT382424@db.eymuyrdtbinvexvaynxw.supabase.co:5432/postgres';

const obfuscateUrl = (url) => url.replace(/:([^:@]+)@/, ':****@');

function pruneOldBackups(dir, maxAgeDays = 14) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir);
  const now = Date.now();
  const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  const prunedFiles = [];

  files.forEach((file) => {
    if (file.endsWith('.sql.gz')) {
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

async function uploadToS3(filePath, fileName) {
  if (!process.env.AWS_S3_BUCKET) {
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

function runBackup(options = {}) {
  return new Promise((resolve, reject) => {
    const dbUrl = options.dbUrl || getDbUrl();
    const backupsDir = options.backupsDir || path.join(__dirname, '../backups');

    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const timestamp = options.timestamp || new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup-${timestamp}.sql.gz`;
    const backupFilePath = path.join(backupsDir, backupFileName);

    console.log('Starting automated PostgreSQL database backup...');
    console.log(`Database target URL: ${obfuscateUrl(dbUrl)}`);
    console.log(`Destination path: ${backupFilePath}`);

    const pgDump = spawn('pg_dump', ['--clean', '--if-exists', '--no-owner', `--dbname=${dbUrl}`]);
    const gzip = zlib.createGzip();
    const writeStream = fs.createWriteStream(backupFilePath);

    pgDump.stdout.pipe(gzip).pipe(writeStream);

    let stderrOutput = '';
    pgDump.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    pgDump.on('error', (err) => {
      if (fs.existsSync(backupFilePath)) {
        fs.unlinkSync(backupFilePath);
      }
      if (err.code === 'ENOENT') {
        const errorMsg =
          '❌ ERROR: pg_dump utility not found on this system.\n' +
          'Please install PostgreSQL client tools (pg_dump) to enable backups.\n' +
          'Linux (Ubuntu/Debian): sudo apt-get install postgresql-client\n' +
          'macOS: brew install libpq && brew link --force libpq\n' +
          'Windows: Install PostgreSQL and add the bin directory to your System PATH.';
        console.error(`\n${errorMsg}`);
        reject(new Error(errorMsg));
      } else {
        console.error(`\n❌ pg_dump process error: ${err.message}`);
        reject(err);
      }
    });

    pgDump.on('close', async (code) => {
      if (code !== 0) {
        if (fs.existsSync(backupFilePath)) {
          fs.unlinkSync(backupFilePath);
        }
        const errorMsg = `pg_dump process exited with code ${code}. ${stderrOutput}`;
        console.error(`\n❌ ${errorMsg}`);
        return reject(new Error(errorMsg));
      }

      const stats = fs.statSync(backupFilePath);
      const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
      console.log(`\n✅ Database backup completed successfully!`);
      console.log(`File created: ${backupFileName} (${sizeMb} MB)`);

      // Upload to S3 if configured
      await uploadToS3(backupFilePath, backupFileName);

      // Prune old backups
      try {
        pruneOldBackups(backupsDir, options.maxAgeDays || 14);
      } catch (pruneErr) {
        console.error('❌ Failed to prune old backups:', pruneErr.message);
      }

      resolve({
        fileName: backupFileName,
        filePath: backupFilePath,
        sizeBytes: stats.size,
      });
    });
  });
}

if (require.main === module) {
  runBackup()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  runBackup,
  pruneOldBackups,
  uploadToS3,
  obfuscateUrl,
};

