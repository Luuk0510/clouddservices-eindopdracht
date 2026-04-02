var express = require('express');
var createProxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;
var fixRequestBody = require('http-proxy-middleware').fixRequestBody;
var router = express.Router();

function createServiceProxy(target) {
  return createProxyMiddleware({
    target: target,
    changeOrigin: true,
    proxyTimeout: 5000,
    on: {
      proxyReq: fixRequestBody
    }
  });
}

function createPreservedPathProxy(target) {
  return createProxyMiddleware({
    target: target,
    changeOrigin: true,
    proxyTimeout: 5000,
    pathRewrite: function(path, req) {
      return req.originalUrl;
    },
    on: {
      proxyReq: fixRequestBody
    }
  });
}

var authServiceUrl = process.env.AUTH_SERVICE_URL || 'http://auth-service:3001';
var targetServiceUrl = process.env.TARGET_SERVICE_URL || 'http://target-service:3002';
var registerServiceUrl = process.env.REGISTER_SERVICE_URL || 'http://register-service:3003';
var submissionServiceUrl = process.env.SUBMISSION_SERVICE_URL || 'http://submission-service:3004';
var scoreServiceUrl = process.env.SCORE_SERVICE_URL || 'http://score-service:3005';
var readServiceUrl = process.env.READ_SERVICE_URL || 'http://read-service:3006';

router.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'api-gateway'
  });
});

router.use('/auth', createServiceProxy(authServiceUrl));
router.use('/targets/:targetId/registrations', createPreservedPathProxy(registerServiceUrl));
router.use('/targets/:targetId/participants', createPreservedPathProxy(registerServiceUrl));
router.use('/targets/:targetId/registrations/me', createPreservedPathProxy(registerServiceUrl));
router.use('/me/registrations', createPreservedPathProxy(registerServiceUrl));
router.use('/targets/:targetId/submissions', createServiceProxy(submissionServiceUrl));
router.use('/submissions', createServiceProxy(submissionServiceUrl));
router.use('/targets/:targetId/score', createServiceProxy(scoreServiceUrl));
router.use('/targets/:targetId/scores', createServiceProxy(scoreServiceUrl));
router.use('/register', createPreservedPathProxy(registerServiceUrl));
router.use('/read', createServiceProxy(readServiceUrl));
router.use('/targets', createServiceProxy(targetServiceUrl));

module.exports = router;
