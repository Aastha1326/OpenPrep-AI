const { spawn } = require('child_process');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Load environment variables from backend .env
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:NISHIT382424@db.eymuyrdtbinvexvaynxw.supabase.co:5432/postgres';
const backupsDir = path.join(__dirname, '../backups');

// Parse command line args
const args = process.argv.slice(2);
let fileArg = args.find(arg => arg.startsWith('--file='));
let fileName = fileArg ? fileArg.split('=')[1] : null;

if (!fileName) {
  const fileIndex = args.indexOf('--file');
  if (fileIndex !== -1 && args[fileIndex + 1]) {
    fileName = args[fileIndex + 1];
  }
}

if (!fileName) {
  console.error('\n❌ ERROR: No backup file specified for restoration.');
  console.error('Usage: npm run db:restore -- --file=<filename>');
  console.error('Example: npm run db:restore -- --file=backup-2026-08-12.sql.gz');
  process.exit(1);
}

// Resolve the file path (check backups/ first, then direct path)
let backupFilePath = path.join(backupsDir, fileName);
if (!fs.existsSync(backupFilePath)) {
  backupFilePath = path.resolve(fileName);
  if (!fs.existsSync(backupFilePath)) {
    console.error(`\n❌ ERROR: Backup file not found at:`);
    console.error(`1. ${path.join(backupsDir, fileName)}`);
    console.error(`2. ${path.resolve(fileName)}`);
    process.exit(1);
  }
}

console.log('Starting PostgreSQL database restoration...');
console.log(`Database target URL: ${dbUrl.replace(/:([^:@]+)@/, ':****@')}`); // obfuscate password
console.log(`Restoring from: ${backupFilePath}`);

// Spawn psql to execute unzipped SQL instructions
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
    console.error('\n❌ ERROR: psql utility not found on this system.');
    console.error('Please install PostgreSQL client tools (psql) to enable database restores.');
    console.error('Linux (Ubuntu/Debian): sudo apt-get install postgresql-client');
    console.error('macOS: brew install libpq && brew link --force libpq');
    console.error('Windows: Install PostgreSQL and add the bin directory to your System PATH.');
  } else {
    console.error(`\n❌ psql process error: ${err.message}`);
  }
  process.exit(1);
});

psql.on('close', (code) => {
  if (code !== 0) {
    console.error(`\n❌ psql process exited with code ${code}`);
    if (stderrOutput) {
      console.error(`stderr: ${stderrOutput}`);
    }
    process.exit(1);
  }

  console.log('\n✅ Database restoration completed successfully!');
});
