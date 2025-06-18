const request = require('supertest');
const app = require('./app');

describe('SpotGuide API', () => {
  describe('App Initialization', () => {
    it('should initialize the app without errors', () => {
      expect(app).toBeDefined();
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'OK',
        message: 'SpotGuide API is running',
        environment: 'test'
      });
      expect(response.body.timestamp).toBeDefined();
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/nonexistent')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Route not found: /api/nonexistent'
      });
    });
  });
});
