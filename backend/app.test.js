const request = require('supertest');
const app = require('./app'); // Adjust the path if needed

// app.test.js

describe('App Initialization', () => {
    it('should initialize the app without errors', () => {
        expect(app).toBeDefined();
    });
});

describe('App Endpoints', () => {
    it('should respond with a 200 status for the root endpoint', async () => {
        const res = await request(app).get('/');
        expect(res.statusCode).toEqual(200);
        expect(res.body).toHaveProperty('message'); 
    });
});