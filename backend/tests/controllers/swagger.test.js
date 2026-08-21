const request = require('supertest');
const express = require('express');
const app = require('../../server'); // Load the main express server

describe('Swagger Documentation Router Integration tests', () => {
  const originalEnv = process.env.NODE_ENV;
  const originalSwaggerEnabled = process.env.SWAGGER_ENABLED;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    process.env.SWAGGER_ENABLED = originalSwaggerEnabled;
  });

  test('GET /api/docs returns 200 HTML content when enabled (local development fallback)', async () => {
    process.env.NODE_ENV = 'development';
    process.env.SWAGGER_ENABLED = 'false'; // development overrides this to true

    const res = await request(app)
      .get('/api/docs')
      .redirects(1); // Swagger setups often redirect /api/docs to /api/docs/

    expect(res.status).toBe(200);
    expect(res.text || '').toContain('html');
  });

  test('GET /api/docs.json returns raw OpenAPI JSON specs configuration', async () => {
    process.env.NODE_ENV = 'development';

    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.info.title).toBe('OpenPrep AI Backend API');
  });

  test('GET /api/openapi.json returns raw OpenAPI 3.1 JSON specs', async () => {
    process.env.NODE_ENV = 'development';

    const res = await request(app).get('/api/openapi.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.1.0');
    expect(res.body.info.title).toBe('OpenPrep AI Backend API');
    expect(res.body.components.securitySchemes.bearerAuth).toBeDefined();
  });

  test('GET /api/docs returns Scalar HTML with dark theme support', async () => {
    process.env.NODE_ENV = 'development';

    const res = await request(app).get('/api/docs').redirects(1);

    expect(res.status).toBe(200);
    expect(res.text || '').toContain('html');
    // Scalar renders with api-reference marker
    expect(res.text.toLowerCase()).toMatch(/scalar|api-reference/);
  });

  test('GET /api/docs returns 403 Forbidden in production environment when SWAGGER_ENABLED is not true', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SWAGGER_ENABLED = 'false';

    const res = await request(app).get('/api/docs');

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('disabled');
  });
});
