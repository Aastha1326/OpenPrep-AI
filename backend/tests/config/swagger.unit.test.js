const swaggerSpec = require('../../config/swagger');

describe('Swagger Config Specs', () => {
  test('returns a valid OpenAPI 3.0 specification configuration object', () => {
    expect(swaggerSpec).toBeDefined();
    expect(swaggerSpec.openapi).toBe('3.0.0');
    expect(swaggerSpec.info).toBeDefined();
    expect(swaggerSpec.info.title).toBe('OpenPrep AI Backend API');
    expect(swaggerSpec.info.version).toBe('1.0.0');
    expect(swaggerSpec.paths).toBeDefined();
    expect(swaggerSpec.components).toBeDefined();
    expect(swaggerSpec.components.securitySchemes).toBeDefined();
    expect(swaggerSpec.components.securitySchemes.bearerAuth).toBeDefined();
  });
});
