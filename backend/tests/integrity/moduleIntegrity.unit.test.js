import { describe, it, expect } from 'vitest';

const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  BACKEND_ROOT,
  SOURCE_DIRS,
  collectSourceFiles,
  parseFile,
  findUnparseableFiles,
  findDuplicateDeclarations,
  findUnboundRouterIdentifiers,
} = require('./moduleParser');

const SOURCE_FILES = collectSourceFiles();

/** Writes a throwaway module and hands back its root and relative path. */
function withFixture(relativePath, source, assertion) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'openprep-integrity-'));
  const absolute = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, source);

  try {
    assertion(root);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

describe('backend module discovery', () => {
  it('finds modules to check', () => {
    expect(SOURCE_FILES.length).toBeGreaterThan(100);
  });

  it('covers every boot-path source directory', () => {
    for (const dir of SOURCE_DIRS) {
      const covered = SOURCE_FILES.some((file) => file.startsWith(`${dir}${path.sep}`));
      expect(covered, `no modules discovered under ${dir}/`).toBe(true);
    }
  });

  it('excludes test files from the boot-path sweep', () => {
    expect(SOURCE_FILES.filter((file) => /\.(test|spec)\.js$/.test(file))).toEqual([]);
  });
});

describe('every backend module parses', () => {
  // The single check that would have caught four separate boot failures on
  // main at once. It runs without a database, Redis or a network, so it can
  // gate a pull request on its own.
  it('reports no unparseable modules', () => {
    const broken = findUnparseableFiles(SOURCE_FILES);
    const report = broken.map((entry) => `${entry.file}: ${entry.error}`).join('\n');

    expect(report).toBe('');
  });
});

describe('no module declares the same top-level name twice', () => {
  it('reports no duplicate declarations', () => {
    const offenders = SOURCE_FILES.map((file) => ({
      file,
      duplicates: findDuplicateDeclarations(file),
    })).filter((entry) => entry.duplicates.length > 0);

    const report = offenders
      .map((entry) => `${entry.file}: ${entry.duplicates.join(', ')}`)
      .join('\n');

    expect(report).toBe('');
  });
});

describe('router modules bind what they use', () => {
  it('reports no unbound express or router identifiers', () => {
    const offenders = SOURCE_FILES.map((file) => ({
      file,
      unbound: findUnboundRouterIdentifiers(file),
    })).filter((entry) => entry.unbound.length > 0);

    const report = offenders
      .map((entry) => `${entry.file}: ${entry.unbound.join(', ')}`)
      .join('\n');

    expect(report).toBe('');
  });
});

describe('the guard itself', () => {
  // A checker that cannot fail is worse than no checker, because it reads as
  // coverage. These pin that each check rejects the exact shape it exists for.

  it('rejects a module with an unterminated function', () => {
    withFixture(
      'controllers/broken.js',
      'exports.handler = async (req, res) => {\n  try {\n    res.json({});\n',
      (root) => {
        const result = parseFile('controllers/broken.js', root);
        expect(result.ok).toBe(false);
        expect(result.error).toMatch(/Unexpected end of input/);
      }
    );
  });

  it('rejects a module with a stray token after a comment block', () => {
    withFixture('services/broken.js', '/**\n * Doc.\n */.\nexports.value = 1;\n', (root) => {
      const result = parseFile('services/broken.js', root);
      expect(result.ok).toBe(false);
      expect(result.error).toMatch(/Unexpected token/);
    });
  });

  it('rejects two router modules concatenated together', () => {
    const doubled = [
      "const express = require('express');",
      'const router = express.Router();',
      'module.exports = router;',
      '',
      "const express = require('express');",
      'const router = express.Router();',
      'module.exports = router;',
      '',
    ].join('\n');

    withFixture('routes/broken.js', doubled, (root) => {
      expect(parseFile('routes/broken.js', root).ok).toBe(false);
      expect(findDuplicateDeclarations('routes/broken.js', root)).toEqual(['express', 'router']);
    });
  });

  it('rejects a router that calls express.Router() without importing express', () => {
    const missingImport = [
      "const { protect } = require('../middleware/auth');",
      'const router = express.Router();',
      "router.get('/', protect, (req, res) => res.json({}));",
      'module.exports = router;',
      '',
    ].join('\n');

    withFixture('routes/broken.js', missingImport, (root) => {
      // This one is valid syntax; only the binding check catches it.
      expect(parseFile('routes/broken.js', root).ok).toBe(true);
      expect(findUnboundRouterIdentifiers('routes/broken.js', root)).toEqual(['express']);
    });
  });

  it('rejects a module that calls router methods without a router', () => {
    const missingRouter = [
      "const express = require('express');",
      "router.post('/thing', (req, res) => res.json({}));",
      '',
    ].join('\n');

    withFixture('routes/broken.js', missingRouter, (root) => {
      expect(findUnboundRouterIdentifiers('routes/broken.js', root)).toContain('router');
    });
  });

  it('accepts a well-formed router', () => {
    const healthy = [
      "const express = require('express');",
      "const { protect } = require('../middleware/auth');",
      'const router = express.Router();',
      'router.use(protect);',
      "router.get('/', (req, res) => res.json({}));",
      'module.exports = router;',
      '',
    ].join('\n');

    withFixture('routes/healthy.js', healthy, (root) => {
      expect(parseFile('routes/healthy.js', root).ok).toBe(true);
      expect(findDuplicateDeclarations('routes/healthy.js', root)).toEqual([]);
      expect(findUnboundRouterIdentifiers('routes/healthy.js', root)).toEqual([]);
    });
  });

  it('accepts a module written with ESM syntax', () => {
    // A few modules here use `export function`; vm.Script cannot compile those,
    // so the checker falls through to `node --check`. Without that fallback
    // every ESM module would be reported as broken.
    withFixture('utils/esm.js', 'export function value() {\n  return 1;\n}\n', (root) => {
      expect(parseFile('utils/esm.js', root).ok).toBe(true);
    });
  });
});
