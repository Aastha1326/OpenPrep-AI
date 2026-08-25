/**
 * Static integrity checks for backend source modules.
 *
 * These deliberately never execute the modules they inspect: a boot-blocking
 * defect has to be catchable without a database, Redis, or a network, or it
 * only gets caught by whoever runs the server next.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');

const BACKEND_ROOT = path.join(__dirname, '..', '..');

/** Source directories whose modules are loaded during server boot. */
const SOURCE_DIRS = [
  'controllers',
  'services',
  'routes',
  'models',
  'middleware',
  'sockets',
  'utils',
  'jobs',
];

/** Test fixtures and generated output are not part of the boot path. */
const IGNORED_SEGMENTS = ['node_modules', 'tests', '__tests__', 'coverage', 'uploads'];

function isIgnored(relativePath) {
  const segments = relativePath.split(path.sep);
  return (
    segments.some((segment) => IGNORED_SEGMENTS.includes(segment)) ||
    /\.(test|spec)\.js$/.test(relativePath)
  );
}

/** Every .js module under the directories the server boots from. */
function collectSourceFiles(root = BACKEND_ROOT, dirs = SOURCE_DIRS) {
  const found = [];

  const walk = (absoluteDir) => {
    if (!fs.existsSync(absoluteDir)) return;

    for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
      const absolute = path.join(absoluteDir, entry.name);
      const relative = path.relative(root, absolute);
      if (isIgnored(relative)) continue;

      if (entry.isDirectory()) {
        walk(absolute);
      } else if (entry.isFile() && entry.name.endsWith('.js')) {
        found.push(relative);
      }
    }
  };

  for (const dir of dirs) {
    walk(path.join(root, dir));
  }

  return found.sort();
}

/**
 * Compiles a file without running it.
 *
 * `vm.Script` covers CommonJS in-process, which is almost everything here and
 * keeps the whole sweep well under a second. A handful of modules use ESM
 * syntax, which `vm.Script` cannot compile; those fall through to `node
 * --check`, whose verdict is authoritative for either module system.
 *
 * @returns {{ file: string, ok: boolean, error: string|null }}
 */
function parseFile(relativePath, root = BACKEND_ROOT) {
  const absolute = path.join(root, relativePath);
  const source = fs.readFileSync(absolute, 'utf8');

  try {
    new vm.Script(source, { filename: absolute });
    return { file: relativePath, ok: true, error: null };
  } catch (commonjsError) {
    const check = spawnSync(process.execPath, ['--check', absolute], { encoding: 'utf8' });

    if (check.status === 0) {
      return { file: relativePath, ok: true, error: null };
    }

    const reported = (check.stderr || '').trim() || commonjsError.message;
    const syntaxLine = reported
      .split('\n')
      .find((line) => /Error:/.test(line));

    return { file: relativePath, ok: false, error: (syntaxLine || reported).trim() };
  }
}

/** Every file that fails to parse, with the reason. */
function findUnparseableFiles(files, root = BACKEND_ROOT) {
  return files.map((file) => parseFile(file, root)).filter((result) => !result.ok);
}

/**
 * Top-level `const`/`let` names declared more than once in a module.
 *
 * This is the signature of two whole modules concatenated by a bad merge -
 * the shape that broke routes/gamificationRoutes.js.
 */
function findDuplicateDeclarations(relativePath, root = BACKEND_ROOT) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const names = [...source.matchAll(/^(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/gm)].map(
    (match) => match[1]
  );

  return [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
}

/**
 * Identifiers a module uses but never binds.
 *
 * Deliberately narrow: it looks only for the two patterns that have actually
 * caused boot failures here - `express.Router()` without an `express` binding,
 * and `router.<method>()` without a `router` binding. A general undefined
 * identifier analysis would need real scope tracking and would be noisy.
 */
function findUnboundRouterIdentifiers(relativePath, root = BACKEND_ROOT) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const unbound = [];

  const binds = (name) =>
    new RegExp(`(?:const|let|var)\\s+${name}\\b`).test(source) ||
    new RegExp(`\\b${name}\\s*[,}]`).test(source.split('\n').filter((l) => l.includes('require(')).join('\n'));

  if (/\bexpress\.Router\s*\(/.test(source) && !binds('express')) {
    unbound.push('express');
  }

  if (/^\s*router\.(get|post|put|patch|delete|use|all)\s*\(/m.test(source) && !binds('router')) {
    unbound.push('router');
  }

  return unbound;
}

module.exports = {
  BACKEND_ROOT,
  SOURCE_DIRS,
  collectSourceFiles,
  parseFile,
  findUnparseableFiles,
  findDuplicateDeclarations,
  findUnboundRouterIdentifiers,
};
