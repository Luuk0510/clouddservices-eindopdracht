var express = require('express');
var env = require('../../../config/env');
var logger = require('../../../utils/logger');

var router = express.Router();

var authServiceUrl = env.authServiceUrl;
var targetServiceUrl = env.targetServiceUrl;
var registerServiceUrl = env.registerServiceUrl;
var scoreServiceUrl = env.scoreServiceUrl;
var clockServiceUrl = env.clockServiceUrl;
var mailServiceUrl = env.mailServiceUrl;
var readServiceUrl = env.readServiceUrl;

var PROXY_TIMEOUT_MS = env.gatewayProxyTimeoutMs;
var RETRY_ATTEMPTS = env.gatewayRetryAttempts;
var RETRY_DELAY_MS = env.gatewayRetryDelayMs;
var CIRCUIT_BREAKER_THRESHOLD = env.gatewayCircuitBreakerThreshold;
var CIRCUIT_BREAKER_RESET_TIMEOUT_MS = env.gatewayCircuitBreakerResetTimeoutMs;

var circuits = Object.create(null);

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

function getCircuit(serviceName) {
  if (!circuits[serviceName]) {
    circuits[serviceName] = {
      state: 'closed',
      failures: 0,
      openedAt: 0
    };
  }

  return circuits[serviceName];
}

function shouldShortCircuit(serviceName) {
  var circuit = getCircuit(serviceName);

  if (circuit.state !== 'open') {
    return false;
  }

  if ((Date.now() - circuit.openedAt) >= CIRCUIT_BREAKER_RESET_TIMEOUT_MS) {
    circuit.state = 'half-open';
    logger.info('gateway.circuit_half_open', { serviceName: serviceName });
    return false;
  }

  return true;
}

function markSuccess(serviceName) {
  var circuit = getCircuit(serviceName);
  var previousState = circuit.state;

  circuit.state = 'closed';
  circuit.failures = 0;
  circuit.openedAt = 0;

  if (previousState !== 'closed') {
    logger.info('gateway.circuit_closed', { serviceName: serviceName });
  }
}

function markFailure(serviceName, message) {
  var circuit = getCircuit(serviceName);

  if (circuit.state === 'half-open') {
    circuit.state = 'open';
    circuit.failures = CIRCUIT_BREAKER_THRESHOLD;
    circuit.openedAt = Date.now();
    logger.error('gateway.circuit_open', {
      serviceName: serviceName,
      failures: circuit.failures,
      message: message
    });
    return;
  }

  circuit.failures += 1;

  if (circuit.failures >= CIRCUIT_BREAKER_THRESHOLD) {
    circuit.state = 'open';
    circuit.openedAt = Date.now();
    logger.error('gateway.circuit_open', {
      serviceName: serviceName,
      failures: circuit.failures,
      message: message
    });
  }
}

function buildForwardHeaders(req) {
  var headers = {};
  var keys = Object.keys(req.headers || {});
  var i;

  for (i = 0; i < keys.length; i += 1) {
    var key = keys[i];

    if (key === 'host' || key === 'connection' || key === 'content-length' || key === 'transfer-encoding') {
      continue;
    }

    headers[key] = req.headers[key];
  }

  return headers;
}

function buildForwardBody(req, headers) {
  var method = String(req.method || 'GET').toUpperCase();
  var contentType = String(req.headers['content-type'] || '').toLowerCase();
  var body = req.body;

  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    return null;
  }

  if (body === undefined || body === null) {
    return null;
  }

  if (typeof body === 'string') {
    if (contentType) {
      headers['content-type'] = req.headers['content-type'];
    }
    return body;
  }

  if (typeof body === 'object' && Object.keys(body).length === 0) {
    return null;
  }

  if (contentType.indexOf('application/x-www-form-urlencoded') !== -1) {
    headers['content-type'] = 'application/x-www-form-urlencoded';
    return new URLSearchParams(body).toString();
  }

  headers['content-type'] = 'application/json';
  return JSON.stringify(body);
}

