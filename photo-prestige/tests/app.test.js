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

  it('renders the auth demo page', async function() {
    var response = await request(app).get('/auth-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Auth Demo');
  });

  it('renders the register demo page', async function() {
    var response = await request(app).get('/register-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Register Demo');
  });

  it('renders the score demo page', async function() {
    var response = await request(app).get('/score-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Score Demo');
  });

  it('renders the target demo page', async function() {
    var response = await request(app).get('/target-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Target Demo');
  });

  it('renders the read demo page', async function() {
    var response = await request(app).get('/read-demo');

    expect(response.status).toBe(200);
    expect(response.text).toContain('Read Demo');
  });

  it('returns API health information', async function() {
    var response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
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

  it('proxies registration routes to the register service', async function() {
    var response = await request(app)
      .get('/api/v1/me/registrations');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://register-service:3003',
      path: '/api/v1/me/registrations',
      method: 'GET',
      body: {}
    });
  });

  it('proxies score routes to the score service', async function() {
    var response = await request(app)
      .get('/api/v1/targets/target-123/score');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://score-service:3005',
      path: '/api/v1/targets/target-123/score',
      method: 'GET',
      body: {}
    });
  });

  it('proxies winner routes to the score service', async function() {
    var response = await request(app)
      .get('/api/v1/targets/target-123/winner');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://score-service:3005',
      path: '/api/v1/targets/target-123/winner',
      method: 'GET',
      body: {}
    });
  });

  it('proxies target routes to the target service', async function() {
    var response = await request(app)
      .get('/api/v1/targets');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://target-service:3002',
      path: '/api/v1/targets',
      method: 'GET',
      body: {}
    });
  });

  it('proxies read routes to the read service', async function() {
    var response = await request(app)
      .get('/api/v1/read/contests/active?city=Eindhoven');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      proxiedTo: 'http://read-service:3006',
      path: '/api/v1/read/contests/active?city=Eindhoven',
      method: 'GET',
      body: {}
    });
  });

  it('renders the error page for unknown routes', async function() {
    var response = await request(app).get('/this-route-does-not-exist');

    expect(response.status).toBe(404);
    expect(response.text).toContain('Not Found');
  });
});
