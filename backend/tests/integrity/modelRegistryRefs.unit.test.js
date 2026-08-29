import { describe, it, expect } from 'vitest';

const fs = require('fs');
const path = require('path');

const MODELS_DIR = path.join(__dirname, '..', '..', 'models');
const INDEX_PATH = path.join(MODELS_DIR, 'index.js');
const SOURCE = fs.readFileSync(INDEX_PATH, 'utf8');

/**
 * Every identifier models/index.js binds at the top level.
 *
 * Both import shapes are in use: most models export the model directly
 * (`const User = require('./User')`), while the bounty and moderation models
 * export an `{ Model, initModel }` pair that is destructured. Missing the
 * second shape would make this gate report false positives.
 */
function boundIdentifiers(source) {
  const bound = new Set();

  for (const match of source.matchAll(/(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*require\(/g)) {
    bound.add(match[1]);
  }

  for (const match of source.matchAll(/(?:const|let|var)\s*\{([^}]+)\}\s*=\s*require\(/g)) {
    for (const part of match[1].split(',')) {
      // Handles `{ Bounty, initBounty }` and `{ Bounty: Model }` alike.
      const name = part.split(':').pop().trim();
      if (name) bound.add(name);
    }
  }

  return bound;
}

/** Model identifiers passed to a Sequelize association call. */
function associationTargets(source) {
  const body = source.slice(0, source.lastIndexOf('module.exports'));
  const targets = new Set();

  for (const match of body.matchAll(
    /\.(?:hasMany|hasOne|belongsTo|belongsToMany)\(\s*([A-Za-z_$][\w$]*)/g
  )) {
    targets.add(match[1]);
  }

  return targets;
}

/** Identifiers listed in the module.exports object literal. */
function exportedIdentifiers(source) {
  const block = source.slice(source.lastIndexOf('module.exports'));
  const exported = new Set();

  for (const match of block.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*,\s*$/gm)) {
    exported.add(match[1]);
  }

  return exported;
}

describe('models/index.js references only identifiers it binds', () => {
  const bound = boundIdentifiers(SOURCE);

  it('binds every model it wires into an association', () => {
    // SkillDependency, FocusSessionLog, StudyGoal, StudyGoalProgress,
    // WeeklyStudyReport, ExamStrategy and StudyTip were all wired into
    // associations without a require. The first one threw at line 166 and the
    // rest were hidden behind it — a fix-one-rerun loop that took seven passes
    // to find them all.
    const undefinedTargets = [...associationTargets(SOURCE)].filter((name) => !bound.has(name));

    expect(undefinedTargets).toEqual([]);
  });

  it('binds every identifier it re-exports', () => {
    // A name in module.exports that was never required is a ReferenceError
    // thrown while building the object, so it takes the registry down at load
    // rather than merely exporting undefined.
    const undefinedExports = [...exportedIdentifiers(SOURCE)].filter(
      (name) => name !== 'sequelize' && !bound.has(name)
    );

    expect(undefinedExports).toEqual([]);
  });

  it('exports every model it imports', () => {
    // The inverse leak: imported, associated, then left out of the exports, so
    // `const { Thing } = require('../models')` silently yields undefined and
    // the first query against it throws somewhere far from the cause.
    const exported = exportedIdentifiers(SOURCE);
    const importedModels = [...SOURCE.matchAll(/const\s+([A-Za-z_$][\w$]*)\s*=\s*require\('\.\/([A-Za-z_$][\w$]*)'\)/g)]
      .map((match) => match[1])
      .filter((name) => name !== 'sequelize');

    const unexported = importedModels.filter((name) => !exported.has(name));

    expect(unexported).toEqual([]);
  });

  it('imports each model file at most once', () => {
    const seen = new Map();

    for (const match of SOURCE.matchAll(/require\('\.\/([A-Za-z_$][\w$]*)'\)/g)) {
      seen.set(match[1], (seen.get(match[1]) || 0) + 1);
    }

    expect([...seen.entries()].filter(([, count]) => count > 1)).toEqual([]);
  });
});

describe('models the registry gained in this fix', () => {
  const RESTORED = [
    'SkillDependency',
    'FocusSessionLog',
    'StudyGoal',
    'StudyGoalProgress',
    'WeeklyStudyReport',
    'ExamStrategy',
    'StudyTip',
    'StudyReminder',
    'AlumniMentorProfile',
    'ResumeParseSession',
    'MockInterview',
    'SalaryNegotiation',
  ];

  it.each(RESTORED)('%s has a file on disk', (name) => {
    expect(fs.existsSync(path.join(MODELS_DIR, `${name}.js`))).toBe(true);
  });

  it.each(RESTORED)('%s is registered under its own name', (name) => {
    const models = require('../../models');

    expect(models[name], `${name} is missing from models/index.js`).toBeDefined();
    expect(models[name].name).toBe(name);
  });

  it('wires the skill dependency graph in both directions', () => {
    // Topic <-> SkillDependency is the pair that first threw. Both sides need
    // to survive, not just the require.
    const { Topic, SkillDependency } = require('../../models');

    expect(Object.keys(Topic.associations)).toEqual(
      expect.arrayContaining(['dependencies', 'dependents'])
    );
    expect(Object.keys(SkillDependency.associations)).toEqual(
      expect.arrayContaining(['skill', 'prerequisite'])
    );
  });
});
