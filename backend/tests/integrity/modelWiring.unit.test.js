import { describe, it, expect } from 'vitest';

const fs = require('fs');
const path = require('path');

const BACKEND_ROOT = path.join(__dirname, '..', '..');
const MODELS_DIR = path.join(BACKEND_ROOT, 'models');
const SERVICES_DIR = path.join(BACKEND_ROOT, 'services');

const MODEL_FILES = fs
  .readdirSync(MODELS_DIR)
  .filter((file) => file.endsWith('.js') && file !== 'index.js')
  .sort();

const read = (dir, file) => fs.readFileSync(path.join(dir, file), 'utf8');

/**
 * Requires a module and returns the failure as a string, or null on success.
 *
 * Optional vendor packages a contributor may not have installed are treated as
 * an environment gap, not a defect — this gate is about the repo's own wiring.
 */
function loadFailure(dir, file) {
  try {
    require(path.join(dir, file));
    return null;
  } catch (error) {
    // Node phrases this as "Cannot find module 'x'" for CJS and "Cannot find
    // package 'x' imported from …" for ESM; both mean the same thing here.
    if (/Cannot find (?:module|package) '[^.]/.test(error.message)) {
      return null;
    }
    return `${path.basename(dir)}/${file}: ${error.constructor.name}: ${String(error.message).split('\n')[0]}`;
  }
}

describe('models resolve the Sequelize instance', () => {
  it('finds the model files', () => {
    expect(MODEL_FILES.length).toBeGreaterThan(50);
  });

  it('never imports config/database as if it were the instance', () => {
    // backend/config/database.js is the sequelize-cli configuration that
    // .sequelizerc points at. It exports { development, test, production },
    // not a Sequelize. Four models bound it to a `sequelize` const and handed
    // it to Model.init, which fails inside sequelize as
    //   TypeError: Cannot read properties of undefined (reading 'define')
    // The live instance is exported from config/db as a named `sequelize`.
    const offenders = [];

    for (const dir of [MODELS_DIR, SERVICES_DIR]) {
      for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.js'))) {
        const source = read(dir, file);
        if (/require\(['"]\.\.\/config\/database['"]\)/.test(source)) {
          offenders.push(`${path.basename(dir)}/${file}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('every model loads', () => {
    // The parse gate runs node --check, which accepts all of these files.
    // They fail at require, which is the only place this class shows up.
    const failures = MODEL_FILES.map((file) => loadFailure(MODELS_DIR, file)).filter(Boolean);

    expect(failures).toEqual([]);
  });
});

describe('model registry', () => {
  /**
   * Loaded per assertion rather than while the describe body runs.
   *
   * A require at collection time turns a broken model into "1 failed suite,
   * no tests": the whole file dies before the source-level guards above ever
   * execute, and the report says nothing about which model or why. Deferring
   * it keeps those guards alive to name the problem.
   */
  const loadModels = () => require('../../models');

  it('exports the shared Sequelize instance', () => {
    const models = loadModels();

    expect(models.sequelize).toBeDefined();
    expect(typeof models.sequelize.define).toBe('function');
  });

  it.each([
    'AlumniMentorProfile',
    'ResumeParseSession',
    'MockInterview',
    'SalaryNegotiation',
  ])('registers %s', (name) => {
    // Absent from the registry, a model is skipped by sequelize.sync() and by
    // the association wiring in models/index.js, so it has no table and no
    // relationships even once it loads.
    const models = loadModels();

    expect(models[name], `${name} is missing from models/index.js`).toBeDefined();
    expect(models[name].name).toBe(name);
  });

});

describe('career-track services', () => {
  it.each([
    'MentorMatchingService.js',
    'ResumeParsingService.js',
    'MockInterviewService.js',
    'NegotiationService.js',
    'analyticsInsightsService.js',
  ])('%s loads', (file) => {
    expect(loadFailure(SERVICES_DIR, file)).toBeNull();
  });
});
