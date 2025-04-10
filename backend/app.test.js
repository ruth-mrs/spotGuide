const request = require('supertest');
const app = require('./app'); // Adjust the path if needed

// app.test.js

describe('App Initialization', () => {
    it('should initialize the app without errors', () => {
        expect(app).toBeDefined();
    });
});
