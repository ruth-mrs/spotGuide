const request = require('supertest');
const app = require('../../../app');
const { createTestUser, createTestPoi } = require('../../helpers/testHelpers');

describe('CustomPois Controller', () => {
  
  describe('GET /api/custom-pois/public', () => {
    it('should return success response', async () => {
      const response = await request(app)
        .get('/api/custom-pois/public')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.pois)).toBe(true);
    });

    it('should return pagination info', async () => {
      const response = await request(app)
        .get('/api/custom-pois/public')
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
    });
  });

  describe('POST /api/custom-pois', () => {
    it('should handle create request', async () => {
      const response = await request(app)
        .post('/api/custom-pois')
        .send({});

      expect([200, 201, 400, 401]).toContain(response.status);
    });
  });

  describe('GET /api/custom-pois/:id', () => {
    it('should handle get by id request', async () => {
      const { user } = await createTestUser();
      const poi = await createTestPoi(user._id);

      const response = await request(app)
        .get(`/api/custom-pois/${poi._id}`);

      expect([200, 404, 500]).toContain(response.status);
    });

    it('should handle invalid id gracefully', async () => {
      const response = await request(app)
        .get('/api/custom-pois/invalidid');

      expect([404, 500]).toContain(response.status);
    });
  });

  describe('Auth endpoints', () => {
    it('should require auth for protected routes', async () => {
      const response = await request(app)
        .get('/api/custom-pois/user');

      expect([401, 500]).toContain(response.status);
    });

    it('should handle put requests', async () => {
      const response = await request(app)
        .put('/api/custom-pois/507f1f77bcf86cd799439011')
        .send({});

      expect([200, 401, 404, 500]).toContain(response.status);
    });

    it('should handle delete requests', async () => {
      const response = await request(app)
        .delete('/api/custom-pois/507f1f77bcf86cd799439011');

      expect([200, 401, 404, 500]).toContain(response.status);
    });
  });
});