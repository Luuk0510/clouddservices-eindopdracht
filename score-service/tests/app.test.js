var request = require('supertest');
var app = require('../app');

describe('score-service app', function() {
  it('returns score service health', async function() {
    var response = await request(app).get('/api/v1/score/health');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      version: 'v1',
      service: 'score-service'
    });
  });

  it('requires a bearer token to create a submission', async function() {
    var response = await request(app)
      .post('/api/v1/targets/target-123/submissions')
      .send({ imageUrl: 'https://example.com/image.jpg' });

    expect(response.status).toBe(401);
    expect(response.body.error.message).toBe('Missing bearer token');
  });

  it('requires imageUrl for submission requests', async function() {
    var response = await request(app)
      .post('/api/v1/targets/target-123/submissions')
      .set('Authorization', 'Bearer fake-token');

    expect(response.status).toBe(401);
  });
});
