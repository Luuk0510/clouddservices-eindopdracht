var env = require('../config/env');
var HttpError = require('../utils/HttpError');

function normalizeTarget(targetId, payload) {
  if (!payload || typeof payload !== 'object') {
    throw new HttpError(502, 'Target service returned an invalid response');
  }

  return {
    targetId: payload.targetId || targetId,
    ownerId: payload.ownerId,
    deadline: payload.deadline,
    status: payload.status
  };
}

exports.getTargetById = async function getTargetById(targetId, authToken) {
  var controller = new AbortController();
  var timeoutId = setTimeout(function() {
    controller.abort();
  }, env.targetServiceTimeoutMs);

  try {
    var response = await fetch(env.targetServiceUrl + '/api/v1/targets/' + encodeURIComponent(targetId), {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + authToken
      },
      signal: controller.signal
    });

    if (response.status === 404) {
      return null;
    }

    if (response.status === 401 || response.status === 403) {
      throw new HttpError(502, 'Target service rejected the internal authorization request');
    }

    if (!response.ok) {
      throw new HttpError(502, 'Target service request failed');
    }

    var payload = await response.json();
    return normalizeTarget(targetId, payload);
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new HttpError(504, 'Target service request timed out');
    }

    if (error.statusCode) {
      throw error;
    }

    throw new HttpError(503, 'Target service is unavailable');
  } finally {
    clearTimeout(timeoutId);
  }
};
