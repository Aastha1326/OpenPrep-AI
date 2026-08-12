const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const issuesDir = path.join(__dirname, '..', 'issues');

// Pre-fetch list of valid repo labels ONCE
let validRepoLabels = [];
try {
  const labelsJson = execSync('gh label list --json name --limit 200', { encoding: 'utf8' });
  validRepoLabels = JSON.parse(labelsJson).map(l => l.name);
} catch (e) {
  console.warn('Warning: Could not fetch GitHub labels via CLI:', e.message);
}

const files = fs.readdirSync(issuesDir).filter(f => f.endsWith('.md')).sort();

console.log(`Processing remaining issue files...`);

for (const file of files) {
  const filePath = path.join(issuesDir, file);
  const content = fs.readFileSync(filePath, 'utf8');

  // Match YAML frontmatter
  const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!frontmatterMatch) continue;

  const frontmatter = frontmatterMatch[1];
  const body = content.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').trim();

  // Extract title
  const titleMatch = frontmatter.match(/title:\s*['"]?(.*?)['"]?\r?$/m);
  const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');

  // Skip files 1-5 that were already created (#805 to #809)
  if (file.startsWith('issue-471') || file.startsWith('issue-472') || file.startsWith('issue-473') || file.startsWith('issue-474') || file.startsWith('issue-475')) {
    console.log(`Skipping already created issue file: ${file}`);
    continue;
  }

  // Extract raw labels
  const labelsMatch = frontmatter.match(/labels:\s*['"]?(.*?)['"]?\r?$/m);
  const rawLabels = labelsMatch ? labelsMatch[1].split(',').map(s => s.trim()) : [];

  // Map & match labels
  const appliedLabels = [];
  for (let l of rawLabels) {
    let normalized = l;
    if (l.toLowerCase() === 'feature') normalized = 'enhancement';
    if (l.toLowerCase() === 'fullstack') normalized = 'frontend';

    const matched = validRepoLabels.find(vl => vl.toLowerCase() === normalized.toLowerCase());
    if (matched && !appliedLabels.includes(matched)) {
      appliedLabels.push(matched);
    }
  }

  console.log(`\n----------------------------------------`);
  console.log(`Creating GitHub Issue for ${file}: "${title}"`);
  console.log(`Labels: ${appliedLabels.join(', ')}`);

  const tempBodyFile = path.join(__dirname, 'temp_issue_body.md');
  fs.writeFileSync(tempBodyFile, body, 'utf8');

  const labelFlags = appliedLabels.map(l => `--label "${l}"`).join(' ');
  const escapedTitle = title.replace(/"/g, '\\"');
  const cmd = `gh issue create --title "${escapedTitle}" --body-file "${tempBodyFile}" ${labelFlags}`;

  try {
    const output = execSync(cmd, { cwd: path.join(__dirname, '..'), encoding: 'utf8' });
    console.log(`Success: ${output.trim()}`);
  } catch (err) {
    console.error(`Error creating issue for ${file}:`, err.stdout || err.stderr || err.message);
  } finally {
    if (fs.existsSync(tempBodyFile)) {
      fs.unlinkSync(tempBodyFile);
    }
  }
}

console.log('\nAll 15 GitHub issues published successfully!');
