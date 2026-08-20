const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('Checking for k6 installation...');
const k6Check = spawnSync('k6', ['version'], { encoding: 'utf8' });

if (k6Check.error || k6Check.status !== 0) {
  console.error('\n❌ Error: k6 is not installed or not in PATH.');
  console.error('Please install k6 to run load tests: https://k6.io/docs/getting-started/installation/');
  process.exit(1);
}

console.log(`k6 found: ${k6Check.stdout.trim()}`);

const reportsDir = path.join(__dirname, '..', 'tests', 'load', 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

console.log('\n🚀 Starting k6 load test suite...');

const k6Process = spawnSync('k6', ['run', 'tests/load/main.js'], { 
  stdio: 'inherit',
  env: { ...process.env } // Pass all environment variables through
});

if (k6Process.status !== 0) {
  console.error('\n❌ Load tests failed or thresholds were crossed.');
  process.exit(k6Process.status || 1);
} else {
  console.log('\n✅ Load tests passed successfully.');
}
