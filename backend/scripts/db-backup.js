const { spawn } = require('child_process');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:NISHIT382424@db.eymuyrdtbinvexvaynxw.supabase.co:5432/postgres';
const backupsDir = path.join(__dirname, '../backups');

// Ensure backups directory exists
if (!fs.existsSync(backupsDir)) {
  fs.mkdirSync(backupsDir, { recursive: true });
}

// Generate timestamped filename
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFileName = `backup-${timestamp}.sql.gz`;
const backupFilePath = path.join(backupsDir, backupFileName);

console.log('Starting automated PostgreSQL database backup...');
console.log(`Database target URL: ${dbUrl.replace(/:([^:@]+)@/, ':****@')}`); // obfuscate password
console.log(`Destination path: ${backupFilePath}`);

// Spawn pg_dump with --clean --if-exists to make restores seamless
const pgDump = spawn('pg_dump', ['--clean', '--if-exists', `--dbname=${dbUrl}`]);
const gzip = zlib.createGzip();
const writeStream = fs.createWriteStream(backupFilePath);

pgDump.stdout.pipe(gzip).pipe(writeStream);

let stderrOutput = '';
pgDump.stderr.on('data', (data) => {
  stderrOutput += data.toString();
});

pgDump.on('error', (err) => {
  if (err.code === 'ENOENT') {
    console.error('\n❌ ERROR: pg_dump utility not found on this system.');
    console.error('Please install PostgreSQL client tools to enable backups.');
    console.error('Linux (Ubuntu/Debian): sudo apt-get install postgresql-client');
    console.error('macOS: brew install libpq && brew link --force libpq');
    console.error('Windows: Install PostgreSQL and add the bin directory to your System PATH.');
  } else {
    console.error(`\n❌ pg_dump process error: ${err.message}`);
  }

  // Cleanup partial file
  if (fs.existsSync(backupFilePath)) {
    fs.unlinkSync(backupFilePath);
  }
  process.exit(1);
});

pgDump.on('close', async (code) => {
  if (code !== 0) {
    console.error(`\n❌ pg_dump process exited with code ${code}`);
    if (stderrOutput) {
      console.error(`stderr: ${stderrOutput}`);
    }
    if (fs.existsSync(backupFilePath)) {
      fs.unlinkSync(backupFilePath);
    }
    process.exit(1);
  }

  const stats = fs.statSync(backupFilePath);
  const sizeMb = (stats.size / (1024 * 1024)).toFixed(2);
  console.log(`\n✅ Database backup completed successfully!`);
  console.log(`File created: ${backupFileName} (${sizeMb} MB)`);

  // Optional S3 Upload
  if (process.env.AWS_S3_BUCKET) {
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

      await s3.send(new PutObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET,
        Key: `backups/${backupFileName}`,
        Body: fs.createReadStream(backupFilePath),
      }));
      console.log('✅ Successfully uploaded backup archive to S3!');
    } catch (s3Err) {
      if (s3Err.code === 'MODULE_NOT_FOUND') {
        console.warn('⚠️ S3 upload skipped: @aws-sdk/client-s3 is not installed.');
        console.warn('Run "npm install @aws-sdk/client-s3" to enable S3 backups.');
      } else {
        console.error('❌ S3 upload failed:', s3Err.message);
      }
    }
  }

  // Prune backups older than 14 days
  try {
    pruneOldBackups(backupsDir);
  } catch (pruneErr) {
    console.error('❌ Failed to prune old backups:', pruneErr.message);
  }
});

function pruneOldBackups(dir) {
  const files = fs.readdirSync(dir);
  const now = Date.now();
  const fourteenDaysMs = 14 * 24 * 60 * 60 * 1000;

  files.forEach((file) => {
    if (file.endsWith('.sql.gz')) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      const ageMs = now - stat.mtimeMs;
      if (ageMs > fourteenDaysMs) {
        fs.unlinkSync(filePath);
        console.log(`Pruned old backup file: ${file}`);
      }
    }
  });
}
