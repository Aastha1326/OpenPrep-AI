import { describe, it, expect } from 'vitest';

const fs = require('fs');
const path = require('path');

const ROUTES_PATH = path.join(__dirname, '..', '..', 'routes', 'studyPlanRoutes.js');
const ROUTES_SOURCE = fs.readFileSync(ROUTES_PATH, 'utf8');

/** Flattens an Express router's stack into "METHOD /path" strings. */
function registeredRoutes(router) {
  return router.stack
    .filter((layer) => layer.route)
    .map((layer) => `${Object.keys(layer.route.methods)[0].toUpperCase()} ${layer.route.path}`);
}

describe('studyPlanRoutes module', () => {
  it('loads without throwing', () => {
    // server.js requires this at line 61, ahead of every other route module,
    // so an unbound identifier here is the first thing that stops a boot.
    expect(() => require('../../routes/studyPlanRoutes')).not.toThrow();
  });

  it('imports express before calling express.Router()', () => {
    const importIndex = ROUTES_SOURCE.indexOf("require('express')");
    const useIndex = ROUTES_SOURCE.indexOf('express.Router()');

    expect(importIndex).toBeGreaterThan(-1);
    expect(importIndex).toBeLessThan(useIndex);
  });

  it('exports an Express router', () => {
    const router = require('../../routes/studyPlanRoutes');
    expect(typeof router).toBe('function');
    expect(Array.isArray(router.stack)).toBe(true);
  });

  it('registers the study plan routes it documents', () => {
    const routes = registeredRoutes(require('../../routes/studyPlanRoutes'));

    expect(routes).toContain('POST /');
    expect(routes).toContain('GET /');
    expect(routes.length).toBeGreaterThan(2);
  });

  it('binds every route to a callable handler', () => {
    const router = require('../../routes/studyPlanRoutes');

    for (const layer of router.stack.filter((entry) => entry.route)) {
      for (const handler of layer.route.stack) {
        expect(typeof handler.handle, `${layer.route.path} has a non-function handler`).toBe(
          'function'
        );
      }
    }
  });

  it('guards every route with protect', () => {
    const { protect } = require('../../middleware/auth');
    const router = require('../../routes/studyPlanRoutes');

    const routerLevel = router.stack
      .filter((layer) => !layer.route)
      .map((layer) => layer.handle);

    for (const layer of router.stack.filter((entry) => entry.route)) {
      const handlers = layer.route.stack.map((entry) => entry.handle);
      const guarded = routerLevel.includes(protect) || handlers.includes(protect);

      expect(guarded, `${layer.route.path} is unguarded`).toBe(true);
    }
  });
});
