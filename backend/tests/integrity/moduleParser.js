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

/** Modules outside those directories that the server still loads at boot. */
const ROOT_FILES = ['server.js'];

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

  for (const file of ROOT_FILES) {
    if (fs.existsSync(path.join(root, file))) found.push(file);
  }

  return found.sort();
}

/**
 * Every name a module binds at the top level, including destructured requires.
 *
 * `const { protect } = require('./auth')` binds `protect`, and
 * `const { a: b } = ...` binds `b`, so both forms have to be recognised or the
 * checks below report false positives.
 */
function boundIdentifiers(source) {
  const bound = new Set();

  for (const match of source.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=/g)) {
    bound.add(match[1]);
  }

  for (const match of source.matchAll(/(?:const|let|var)\s*\{([^}]*)\}\s*=/g)) {
    for (const part of match[1].split(',')) {
      const name = part.split(':').pop().trim().replace(/\s*=.*$/, '');
      if (name) bound.add(name);
    }
  }

  for (const match of source.matchAll(/function\s+([A-Za-z_$][\w$]*)/g)) {
    bound.add(match[1]);
  }

  return bound;
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

  const bound = boundIdentifiers(source);

  if (/\bexpress\.Router\s*\(/.test(source) && !bound.has('express')) {
    unbound.push('express');
  }

  if (/^\s*router\.(get|post|put|patch|delete|use|all)\s*\(/m.test(source) && !bound.has('router')) {
    unbound.push('router');
  }

  return unbound;
}

/**
 * Router identifiers mounted with `app.use('/path', name)` but never bound.
 *
 * server.js mounts around eighty routers by hand. A lost require line there
 * parses cleanly and only fails when the process actually boots, which is how
 * sessionRoutes and recommendationRoutes reached main.
 */
function findUnmountableRouters(relativePath, root = BACKEND_ROOT) {
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const bound = boundIdentifiers(source);

  const mounted = [...source.matchAll(/app\.use\(\s*'[^']*',\s*([A-Za-z_$][\w$]*)/g)].map(
    (match) => match[1]
  );

  return [...new Set(mounted)].filter((name) => !bound.has(name) && name !== 'require');
}

module.exports = {
  BACKEND_ROOT,
  SOURCE_DIRS,
  ROOT_FILES,
  boundIdentifiers,
  findUnmountableRouters,
  collectSourceFiles,
  parseFile,
  findUnparseableFiles,
  findDuplicateDeclarations,
  findUnboundRouterIdentifiers,
};
