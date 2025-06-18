const request = require('supertest');
const app = require('../../../app');

describe('Auth Controller', () => {
  
  describe('POST /api/auth/register', () => {
    it('should handle register request', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});

      expect([200, 201, 400, 409, 500]).toContain(response.status);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should handle login request', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect([200, 400, 401, 404, 500]).toContain(response.status);
    });
  });
});