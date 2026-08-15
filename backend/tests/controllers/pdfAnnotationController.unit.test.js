const { getAnnotations, saveAnnotation } = require('../../controllers/pdfAnnotationController');
const PDFAnnotation = require('../../models/PDFAnnotation');





PDFAnnotation.findAll = vi.fn();
PDFAnnotation.create = vi.fn();
describe('PDFAnnotation Controller', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      params: { id: 'doc-1' },
      user: { id: 'user-1' },
      body: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
    next = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('getAnnotations', () => {
    it('should fetch all annotations for a given document and user', async () => {
      const mockAnnotations = [{ id: 1, commentText: 'Test' }];
      PDFAnnotation.findAll.mockResolvedValue(mockAnnotations);

      await getAnnotations(req, res, next);

      expect(PDFAnnotation.findAll).toHaveBeenCalledWith({
        where: { documentId: 'doc-1', userId: 'user-1' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockAnnotations });
    });

    it('should call next with error if fetching fails', async () => {
      const error = new Error('Database Error');
      PDFAnnotation.findAll.mockRejectedValue(error);

      await getAnnotations(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('saveAnnotation (coordinates serialization)', () => {
    it('should save a new annotation with correctly serialized rectsData', async () => {
      req.body = {
        pageNumber: 1,
        rectsData: [{ x: 10, y: 20, width: 100, height: 50 }],
        color: '#FF0000',
        commentText: 'Highlighting important part',
      };

      const mockCreated = { id: 2, ...req.body, documentId: 'doc-1', userId: 'user-1' };
      PDFAnnotation.create.mockResolvedValue(mockCreated);

      await saveAnnotation(req, res, next);

      expect(PDFAnnotation.create).toHaveBeenCalledWith({
        documentId: 'doc-1',
        userId: 'user-1',
        pageNumber: 1,
        rectsData: [{ x: 10, y: 20, width: 100, height: 50 }], // Testing coordinate serialization payload
        color: '#FF0000',
        commentText: 'Highlighting important part',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: mockCreated });
    });

    it('should use default color if not provided', async () => {
      req.body = {
        pageNumber: 2,
        rectsData: [],
      };

      PDFAnnotation.create.mockResolvedValue({});

      await saveAnnotation(req, res, next);

      expect(PDFAnnotation.create).toHaveBeenCalledWith(
        expect.objectContaining({ color: '#FFE900' })
      );
    });

    it('should call next with error if saving fails', async () => {
      req.body = { pageNumber: 1, rectsData: [] };
      const error = new Error('Create failed');
      PDFAnnotation.create.mockRejectedValue(error);

      await saveAnnotation(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