async function performForward(target, upstreamPath, req) {
  var url = new URL(upstreamPath, target);
  var headers = buildForwardHeaders(req);
  var body = buildForwardBody(req, headers);
  var controller = new AbortController();
  var timeout = setTimeout(function() {
    controller.abort();
  }, PROXY_TIMEOUT_MS);

  try {
    var response = await fetch(url, {
      method: req.method,
      headers: headers,
      body: body,
      signal: controller.signal
    });
    var contentType = String(response.headers.get('content-type') || '');
    var text = await response.text();
    var parsedBody = text;

    if (contentType.indexOf('application/json') !== -1 && text) {
      parsedBody = JSON.parse(text);
    }

    return {
      status: response.status,
      contentType: contentType,
      body: parsedBody
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Upstream request timed out');
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function isRetryableResponse(status) {
  return status >= 500;
}

async function forwardWithResilience(serviceName, target, upstreamPath, req) {
  var attempt;
  var lastResponse = null;
  var lastError = null;
  var attempts = shouldShortCircuit(serviceName) ? 0 : (getCircuit(serviceName).state === 'half-open' ? 1 : RETRY_ATTEMPTS);

  if (!attempts) {
    var blockedError = new Error(serviceName + ' circuit is open');
    blockedError.statusCode = 503;
    throw blockedError;
  }

  for (attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      var response = await performForward(target, upstreamPath, req);

      if (!isRetryableResponse(response.status)) {
        markSuccess(serviceName);
        return response;
      }

      lastResponse = response;
      markFailure(serviceName, 'Upstream returned ' + response.status);

      if (attempt < attempts) {
        logger.info('gateway.retrying', {
          serviceName: serviceName,
          attempt: attempt,
          reason: 'status_' + response.status
        });
        await sleep(RETRY_DELAY_MS);
      }
    } catch (error) {
      lastError = error;
      markFailure(serviceName, error.message);

      if (attempt < attempts) {
        logger.info('gateway.retrying', {
          serviceName: serviceName,
          attempt: attempt,
          reason: error.message
        });
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  if (lastResponse) {
    return lastResponse;
  }

  var unavailableError = new Error(lastError ? lastError.message : (serviceName + ' is unavailable'));
  unavailableError.statusCode = 503;
  throw unavailableError;
}

function writeForwardResponse(res, response) {
  if (!response.contentType || response.contentType.indexOf('application/json') !== -1) {
    res.status(response.status).json(response.body);
    return;
  }

  res.status(response.status).send(response.body);
}

function createGatewayProxy(serviceName, target, pathSelector) {
  return async function(req, res) {
    try {
      var response = await forwardWithResilience(serviceName, target, pathSelector(req), req);
      writeForwardResponse(res, response);
    } catch (error) {
      logger.error('gateway.upstream_unavailable', {
        serviceName: serviceName,
        path: req.originalUrl,
        message: error.message
      });

      res.status(error.statusCode || 503).json({
        message: serviceName + ' is unavailable'
      });
    }
  };
}

function createServiceProxy(serviceName, target) {
  return createGatewayProxy(serviceName, target, function(req) {
    return req.url;
  });
}

function createPreservedPathProxy(serviceName, target) {
  return createGatewayProxy(serviceName, target, function(req) {
    return req.originalUrl;
  });
}

router.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'api-gateway'
  });
});

router.use('/auth', createServiceProxy('auth-service', authServiceUrl));
router.use('/targets/:targetId/registrations', createPreservedPathProxy('register-service', registerServiceUrl));
router.use('/targets/:targetId/participants', createPreservedPathProxy('register-service', registerServiceUrl));
router.use('/targets/:targetId/registrations/me', createPreservedPathProxy('register-service', registerServiceUrl));
router.use('/me/registrations', createPreservedPathProxy('register-service', registerServiceUrl));
router.use('/targets/:targetId/submissions', createPreservedPathProxy('score-service', scoreServiceUrl));
router.use('/submissions', createPreservedPathProxy('score-service', scoreServiceUrl));
router.use('/targets/:targetId/score', createPreservedPathProxy('score-service', scoreServiceUrl));
router.use('/targets/:targetId/scores', createPreservedPathProxy('score-service', scoreServiceUrl));
router.use('/targets/:targetId/winner', createPreservedPathProxy('score-service', scoreServiceUrl));
router.use('/score', createPreservedPathProxy('score-service', scoreServiceUrl));
router.use('/register', createPreservedPathProxy('register-service', registerServiceUrl));
router.use('/clock', createServiceProxy('clock-service', clockServiceUrl));
router.use('/mail', createServiceProxy('mail-service', mailServiceUrl));
router.use('/read', createServiceProxy('read-service', readServiceUrl));
router.use('/targets', createServiceProxy('target-service', targetServiceUrl));

module.exports = router;
