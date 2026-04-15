var http = require('http');
var https = require('https');
var URL = require('url').URL;

var env = require('../config/env');

var circuit = {
  state: 'closed',
  failures: 0,
  openedAt: 0
};

var FORWARDED_QUERY_KEYS = [
  'city',
  'ownerId',
  'lat',
  'lng',
  'radiusMeters',
  'radiusKm',
  'limit',
  'skip'
];

function buildTargetListUrl(query) {
  var url = new URL(env.targetServiceUrl);

  url.pathname = '/';
  url.searchParams.set('active', 'true');

  FORWARDED_QUERY_KEYS.forEach(function(key) {
    if (query[key] !== undefined && query[key] !== null && String(query[key]).trim() !== '') {
      url.searchParams.set(key, String(query[key]));
    }
  });

  return url;
}

function sleep(ms) {
  return new Promise(function(resolve) {
    setTimeout(resolve, ms);
  });
}

function shouldShortCircuit() {
  if (circuit.state !== 'open') {
    return false;
  }

  if ((Date.now() - circuit.openedAt) >= env.circuitBreakerResetTimeoutMs) {
    circuit.state = 'half-open';
    return false;
  }

  return true;
}

function markSuccess() {
  circuit.state = 'closed';
  circuit.failures = 0;
  circuit.openedAt = 0;
}

function markFailure() {
  if (circuit.state === 'half-open') {
    circuit.state = 'open';
    circuit.failures = env.circuitBreakerThreshold;
    circuit.openedAt = Date.now();
    return;
  }

  circuit.failures += 1;

  if (circuit.failures >= env.circuitBreakerThreshold) {
    circuit.state = 'open';
    circuit.openedAt = Date.now();
  }
}

function isRetryableError(error) {
  return !error.statusCode || error.statusCode >= 500;
}

function requestJsonOnce(url) {
  return new Promise(function(resolve, reject) {
    var transport = url.protocol === 'https:' ? https : http;
    var req = transport.request(url, {
      method: 'GET',
      headers: {
        Accept: 'application/json'
      }
    }, function(res) {
      var body = '';

      res.setEncoding('utf8');
      res.on('data', function(chunk) {
        body += chunk;
      });

      res.on('end', function() {
        var payload = {};

        if (body) {
          try {
            payload = JSON.parse(body);
          } catch (error) {
            var parseError = new Error('Target service returned invalid JSON');
            parseError.statusCode = 502;
            reject(parseError);
            return;
          }
        }

        if (res.statusCode >= 400) {
          var upstreamError = new Error(payload.message || 'Target service request failed');
          upstreamError.statusCode = res.statusCode >= 500 ? 502 : res.statusCode;
          reject(upstreamError);
          return;
        }

        resolve(payload);
      });
    });

    req.setTimeout(env.requestTimeoutMs, function() {
      req.destroy(new Error('Target service request timed out'));
    });

    req.on('error', function(error) {
      var requestError = new Error(error.message || 'Failed to reach target service');
      requestError.statusCode = 502;
      reject(requestError);
    });

    req.end();
  });
}

async function requestJson(url) {
  if (shouldShortCircuit()) {
    var circuitError = new Error('Target service circuit is open');
    circuitError.statusCode = 503;
    throw circuitError;
  }

  var attempts = circuit.state === 'half-open' ? 1 : env.retryAttempts;
  var lastError;
  var attempt;

  for (attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      var payload = await requestJsonOnce(url);
      markSuccess();
      return payload;
    } catch (error) {
      lastError = error;
      markFailure();

      if (!isRetryableError(error) || attempt >= attempts) {
        throw error;
      }

      await sleep(env.retryDelayMs);
    }
  }

  throw lastError;
}

function normalizeContest(target) {
  var contestId = target.targetId || target.id || target._id;
  var deadlineAt = target.deadlineAt ? new Date(target.deadlineAt) : null;
  var timeRemainingSeconds = null;

  if (deadlineAt && !Number.isNaN(deadlineAt.getTime())) {
    timeRemainingSeconds = Math.max(0, Math.floor((deadlineAt.getTime() - Date.now()) / 1000));
  }

  return {
    contestId: contestId ? String(contestId) : '',
    title: target.title || '',
    description: target.description || '',
    city: target.city || '',
    locationDescription: target.locationDescription || '',
    imageUrl: target.imageUrl || '',
    deadlineAt: target.deadlineAt || null,
    createdAt: target.createdAt || null,
    status: target.status || 'active',
    ownerId: target.ownerId || '',
    radiusMeters: target.radiusMeters || null,
    timeRemainingSeconds: timeRemainingSeconds
  };
}

function isStillActive(contest) {
  if (contest.status !== 'active' || !contest.deadlineAt) {
    return false;
  }

  var deadlineAt = new Date(contest.deadlineAt);

  return !Number.isNaN(deadlineAt.getTime()) && deadlineAt.getTime() > Date.now();
}

exports.listActiveContests = async function listActiveContests(query) {
  var payload = await requestJson(buildTargetListUrl(query || {}));
  var targets = Array.isArray(payload.targets) ? payload.targets : [];
  var contests = targets
    .map(normalizeContest)
    .filter(isStillActive);

  return {
    count: contests.length,
    contests: contests
  };
};
