import { describe, it, expect } from 'vitest';

const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.join(__dirname, '..', '..');
const SERVER_PATH = path.join(BACKEND_ROOT, 'server.js');
const SOURCE = fs.readFileSync(SERVER_PATH, 'utf8');

/**
 * Every identifier server.js binds to a require at any point in the file.
 *
 * Both placements are in use — a block of requires near the top, and a handful
 * declared inline immediately above their own app.use — so this scans the
 * whole file rather than a prefix of it. Destructured requires are included
 * because the rate limiters arrive that way.
 */
function boundIdentifiers(source) {
  const bound = new Set();

  for (const match of source.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(/g)) {
    bound.add(match[1]);
  }

  for (const match of source.matchAll(/(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\(/g)) {
    for (const part of match[1].split(',')) {
      const name = part.split(':').pop().trim();
      if (name) bound.add(name);
    }
  }

  // Routers built in-file rather than required, e.g. `const apiRouter = express.Router()`.
  for (const match of source.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*express\.Router\(/g)) {
    bound.add(match[1]);
  }

  return bound;
}

/** Bare identifiers handed to app.use, ignoring inline requires and call expressions. */
function mountedIdentifiers(source) {
  const mounted = [];

  for (const match of source.matchAll(/app\.use\(\s*(?:'[^']*'|"[^"]*")\s*,\s*([^),\n]+)\)/g)) {
    const argument = match[1].trim();

    if (/^[A-Za-z_$][\w$]*$/.test(argument)) {
      mounted.push(argument);
    }
  }

  return mounted;
}

describe('server.js binds every router it mounts', () => {
  const bound = boundIdentifiers(SOURCE);

  it('finds the mounts to check', () => {
    // A regex that silently matched nothing would make every assertion below
    // vacuously true.
    expect(mountedIdentifiers(SOURCE).length).toBeGreaterThan(50);
  });

  it('has no app.use referencing an unbound identifier', () => {
    // examStrategyRoutes and studyTipRoutes were mounted at server.js:436-437
    // with no require anywhere in the file's 143 of them. Both route files
    // existed; only the requires were missing. At boot this is
    // `ReferenceError: examStrategyRoutes is not defined`.
    const unbound = [...new Set(mountedIdentifiers(SOURCE))].filter((name) => !bound.has(name));

    expect(unbound).toEqual([]);
  });

  it('requires a route file that exists for every router it binds', () => {
    const missing = [];

    for (const match of SOURCE.matchAll(/require\('(\.\/routes\/[A-Za-z0-9_.-]+)'\)/g)) {
      const target = path.join(BACKEND_ROOT, `${match[1]}.js`);
      if (!fs.existsSync(target)) missing.push(match[1]);
    }

    expect(missing).toEqual([]);
  });
});

describe('route modules resolve their middleware', () => {
  const ROUTES_DIR = path.join(BACKEND_ROOT, 'routes');
  const ROUTE_FILES = fs.readdirSync(ROUTES_DIR).filter((file) => file.endsWith('.js'));

  it('finds the route modules', () => {
    expect(ROUTE_FILES.length).toBeGreaterThan(50);
  });

  it('never imports a middleware module that does not exist', () => {
    // milestoneRoutes.js was the only file in the repo requiring
    // '../middleware/authMiddleware'. There is no such module — the guard is
    // exported from middleware/auth.js, which is what every other route uses.
    // Since server.js mounts milestoneRoutes, this took the boot down with
    // `Cannot find module '../middleware/authMiddleware'`.
    const broken = [];

    for (const file of ROUTE_FILES) {
      const source = fs.readFileSync(path.join(ROUTES_DIR, file), 'utf8');

      for (const match of source.matchAll(/require\('(\.\.\/middleware\/[A-Za-z0-9_.-]+)'\)/g)) {
        const target = path.join(ROUTES_DIR, `${match[1]}.js`);
        if (!fs.existsSync(target)) broken.push(`${file}: ${match[1]}`);
      }
    }

    expect(broken).toEqual([]);
  });

  it('imports the auth guard from the module that exports it', () => {
    // middleware/auth.js exports protect, authorize and requireAdmin. Anything
    // destructuring those from a different path is the bug above wearing a
    // different filename.
    const auth = require('../../middleware/auth');

    expect(typeof auth.protect).toBe('function');
    expect(typeof auth.authorize).toBe('function');
    expect(typeof auth.requireAdmin).toBe('function');
  });
});

describe('the three routers this fix restores', () => {
  it.each([
    ['milestoneRoutes', '/api/milestones'],
    ['examStrategyRoutes', '/api/exam-strategies'],
    ['studyTipRoutes', '/api/study-tips'],
  ])('%s loads and is mounted at %s', (routerName, mountPath) => {
    const router = require(`../../routes/${routerName}`);

    expect(typeof router).toBe('function');
    expect(router.stack.length).toBeGreaterThan(0);
    expect(SOURCE).toContain(`app.use('${mountPath}', ${routerName});`);
  });

  it('guards milestone routes with protect', () => {
    // The bad import meant `protect` was destructured from a module that threw
    // before it could resolve, so this route file could never have applied it.
    const source = fs.readFileSync(path.join(BACKEND_ROOT, 'routes', 'milestoneRoutes.js'), 'utf8');

    expect(source).toContain("require('../middleware/auth')");
    // Written as `router.route('/').get(protect, ...)`, so match the verb
    // rather than assuming the router.get(path, ...) form.
    expect(source).toMatch(/\.(get|post|put|patch|delete)\(\s*protect\b/);
  });
});
