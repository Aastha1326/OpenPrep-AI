import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

const fs = require('fs');
const path = require('path');

const CONTROLLER_PATH = path.join(__dirname, '..', '..', 'controllers', 'skillGapController.js');
const SOURCE = fs.readFileSync(CONTROLLER_PATH, 'utf8');

/**
 * skillGapController destructures the dependency service at module load:
 *
 *   const { getSkillGraph, addDependency } = require('../services/skillDependencyService');
 *
 * It therefore holds direct function references, and replacing a method on the
 * service afterwards would never be seen. The doubles have to be installed on
 * the service's exports first, with the controller required only after — so
 * the destructuring picks them up.
 */
const getSkillGraph = vi.fn();
const addDependency = vi.fn();

const skillDependencyService = require('../../services/skillDependencyService');
skillDependencyService.getSkillGraph = getSkillGraph;
skillDependencyService.addDependency = addDependency;

delete require.cache[require.resolve('../../controllers/skillGapController')];

const resumeParserService = require('../../services/resumeParserService');
const skillGapController = require('../../controllers/skillGapController');

function mockRes() {
  return {
    statusCode: null,
    payload: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.payload = body;
      return this;
    },
  };
}

const mockReq = (overrides = {}) => ({
  params: {},
  body: {},
  user: { id: 11 },
  ...overrides,
});

describe('skillGapController source integrity', () => {
  it('parses as valid JavaScript', () => {
    // createDependency closed its catch but never closed the function, so
    // module.exports was parsed as though it were still inside the body and
    // the file ended on `SyntaxError: Unexpected end of input`.
    expect(() => new Function(SOURCE)).not.toThrow();
  });

  it('has balanced braces', () => {
    // A cheap structural check that localises the truncation class of bug
    // without needing the parser to agree on where it went wrong. Braces
    // inside strings, template literals, comments and regexes are stripped
    // first so only structural braces are counted.
    const stripped = SOURCE
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/`(?:\\.|[^`\\])*`/g, '``')
      .replace(/'(?:\\.|[^'\\])*'/g, "''")
      .replace(/"(?:\\.|[^"\\])*"/g, '""');

    const opens = (stripped.match(/\{/g) || []).length;
    const closes = (stripped.match(/\}/g) || []).length;

    expect(closes - opens).toBe(0);
  });

  it('closes every top-level handler before the next declaration', () => {
    // Each `const handler = async (req, res) => {` must be terminated by a
    // `};` at column zero. createDependency was missing exactly that.
    const declarations = (SOURCE.match(/^const \w+ = async \(req, res\) => \{$/gm) || []).length;
    const terminators = (SOURCE.match(/^\};$/gm) || []).length;

    expect(declarations).toBeGreaterThan(0);
    // One terminator per handler, plus the one closing module.exports.
    expect(terminators).toBe(declarations + 1);
  });

  it('exports every handler skillGapRoutes binds', () => {
    for (const handler of ['analyzeResume', 'getHistory', 'getDependencyGraph', 'createDependency']) {
      expect(typeof skillGapController[handler], `${handler} is missing`).toBe('function');
    }
  });
});

describe('skillGapController.createDependency', () => {
  beforeEach(() => {
    addDependency.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('creates the dependency and answers 201', async () => {
    addDependency.mockResolvedValue({ id: 5 });

    const res = mockRes();
    await skillGapController.createDependency(
      mockReq({
        body: {
          skillId: 'topic-2',
          prerequisiteSkillId: 'topic-1',
          dependencyType: 'hard',
          weight: 0.8,
        },
      }),
      res
    );

    expect(addDependency).toHaveBeenCalledWith({
      skillId: 'topic-2',
      prerequisiteSkillId: 'topic-1',
      dependencyType: 'hard',
      weight: 0.8,
    });
    expect(res.statusCode).toBe(201);
    expect(res.payload).toEqual({ success: true, data: { id: 5 } });
  });

  it('rejects a request missing skillId before calling the service', async () => {
    const res = mockRes();
    await skillGapController.createDependency(
      mockReq({ body: { prerequisiteSkillId: 'topic-1' } }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({
      success: false,
      message: 'skillId and prerequisiteSkillId are required.',
    });
    expect(addDependency).not.toHaveBeenCalled();
  });

  it('rejects a request missing prerequisiteSkillId', async () => {
    const res = mockRes();
    await skillGapController.createDependency(mockReq({ body: { skillId: 'topic-2' } }), res);

    expect(res.statusCode).toBe(400);
  });

  it('answers 400 with the service message when creation fails', async () => {
    addDependency.mockRejectedValue(new Error('A skill cannot depend on itself.'));

    const res = mockRes();
    await skillGapController.createDependency(
      mockReq({ body: { skillId: 'topic-1', prerequisiteSkillId: 'topic-1' } }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({
      success: false,
      message: 'A skill cannot depend on itself.',
    });
  });
});

describe('skillGapController.getDependencyGraph', () => {
  beforeEach(() => {
    getSkillGraph.mockReset();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the graph for the authenticated user', async () => {
    const graph = { nodes: [{ id: 'topic-1' }], edges: [] };
    getSkillGraph.mockResolvedValue(graph);

    const res = mockRes();
    await skillGapController.getDependencyGraph(mockReq(), res);

    expect(getSkillGraph).toHaveBeenCalledWith(11);
    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ success: true, data: graph });
  });

  it('answers 500 when the graph cannot be built', async () => {
    getSkillGraph.mockRejectedValue(new Error('query failed'));

    const res = mockRes();
    await skillGapController.getDependencyGraph(mockReq(), res);

    expect(res.statusCode).toBe(500);
    expect(res.payload).toEqual({ success: false, message: 'query failed' });
  });

  it('falls back to its own message when the error carries none', async () => {
    getSkillGraph.mockRejectedValue(new Error(''));

    const res = mockRes();
    await skillGapController.getDependencyGraph(mockReq(), res);

    expect(res.payload).toEqual({
      success: false,
      message: 'Failed to fetch skill dependency graph.',
    });
  });
});

describe('skillGapController.analyzeResume', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires an uploaded file', async () => {
    const res = mockRes();
    await skillGapController.analyzeResume(mockReq({ body: {} }), res);

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({ success: false, message: 'Resume file is required.' });
  });

  it('requires both a job description and a target role', async () => {
    const res = mockRes();
    await skillGapController.analyzeResume(
      mockReq({ file: { buffer: Buffer.from('pdf') }, body: { targetRole: 'SDE' } }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.payload).toEqual({
      success: false,
      message: 'Job description and target role are required.',
    });
  });

  it('returns the analysis when the request is complete', async () => {
    vi.spyOn(resumeParserService, 'analyzeSkillGap').mockResolvedValue({ overallMatchScore: 72 });

    const res = mockRes();
    await skillGapController.analyzeResume(
      mockReq({
        file: { buffer: Buffer.from('pdf') },
        body: { jobDescription: 'Build APIs', targetRole: 'Backend Engineer' },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ success: true, data: { overallMatchScore: 72 } });
  });
});

describe('skillGapController.getHistory', () => {
  it('returns an empty history without throwing', async () => {
    const res = mockRes();
    await skillGapController.getHistory(mockReq(), res);

    expect(res.statusCode).toBe(200);
    expect(res.payload).toEqual({ success: true, data: [] });
  });
});
