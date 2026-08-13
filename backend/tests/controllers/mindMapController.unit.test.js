const mindMapController = require('../../controllers/mindMapController');
const { validateGenerateMindMap } = require('../../middleware/validators');
const MindMap = require('../../models/MindMap');

function runMiddleware(middlewareList, req) {
  return new Promise((resolve) => {
    let resolved = false;
    const res = {
      statusCode: 200,
      data: null,
      status(c) {
        this.statusCode = c;
        return this;
      },
      json(d) {
        this.data = d;
        if (!resolved) {
          resolved = true;
          resolve(this);
        }
        return this;
      },
    };

    let idx = 0;
    function next(err) {
      if (resolved) return;
      if (err) {
        res.statusCode = 500;
        res.data = { error: err.message };
        resolved = true;
        return resolve(res);
      }
      if (idx >= middlewareList.length) {
        resolved = true;
        return resolve(res);
      }
      const current = middlewareList[idx++];
      current(req, res, next);
    }

    next();
  });
}

describe('Mind Map Controller & Middleware - Unit Tests', () => {
  beforeAll(() => {
    delete process.env.GEMINI_API_KEY;
  });

  describe('validateGenerateMindMap', () => {
    it('should pass validation with empty body or valid UUID fields', async () => {
      const req = {
        body: {
          textContext: 'Sample study note on data structures.',
        },
      };
      const res = await runMiddleware(validateGenerateMindMap, req);
      expect(res.statusCode).toBe(200);
    });

    it('should fail validation when invalid non-UUID noteId is provided', async () => {
      const req = {
        body: {
          noteId: 'invalid-uuid-format',
        },
      };
      const res = await runMiddleware(validateGenerateMindMap, req);
      expect(res.statusCode).toBe(400);
      expect(res.data.success).toBe(false);
      expect(res.data.error).toContain('noteId');
    });
  });

  describe('generateMindMap Controller Handler', () => {
    it('should generate mind map graph and save in database returning 201', async () => {
      const fakeUser = { id: '11111111-1111-1111-1111-111111111111' };
      const fakeMindMap = {
        id: '22222222-2222-2222-2222-222222222222',
        user: fakeUser.id,
        title: 'Data Structures Concept Mind Map',
        nodesData: { nodes: [{ id: 'node-root', label: 'Data Structures' }], edges: [] },
      };

      vi.spyOn(MindMap, 'create').mockResolvedValue(fakeMindMap);

      const req = {
        user: fakeUser,
        body: { textContext: 'Data Structures and Algorithms overview' },
        query: {},
      };

      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await mindMapController.generateMindMap(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toBeDefined();
      expect(responseData.data.title).toBe('Data Structures Concept Mind Map');

      MindMap.create.mockRestore();
    });
  });

  describe('getMindMapById Controller Handler', () => {
    it('should return 404 when mind map ID is not found', async () => {
      vi.spyOn(MindMap, 'findOne').mockResolvedValue(null);

      const req = {
        user: { id: '11111111-1111-1111-1111-111111111111' },
        params: { id: '33333333-3333-3333-3333-333333333333' },
      };

      let statusCode = null;
      let responseData = null;

      const res = {
        status(c) {
          statusCode = c;
          return this;
        },
        json(d) {
          responseData = d;
          return this;
        },
      };

      await mindMapController.getMindMapById(req, res, (err) => {
        if (err) throw err;
      });

      expect(statusCode).toBe(404);
      expect(responseData.success).toBe(false);

      MindMap.findOne.mockRestore();
    });
  });
});
