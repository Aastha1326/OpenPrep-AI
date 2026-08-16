'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const { validateManifests, walk, REPO_ROOT } = require('./validate-manifests');

/** Writes `contents` to a throwaway file and returns its absolute path. */
function fixture(t, filename, contents) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-fixture-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const file = path.join(directory, filename);
  fs.writeFileSync(file, contents, 'utf8');
  return file;
}

test('accepts valid JSON', (t) => {
  const file = fixture(t, 'package.json', '{ "name": "ok", "scripts": { "a": "b" } }');

  assert.deepStrictEqual(validateManifests([file]), []);
});

test('accepts valid YAML', (t) => {
  const file = fixture(t, 'workflow.yml', 'name: CI\njobs:\n  lint:\n    runs-on: ubuntu-latest\n');

  assert.deepStrictEqual(validateManifests([file]), []);
});

test('rejects JSON with a missing comma', (t) => {
  // The exact shape of the root package.json breakage in issue #1105.
  const file = fixture(
    t,
    'package.json',
    '{\n  "scripts": {\n    "a": "one"\n    "b": "two"\n  }\n}'
  );

  const failures = validateManifests([file]);

  assert.strictEqual(failures.length, 1);
  assert.match(failures[0].file, /package\.json$/);
  assert.match(failures[0].message, /Expected|expected/);
});

test('rejects JSON with a second object appended', (t) => {
  // The .lighthouserc.json breakage: one complete object, then another.
  const file = fixture(t, 'config.json', '{ "ci": { "a": 1 } }\n{ "ci": { "a": 2 } }\n');

  const failures = validateManifests([file]);

  assert.strictEqual(failures.length, 1);
  assert.match(failures[0].file, /config\.json$/);
});

test('rejects YAML with a dedented sequence item', (t) => {
  // The ci.yml breakage: a step dropped to column 0 mid-sequence.
  const file = fixture(
    t,
    'workflow.yml',
    [
      'jobs:',
      '  test:',
      '    steps:',
      '      - name: Install',
      '        run: npm install',
      '',
      '- name: Test',
      '        run: npm test',
      '',
    ].join('\n')
  );

  const failures = validateManifests([file]);

  assert.strictEqual(failures.length, 1);
  assert.match(failures[0].file, /workflow\.yml$/);
});

test('rejects a workflow holding more than one document', (t) => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'manifest-fixture-'));
  t.after(() => fs.rmSync(directory, { recursive: true, force: true }));

  const workflows = path.join(REPO_ROOT, '.github', 'workflows');
  const file = path.join(workflows, '__validate_manifests_fixture__.yml');
  t.after(() => fs.rmSync(file, { force: true }));

  fs.writeFileSync(file, 'name: One\n---\nname: Two\n', 'utf8');

  const failures = validateManifests([file]);

  assert.strictEqual(failures.length, 1);
  assert.match(failures[0].message, /single workflow document/);
});

test('reports every failure, not just the first', (t) => {
  const bad = fixture(t, 'a.json', '{ "a": 1');
  const alsoBad = fixture(t, 'b.json', '{ "b": 2');

  assert.strictEqual(validateManifests([bad, alsoBad]).length, 2);
});

test('walk skips lockfiles and dependency directories', () => {
  const files = walk(REPO_ROOT).map((file) => path.relative(REPO_ROOT, file));

  assert.ok(files.length > 0, 'expected to discover manifests');
  assert.ok(!files.some((file) => file.includes('node_modules')));
  assert.ok(!files.some((file) => file.endsWith('package-lock.json')));
  assert.ok(!files.some((file) => file.endsWith('pnpm-lock.yaml')));
});

test('every manifest committed to this repository parses', () => {
  const failures = validateManifests();

  assert.deepStrictEqual(
    failures.map((failure) => `${failure.file}: ${failure.message}`),
    []
  );
});
