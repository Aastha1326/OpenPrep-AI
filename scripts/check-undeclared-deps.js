#!/usr/bin/env node
'use strict';

/**
 * Reports any package that shipped source code imports but no manifest
 * declares.
 *
 * Nine of these had accumulated by the time issue #1106 was filed, including
 * `yjs` — which server.js pulls in unconditionally at boot through
 * sockets/crdtHandler.js, so a clean `npm ci` produced a backend that exited
 * before binding a port.
 *
 * They survive locally because a contributor's node_modules still holds the
 * package, hoisted from some earlier branch. Only a clean install notices, and
 * the CI job that does clean installs had not been able to run.
 */

const fs = require('fs');
const path = require('path');
const { builtinModules } = require('module');

const REPO_ROOT = path.resolve(__dirname, '..');
const BUILTINS = new Set(builtinModules);

/**
 * Each workspace names the directories whose imports its manifest is expected
 * to cover. Tests are excluded: they legitimately reach for devDependencies
 * and fixtures that never ship.
 */
const WORKSPACES = [
  {
    name: 'backend',
    manifest: 'backend/package.json',
    roots: [
      'backend/config',
      'backend/controllers',
      'backend/jobs',
      'backend/middleware',
      'backend/models',
      'backend/routes',
      'backend/scripts',
      'backend/services',
      'backend/sockets',
      'backend/utils',
      'backend/server.js',
    ],
  },
  {
    name: 'frontend',
    manifest: 'frontend/package.json',
    roots: ['frontend/src'],
  },
];

const SOURCE_EXTENSIONS = new Set(['.js', '.jsx', '.mjs', '.cjs']);
const SKIPPED_DIRECTORIES = new Set(['node_modules', 'dist', 'build', 'coverage']);

/** Test files declare their own doubles; they are not part of the shipped surface. */
const isTestFile = (file) =>
  /\.(test|spec)\.[jt]sx?$/.test(file) || /(^|[\\/])tests?[\\/]/.test(file);

function walk(target, found = []) {
  if (!fs.existsSync(target)) return found;

  if (fs.statSync(target).isFile()) {
    if (SOURCE_EXTENSIONS.has(path.extname(target)) && !isTestFile(target)) found.push(target);
    return found;
  }

  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIPPED_DIRECTORIES.has(entry.name)) continue;
      walk(path.join(target, entry.name), found);
      continue;
    }

    const file = path.join(target, entry.name);
    if (SOURCE_EXTENSIONS.has(path.extname(entry.name)) && !isTestFile(file)) found.push(file);
  }

  return found;
}

/**
 * Strips comments and template literals before matching, so a `require(...)`
 * mentioned in prose or inside a backtick string is not mistaken for a real
 * import. Without this, sentences like "dropped and came back" — which sit
 * inside a template literal next to the word `from` — get reported as packages.
 */
function stripNonCode(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/`(?:\\.|[^`\\])*`/g, '``');
}

/**
 * Resolves a module specifier to the package name a manifest would declare:
 * `@scope/pkg/sub` -> `@scope/pkg`, `pkg/sub` -> `pkg`.
 *
 * @returns {string|null} null for relative paths, builtins and bundler-virtual ids.
 */
function toPackageName(specifier) {
  if (!specifier) return null;
  if (specifier.startsWith('.') || specifier.startsWith('/')) return null;
  if (specifier.startsWith('node:') || specifier.startsWith('virtual:')) return null;
  if (specifier.startsWith('\0') || specifier.includes('?')) return null;

  const segments = specifier.split('/');
  const name = specifier.startsWith('@') ? segments.slice(0, 2).join('/') : segments[0];

  return BUILTINS.has(name) ? null : name;
}

function importedPackages(source) {
  const code = stripNonCode(source);
  const found = new Set();

  const patterns = [
    /\brequire\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bfrom\s+['"]([^'"]+)['"]/g,
    /\bimport\s+['"]([^'"]+)['"]/g,
    /\bimport\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(code)) !== null) {
      const name = toPackageName(match[1]);
      if (name) found.add(name);
    }
  }

  return found;
}

function declaredPackages(manifestPath) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  return new Set([
    ...Object.keys(manifest.dependencies || {}),
    ...Object.keys(manifest.devDependencies || {}),
    ...Object.keys(manifest.peerDependencies || {}),
    ...Object.keys(manifest.optionalDependencies || {}),
  ]);
}

/**
 * @param {object[]} [workspaces]
 * @param {string} [root]
 * @returns {{ workspace: string, package: string, files: string[] }[]} sorted by package name.
 */
function findUndeclared(workspaces = WORKSPACES, root = REPO_ROOT) {
  const undeclared = [];

  for (const workspace of workspaces) {
    const declared = declaredPackages(path.join(root, workspace.manifest));
    const byPackage = new Map();

    for (const dir of workspace.roots) {
      for (const file of walk(path.join(root, dir))) {
        for (const name of importedPackages(fs.readFileSync(file, 'utf8'))) {
          if (declared.has(name)) continue;
          if (!byPackage.has(name)) byPackage.set(name, []);
          byPackage.get(name).push(path.relative(root, file));
        }
      }
    }

    for (const [name, files] of [...byPackage].sort(([a], [b]) => a.localeCompare(b))) {
      undeclared.push({ workspace: workspace.name, package: name, files });
    }
  }

  return undeclared;
}

function main() {
  const undeclared = findUndeclared();

  if (undeclared.length === 0) {
    console.log('check-undeclared-deps: every imported package is declared');
    return 0;
  }

  console.error(`check-undeclared-deps: ${undeclared.length} undeclared package(s)\n`);
  for (const entry of undeclared) {
    console.error(`  [${entry.workspace}] ${entry.package}`);
    for (const file of entry.files.slice(0, 5)) console.error(`      ${file}`);
    if (entry.files.length > 5) console.error(`      ...and ${entry.files.length - 5} more`);
    console.error('');
  }
  console.error('Declare each package in the manifest of the workspace that imports it.');

  return 1;
}

if (require.main === module) {
  process.exit(main());
}

module.exports = { findUndeclared, importedPackages, toPackageName, stripNonCode, WORKSPACES };
