const { spawn } = require('child_process');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');
const { pipeline } = require('stream/promises');

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

function parseFileName(args = process.argv.slice(2)) {
  let fileArg = args.find((arg) => arg.startsWith('--file='));
  if (fileArg) return fileArg.split('=')[1];

  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    return args[fileIndex + 1];
  }

  // Fallback: check first non-flag argument ending in .sql or .sql.gz
  const positional = args.find((arg) => !arg.startsWith('-') && (arg.endsWith('.sql.gz') || arg.endsWith('.sql')));
  if (positional) return positional;

  return null;
}

async function downloadFromS3(fileName, destinationPath) {
  if (!process.env.AWS_S3_BUCKET) return false;

  console.log(`Checking S3 bucket '${process.env.AWS_S3_BUCKET}' for backup '${fileName}'...`);
  try {
    const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
    const s3 = new S3Client({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: `backups/${fileName}`,
    });

    const response = await s3.send(command);
    const writeStream = fs.createWriteStream(destinationPath);
    await pipeline(response.Body, writeStream);
    console.log(`✅ Successfully downloaded backup file from S3: ${fileName}`);
    return true;
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.warn('⚠️ S3 download skipped: @aws-sdk/client-s3 is not installed.');
    } else {
      console.warn(`⚠️ Could not fetch file from S3: ${err.message}`);
    }
    return false;
  }
}

async function runRestore(options = {}) {
  const dbUrl = options.dbUrl || getDbUrl();
  const backupsDir = options.backupsDir || path.join(__dirname, '../backups');
  const fileName = options.file || parseFileName(options.args);

  if (!fileName) {
    const usage =
      '❌ ERROR: No backup file specified for restoration.\n' +
      'Usage: npm run db:restore -- --file=<filename>\n' +
      'Example: npm run db:restore -- --file=backup-2026-08-12.sql.gz';
    console.error(`\n${usage}`);
    throw new Error(usage);
  }

  // Resolve the file path (check backups/ first, then direct path)
  let backupFilePath = path.join(backupsDir, fileName);
  if (!fs.existsSync(backupFilePath)) {
    backupFilePath = path.resolve(fileName);
  }

  // If local file doesn't exist, try downloading from S3
  if (!fs.existsSync(backupFilePath)) {
    const localS3Path = path.join(backupsDir, path.basename(fileName));
    const downloaded = await downloadFromS3(path.basename(fileName), localS3Path);
    if (downloaded) {
      backupFilePath = localS3Path;
    }
  }

  if (!fs.existsSync(backupFilePath)) {
    const errorMsg =
      `❌ ERROR: Backup file not found at:\n` +
      `1. ${path.join(backupsDir, fileName)}\n` +
      `2. ${path.resolve(fileName)}`;
    console.error(`\n${errorMsg}`);
    throw new Error(errorMsg);
  }

  return new Promise((resolve, reject) => {
    console.log('Starting PostgreSQL database restoration...');
    console.log(`Database target URL: ${obfuscateUrl(dbUrl)}`);
    console.log(`Restoring from: ${backupFilePath}`);

    const psql = spawn('psql', [`--dbname=${dbUrl}`]);
    const gunzip = zlib.createGunzip();
    const readStream = fs.createReadStream(backupFilePath);

    readStream.pipe(gunzip).pipe(psql.stdin);

    let stderrOutput = '';
    psql.stderr.on('data', (data) => {
      stderrOutput += data.toString();
    });

    psql.on('error', (err) => {
      if (err.code === 'ENOENT') {
        const errorMsg =
          '❌ ERROR: psql utility not found on this system.\n' +
          'Please install PostgreSQL client tools (psql) to enable database restores.\n' +
          'Linux (Ubuntu/Debian): sudo apt-get install postgresql-client\n' +
          'macOS: brew install libpq && brew link --force libpq\n' +
          'Windows: Install PostgreSQL and add the bin directory to your System PATH.';
        console.error(`\n${errorMsg}`);
        reject(new Error(errorMsg));
      } else {
        console.error(`\n❌ psql process error: ${err.message}`);
        reject(err);
      }
    });

    psql.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = `psql process exited with code ${code}. ${stderrOutput}`;
        console.error(`\n❌ ${errorMsg}`);
        return reject(new Error(errorMsg));
      }

      console.log('\n✅ Database restoration completed successfully!');
      resolve({ filePath: backupFilePath, fileName });
    });
  });
}

if (require.main === module) {
  runRestore()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = {
  runRestore,
  parseFileName,
  downloadFromS3,
};

