'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const {
  findUndeclared,
  importedPackages,
  toPackageName,
  stripNonCode,
} = require('./check-undeclared-deps');

/** Builds a throwaway workspace: a manifest plus one source file. */
function workspace(t, { declared = {}, source = '', filename = 'index.js' } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-fixture-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  fs.mkdirSync(path.join(root, 'app', 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'app', 'package.json'),
    JSON.stringify({ name: 'app', dependencies: declared }),
    'utf8'
  );
  fs.writeFileSync(path.join(root, 'app', 'src', filename), source, 'utf8');

  return {
    root,
    workspaces: [{ name: 'app', manifest: 'app/package.json', roots: ['app/src'] }],
  };
}

test('toPackageName ignores relative paths, builtins and virtual ids', () => {
  assert.strictEqual(toPackageName('./local'), null);
  assert.strictEqual(toPackageName('../../other'), null);
  assert.strictEqual(toPackageName('/abs/path'), null);
  assert.strictEqual(toPackageName('fs'), null);
  assert.strictEqual(toPackageName('node:path'), null);
  assert.strictEqual(toPackageName('virtual:pwa-register'), null);
});

test('toPackageName reduces subpaths to the declarable package name', () => {
  assert.strictEqual(toPackageName('lodash'), 'lodash');
  assert.strictEqual(toPackageName('react-icons/fa'), 'react-icons');
  assert.strictEqual(toPackageName('@scope/pkg'), '@scope/pkg');
  assert.strictEqual(toPackageName('@scope/pkg/deep/path'), '@scope/pkg');
});

test('importedPackages recognises every import form in use', () => {
  const found = importedPackages(`
    const a = require('alpha');
    import b from 'beta';
    import 'gamma/side-effect';
    const c = await import('delta');
    import { x } from '@scope/epsilon/sub';
  `);

  assert.deepStrictEqual([...found].sort(), ['@scope/epsilon', 'alpha', 'beta', 'delta', 'gamma']);
});

test('stripNonCode removes comments and template literals', () => {
  const code = stripNonCode(
    "// require('commented')\n/* from 'blocked' */\nconst s = `from 'templated'`;"
  );

  assert.ok(!code.includes('commented'));
  assert.ok(!code.includes('blocked'));
  assert.ok(!code.includes('templated'));
});

test('prose inside a template literal is not reported as a package', (t) => {
  // OfflineBanner.jsx contains `...dropped and came back` — the naive regex
  // matched the word "from" beside it and reported a package by that name.
  const fixture = workspace(t, {
    source: 'const msg = `the connection dropped and came back`;\n',
  });

  assert.deepStrictEqual(findUndeclared(fixture.workspaces, fixture.root), []);
});

test('a declared import is not reported', (t) => {
  const fixture = workspace(t, {
    declared: { lodash: '^4.17.21' },
    source: "const _ = require('lodash');\n",
  });

  assert.deepStrictEqual(findUndeclared(fixture.workspaces, fixture.root), []);
});

test('an undeclared import is reported with the file that imports it', (t) => {
  const fixture = workspace(t, {
    source: "const Y = require('yjs');\n",
    filename: 'crdt.js',
  });

  const undeclared = findUndeclared(fixture.workspaces, fixture.root);

  assert.strictEqual(undeclared.length, 1);
  assert.strictEqual(undeclared[0].package, 'yjs');
  assert.strictEqual(undeclared[0].workspace, 'app');
  assert.match(undeclared[0].files[0], /crdt\.js$/);
});

test('optionalDependencies and devDependencies count as declared', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'deps-fixture-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));

  fs.mkdirSync(path.join(root, 'app', 'src'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'app', 'package.json'),
    JSON.stringify({
      name: 'app',
      devDependencies: { vitest: '^4.0.0' },
      optionalDependencies: { '@aws-sdk/client-s3': '^3.0.0' },
    }),
    'utf8'
  );
  fs.writeFileSync(
    path.join(root, 'app', 'src', 'index.js'),
    "require('vitest');\nrequire('@aws-sdk/client-s3');\n",
    'utf8'
  );

  const workspaces = [{ name: 'app', manifest: 'app/package.json', roots: ['app/src'] }];
  assert.deepStrictEqual(findUndeclared(workspaces, root), []);
});

test('test files are not scanned', (t) => {
  const fixture = workspace(t, {
    source: "require('some-test-only-helper');\n",
    filename: 'thing.test.js',
  });

  assert.deepStrictEqual(findUndeclared(fixture.workspaces, fixture.root), []);
});

test('this repository has no undeclared imports', () => {
  const undeclared = findUndeclared();

  assert.deepStrictEqual(
    undeclared.map((entry) => `[${entry.workspace}] ${entry.package}`),
    []
  );
});
