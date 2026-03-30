jest.mock('http-proxy-middleware', function() {
  return {
    createProxyMiddleware: function(options) {
      return function(req, res) {
        res.status(200).json({
          proxiedTo: options.target,
          path: req.originalUrl,
          method: req.method,
          body: req.body
        });
      };
    },
    fixRequestBody: function() {}
  };
});

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

    expect(response.status).toBe(300);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'api-gateway'
    });
  });

  it('proxies login requests to the auth service', async function() {
    var payload = {
      email: 'test@example.com',
      password: 'secret'
    };

    var response = await request(app)
      .post('/api/v1/auth/login')
      .send(payload);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://auth-service:3001',
      path: '/api/v1/auth/login',
      method: 'POST',
      body: payload
    });
  });
});
