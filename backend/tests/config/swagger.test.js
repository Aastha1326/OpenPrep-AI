const swaggerSpec = require('../../config/swagger');

describe('Swagger Documentation Configuration', () => {
  it('should generate valid OpenAPI 3.0.0 documentation spec object', () => {
    expect(swaggerSpec).toBeDefined();
    expect(swaggerSpec.openapi).toBe('3.0.0');
    expect(swaggerSpec.info.title).toBe('OpenPrep AI Backend API');
  });

  it('should contain documented paths for Academic and Study Plans', () => {
    expect(swaggerSpec.paths).toBeDefined();
    
    // Check key Academic endpoints are present
    expect(swaggerSpec.paths['/api/academic/exams']).toBeDefined();
    expect(swaggerSpec.paths['/api/academic/bundles']).toBeDefined();
    expect(swaggerSpec.paths['/api/academic/import-syllabus']).toBeDefined();
    
    // Check key Study Plans endpoints are present
    expect(swaggerSpec.paths['/api/study-plans/generate-ai']).toBeDefined();
    expect(swaggerSpec.paths['/api/study-plans/{id}/reschedule']).toBeDefined();
  });
});
