const fs = require('fs')
const path = require('path')

/**
 * Guards against the whole class of bug that took the API down: a route file
 * that destructures a handler the controller never exported.
 *
 * `router.post('/x', undefined)` throws while the module is still loading, so
 * a single missing export takes every route with it — not just its own. These
 * tests reproduce that at module-load time, without a database, so the failure
 * surfaces in CI instead of at boot.
 */

const ROUTES_DIR = path.join(__dirname, '../../routes')
const SERVER_FILE = path.join(__dirname, '../../server.js')

const routeFiles = fs
  .readdirSync(ROUTES_DIR)
  .filter((file) => file.endsWith('.js'))
  .sort()

/** Collect every handler Express registered for a router, across all methods. */
function collectHandlers(router) {
  const handlers = []
  const stack = (router && router.stack) || []

  for (const layer of stack) {
    if (!layer.route) continue
    const methods = Object.keys(layer.route.methods || {})
    for (const handle of layer.route.stack || []) {
      handlers.push({
        path: layer.route.path,
        methods,
        handle: handle.handle,
      })
    }
  }

  return handlers
}

describe('route module integrity', () => {
  it('finds route files to check', () => {
    expect(routeFiles.length).toBeGreaterThan(0)
  })

  describe.each(routeFiles)('%s', (file) => {
    it('loads without throwing', () => {
      expect(() => require(path.join(ROUTES_DIR, file))).not.toThrow()
    })

    it('registers only callable handlers', () => {
      const router = require(path.join(ROUTES_DIR, file))
      const nonFunctions = collectHandlers(router).filter(
        (entry) => typeof entry.handle !== 'function'
      )

      // Name the offenders — "expected 3 to be 0" is not a useful CI failure.
      const detail = nonFunctions
        .map((entry) => `${entry.methods.join('/').toUpperCase()} ${entry.path}`)
        .join(', ')

      expect(detail).toBe('')
    })
  })
})

describe('server.js route wiring', () => {
  const source = fs.readFileSync(SERVER_FILE, 'utf8')

  const requiredNames = new Set(
    [...source.matchAll(/const\s+(\w+)\s*=\s*require\('\.\/routes\//g)].map((m) => m[1])
  )
  const mountedNames = new Set(
    [...source.matchAll(/app\.use\([^,]+,\s*(\w*[Rr]outes)\s*\)/g)].map((m) => m[1])
  )

  it('requires every router it mounts', () => {
    // `app.use('/api/folders', folderRoutes)` with no matching require is a
    // ReferenceError at boot, and nothing else in the file hints at it.
    const missing = [...mountedNames].filter((name) => !requiredNames.has(name))
    expect(missing).toEqual([])
  })

  it('mounts at least one router', () => {
    expect(mountedNames.size).toBeGreaterThan(0)
  })
})

describe('flashcardController exports the handlers flashcardRoutes imports', () => {
  const controller = require('../../controllers/flashcardController')
  const source = fs.readFileSync(path.join(ROUTES_DIR, 'flashcardRoutes.js'), 'utf8')

  const destructured = (() => {
    const match = source.match(
      /const\s*\{([^}]*)\}\s*=\s*require\('\.\.\/controllers\/flashcardController'\)/s
    )
    if (!match) return []
    return match[1]
      .split(',')
      .map((name) => name.trim().split(':')[0].trim())
      .filter(Boolean)
  })()

  it('destructures at least one handler', () => {
    expect(destructured.length).toBeGreaterThan(0)
  })

  it('defines every destructured name', () => {
    const missing = destructured.filter((name) => typeof controller[name] !== 'function')
    expect(missing).toEqual([])
  })

  it.each([
    'generateFlashcardsFromAudio',
    'rateCommunityDeck',
    'starCommunityDeck',
    'batchSyncOfflineReviews',
  ])('exports %s', (name) => {
    expect(typeof controller[name]).toBe('function')
  })
})

describe('authController exports the handlers authRoutes imports', () => {
  const controller = require('../../controllers/authController')
  const source = fs.readFileSync(path.join(ROUTES_DIR, 'authRoutes.js'), 'utf8')

  const destructured = (() => {
    const match = source.match(
      /const\s*\{([^}]*)\}\s*=\s*require\('\.\.\/controllers\/authController'\)/s
    )
    if (!match) return []
    return match[1]
      .split(',')
      .map((name) => name.trim().split(':')[0].trim())
      .filter(Boolean)
  })()

  it('defines every destructured name', () => {
    const missing = destructured.filter((name) => typeof controller[name] !== 'function')
    expect(missing).toEqual([])
  })

  it('exports verifyEmail', () => {
    expect(typeof controller.verifyEmail).toBe('function')
  })
})
