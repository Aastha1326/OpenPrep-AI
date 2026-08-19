import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { transformWithOxc } from 'vite';

/**
 * Guard against the class of breakage described in issue #1104: merge conflicts
 * that were "resolved" by deleting the markers while keeping both halves of the
 * hunk. That leaves files which look plausible in review but do not parse, and
 * the production build is the only thing that notices.
 *
 * These checks run against every shipped source file so the failure shows up in
 * a fast unit run instead of at deploy time.
 */

// Vitest runs with the frontend workspace as its working directory.
const SRC_DIR = join(process.cwd(), 'src');
const SOURCE_EXTENSIONS = new Set(['.js', '.jsx']);
const IGNORED_DIRECTORIES = new Set(['node_modules', '__snapshots__', 'assets']);

function collectSourceFiles(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRECTORIES.has(entry)) continue;

    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      collectSourceFiles(fullPath, found);
    } else if (SOURCE_EXTENSIONS.has(extname(entry))) {
      found.push(fullPath);
    }
  }
  return found;
}

const sourceFiles = collectSourceFiles(SRC_DIR);
const asRepoPath = (file) => `src/${relative(SRC_DIR, file)}`;

/** Top-level `const X =`, `let X =`, `function X`, `class X`. */
function topLevelDeclarations(code) {
  const names = [];
  const pattern = /^(?:export\s+(?:default\s+)?)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let match;
  while ((match = pattern.exec(code)) !== null) {
    names.push(match[1]);
  }
  return names;
}

/** Module specifiers of every static `import ... from '<spec>'` in the file. */
function importedSpecifiers(code) {
  const specs = [];
  const pattern = /^\s*}?\s*from\s+['"]([^'"]+)['"]/gm;
  let match;
  while ((match = pattern.exec(code)) !== null) {
    specs.push(match[1]);
  }
  return specs;
}

function duplicatesIn(values) {
  const seen = new Set();
  const repeated = new Set();
  for (const value of values) {
    if (seen.has(value)) repeated.add(value);
    seen.add(value);
  }
  return [...repeated];
}

describe('frontend source integrity', () => {
  it('finds the source tree', () => {
    expect(sourceFiles.length).toBeGreaterThan(50);
  });

  it('has no leftover merge conflict markers', () => {
    const offenders = sourceFiles.filter((file) =>
      /^(?:<{7}|={7}|>{7})(?:\s|$)/m.test(readFileSync(file, 'utf8'))
    );

    expect(offenders.map(asRepoPath)).toEqual([]);
  });

  it('never imports the same module twice in one file', () => {
    const offenders = [];

    for (const file of sourceFiles) {
      const repeated = duplicatesIn(importedSpecifiers(readFileSync(file, 'utf8')));
      if (repeated.length > 0) {
        offenders.push(`${asRepoPath(file)} imports ${repeated.join(', ')} more than once`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never declares the same top-level binding twice in one file', () => {
    const offenders = [];

    for (const file of sourceFiles) {
      const repeated = duplicatesIn(topLevelDeclarations(readFileSync(file, 'utf8')));
      if (repeated.length > 0) {
        offenders.push(`${asRepoPath(file)} declares ${repeated.join(', ')} more than once`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('parses every source file', async () => {
    const failures = [];

    await Promise.all(
      sourceFiles.map(async (file) => {
        try {
          await transformWithOxc(readFileSync(file, 'utf8'), file);
        } catch (error) {
          failures.push(`${asRepoPath(file)}: ${String(error.message).split('\n')[0]}`);
        }
      })
    );

    expect(failures).toEqual([]);
  });
});
