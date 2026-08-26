import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, extname } from 'node:path';

/**
 * frontend/package.json declares `"type": "module"` and the app is bundled by
 * Vite, so every file under src/ is an ES module.
 *
 * Three files did not get that memo and stayed CommonJS. The bundler's interop
 * papered over it in the production build, so nothing looked wrong — but the
 * dev/test transform does not apply the same interop, and
 * src/services/OfflineMode.test.js died on import with
 *
 *   ReferenceError: module is not defined
 *     at src/services/offlineStorageService.js:80
 *
 * Its five tests had never run, which is how #1810 — an offline replay path
 * that authenticated with nothing and deleted the user's queued work on the
 * 401 that guaranteed — reached main unnoticed.
 *
 * A module that cannot be imported by the test runner cannot be tested, so
 * this is a correctness gate rather than a style preference.
 */

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

/**
 * Strips block and line comments, and the contents of string and template
 * literals, so a `require(` mentioned in prose or in a message does not read
 * as a real call.
 */
function stripNonCode(code) {
  return code
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1')
    .replace(/`(?:\\.|[^`\\])*`/g, '``')
    .replace(/'(?:\\.|[^'\\\n])*'/g, "''")
    .replace(/"(?:\\.|[^"\\\n])*"/g, '""');
}

describe('frontend module format', () => {
  it('finds the source tree', () => {
    expect(sourceFiles.length).toBeGreaterThan(50);
  });

  it('never assigns module.exports or exports.x', () => {
    const offenders = sourceFiles.filter((file) =>
      /\b(?:module\.exports\s*=|exports\.[A-Za-z_$][\w$]*\s*=)/.test(
        stripNonCode(readFileSync(file, 'utf8'))
      )
    );

    expect(offenders.map(asRepoPath)).toEqual([]);
  });

  it('never calls require() for a local module', () => {
    // Node built-ins are reached through `node:` imports in the test helpers,
    // and vitest's own require is not used anywhere, so any require() left in
    // src/ is the CommonJS shape this gate exists to keep out.
    const offenders = sourceFiles.filter((file) =>
      /\brequire\s*\(/.test(stripNonCode(readFileSync(file, 'utf8')))
    );

    expect(offenders.map(asRepoPath)).toEqual([]);
  });
});
