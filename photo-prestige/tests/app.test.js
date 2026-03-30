var request = require('supertest');
var app = require('../app');

describe('photo-prestige app', function() {
  it('renders the home page', async function() {
    var response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Photo Prestige');
  });

  it('returns API health information', async function() {
    var response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'photo-prestige-api'
    });
  });

  it('returns a placeholder login response', async function() {
    var payload = {
      email: 'test@example.com',
      password: 'secret'
    };

    var response = await request(app)
      .post('/api/v1/auth/login')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Auth login endpoint');
    expect(response.body.body).toEqual(payload);
  });
});
