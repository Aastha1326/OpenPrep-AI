const swaggerSpec = require('../../config/swagger');

describe('Swagger OpenAPI 3.0 Documentation Specification', () => {
  it('should compile valid OpenAPI 3.0.0 specification', () => {
    expect(swaggerSpec).toBeDefined();
    expect(swaggerSpec.openapi).toBe('3.0.0');
    expect(swaggerSpec.info.title).toBe('OpenPrep AI Backend API');
  });

  it('should contain complete schemas for Flashcard and Note', () => {
    const schemas = swaggerSpec.components.schemas;
    expect(schemas).toHaveProperty('Flashcard');
    expect(schemas).toHaveProperty('Note');

    // Flashcard schema assertions
    expect(schemas.Flashcard.properties).toHaveProperty('front');
    expect(schemas.Flashcard.properties).toHaveProperty('back');
    expect(schemas.Flashcard.properties).toHaveProperty('interval');
    expect(schemas.Flashcard.properties).toHaveProperty('repetitions');
    expect(schemas.Flashcard.properties).toHaveProperty('efactor');
    expect(schemas.Flashcard.properties).toHaveProperty('nextReviewDate');

    // Note schema assertions
    expect(schemas.Note.properties).toHaveProperty('title');
    expect(schemas.Note.properties).toHaveProperty('content');
    expect(schemas.Note.properties).toHaveProperty('fileUrl');
    expect(schemas.Note.properties).toHaveProperty('fileType');
    expect(schemas.Note.properties).toHaveProperty('category');
    expect(schemas.Note.properties).toHaveProperty('aiSummary');
  });

  it('should register routes for Flashcards and Notes endpoints', () => {
    const paths = swaggerSpec.paths;
    expect(paths).toBeDefined();

    // Flashcard routes
    expect(paths).toHaveProperty('/api/flashcards');
    expect(paths['/api/flashcards']).toHaveProperty('get');
    expect(paths['/api/flashcards']).toHaveProperty('post');
    expect(paths).toHaveProperty('/api/flashcards/generate-ai');
    expect(paths).toHaveProperty('/api/flashcards/generate-from-note');
    expect(paths).toHaveProperty('/api/flashcards/export');
    expect(paths).toHaveProperty('/api/flashcards/import');

    // Note routes
    expect(paths).toHaveProperty('/api/notes');
    expect(paths['/api/notes']).toHaveProperty('get');
    expect(paths['/api/notes']).toHaveProperty('post');
    expect(paths).toHaveProperty('/api/notes/voice');
    expect(paths).toHaveProperty('/api/notes/{id}/download');
    expect(paths).toHaveProperty('/api/notes/{id}/summarize');
    expect(paths).toHaveProperty('/api/notes/{id}');
  });
});
