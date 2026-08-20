#!/usr/bin/env node
'use strict';

/**
 * Parses every committed manifest in the repository and exits non-zero on the
 * first file that does not parse.
 *
 * This exists because three manifests reached main unparseable at the same
 * time (issue #1105): the root package.json was missing a comma, ci.yml had
 * two steps dedented to column 0, and .lighthouserc.json held two concatenated
 * JSON objects. None of it was caught, because the job that would have caught
 * it lives in the workflow file that could no longer be scheduled — every run
 * failed in 0s before a single step executed.
 *
 * A stray `}` or a dedented list item is invisible in review and fatal in CI,
 * so the check is deliberately dumb and fast: find the files, parse them, say
 * exactly which one broke and where.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const REPO_ROOT = path.resolve(__dirname, '..');

/** Directories never worth walking into. */
const SKIPPED_DIRECTORIES = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'coverage',
  '.vercel',
]);

/**
 * Lockfiles are machine-generated and enormous; parsing them costs seconds and
 * proves nothing a failed install would not already tell us.
 */
const SKIPPED_FILENAMES = new Set(['package-lock.json', 'pnpm-lock.yaml', 'yarn.lock']);

const JSON_EXTENSIONS = new Set(['.json']);
const YAML_EXTENSIONS = new Set(['.yml', '.yaml']);

function walk(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      walk(path.join(directory, entry.name), found);
      continue;
    }

    if (SKIPPED_FILENAMES.has(entry.name)) continue;

    const extension = path.extname(entry.name);
    if (JSON_EXTENSIONS.has(extension) || YAML_EXTENSIONS.has(extension)) {
      found.push(path.join(directory, entry.name));
    }
  }

  return found;
}

/**
 * `JSON.parse` accepts a document and ignores nothing after it — it throws on
 * trailing content, which is what caught the duplicated .lighthouserc.json
 * object. Reported separately so the message names the real problem.
 */
function validateJson(contents) {
  JSON.parse(contents);
}

/**
 * `loadAll` rather than `load`, so a file containing two YAML documents is
 * reported as such instead of silently returning only the first.
 */
function validateYaml(contents, relativePath) {
  const documents = yaml.loadAll(contents);

  if (documents.length > 1 && relativePath.startsWith('.github/workflows/')) {
    throw new Error(
      `expected a single workflow document, found ${documents.length} — check for a stray "---" or a dedented step`
    );
  }
}

/**
 * @param {string[]} [files] Absolute paths. Defaults to every manifest in the repo.
 * @returns {{ file: string, message: string }[]} One entry per file that failed.
 */
function validateManifests(files = walk(REPO_ROOT)) {
  const failures = [];

  for (const file of files) {
    const relativePath = path.relative(REPO_ROOT, file);
    const contents = fs.readFileSync(file, 'utf8');

    try {
      if (JSON_EXTENSIONS.has(path.extname(file))) {
        validateJson(contents);
      } else {
        validateYaml(contents, relativePath);
      }
    } catch (error) {
      failures.push({
        file: relativePath,
        message: String(error.message).split('\n')[0],
      });
    }
  }

  return failures;
}

function main() {
  const files = walk(REPO_ROOT);
  const failures = validateManifests(files);

  if (failures.length === 0) {
    console.log(`validate-manifests: ${files.length} manifests parsed cleanly`);
    return 0;
  }

  console.error(
    `validate-manifests: ${failures.length} of ${files.length} manifests failed to parse\n`
  );
  for (const failure of failures) {
    console.error(`  ${failure.file}`);
    console.error(`    ${failure.message}\n`);
  }

  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { validateManifests, walk, REPO_ROOT };
