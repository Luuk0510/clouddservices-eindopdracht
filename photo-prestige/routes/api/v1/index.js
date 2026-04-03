var express = require('express');
var createProxyMiddleware = require('http-proxy-middleware').createProxyMiddleware;
var fixRequestBody = require('http-proxy-middleware').fixRequestBody;
var router = express.Router();

function createServiceProxy(target) {
  var proxy = createProxyMiddleware({
    target: target,
    changeOrigin: true,
    proxyTimeout: 5000,
    pathRewrite: function(path, req) {
      return req._strippedPath || '/';
    },
    on: {
      proxyReq: fixRequestBody
    }
  });

  return function(req, res, next) {
    req._strippedPath = req.url;
    return proxy(req, res, next);
  };
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
var scoreServiceUrl = process.env.SCORE_SERVICE_URL || 'http://score-service:3005';

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
router.use('/targets/:targetId/submissions', createPreservedPathProxy(scoreServiceUrl));
router.use('/submissions', createPreservedPathProxy(scoreServiceUrl));
router.use('/targets/:targetId/score', createPreservedPathProxy(scoreServiceUrl));
router.use('/targets/:targetId/scores', createPreservedPathProxy(scoreServiceUrl));
router.use('/score', createPreservedPathProxy(scoreServiceUrl));
router.use('/register', createPreservedPathProxy(registerServiceUrl));
router.use('/targets', createServiceProxy(targetServiceUrl));

module.exports = router;
