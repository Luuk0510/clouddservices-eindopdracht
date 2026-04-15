/* global window, document, localStorage */

(function(window) {
  var tokenStorageKey = 'demo_jwt_token';

  function showJson(elementId, payload) {
    document.getElementById(elementId).textContent = JSON.stringify(payload, null, 2);
  }

  function decodeHtmlEntities(value) {
    return String(value || '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
  }

  function parseHtmlError(text) {
    var preMatch = String(text || '').match(/<pre>([\s\S]*?)<\/pre>/i);

    if (preMatch && preMatch[1]) {
      return decodeHtmlEntities(preMatch[1]).trim();
    }

    var titleMatch = String(text || '').match(/<title>([\s\S]*?)<\/title>/i);

    if (titleMatch && titleMatch[1]) {
      return decodeHtmlEntities(titleMatch[1]).trim();
    }

    return 'Request failed';
  }

  async function requestJson(url, options) {
    var response = await fetch(url, options);
    var contentType = String(response.headers.get('content-type') || '').toLowerCase();
    var text = await response.text();

    try {
      return {
        status: response.status,
        ok: response.ok,
        body: JSON.parse(text)
      };
    } catch (error) {
      if (contentType.indexOf('text/html') !== -1) {
        return {
          status: response.status,
          ok: response.ok,
          body: {
            message: parseHtmlError(text)
          }
        };
      }

      return {
        status: response.status,
        ok: response.ok,
        body: text
      };
    }
  }

  function getStoredToken() {
    return localStorage.getItem(tokenStorageKey) || '';
  }

  function setStoredToken(token) {
    localStorage.setItem(tokenStorageKey, token);
  }

  function clearStoredToken() {
    localStorage.removeItem(tokenStorageKey);
  }

  function getToken(manualTokenId) {
    var manualTokenElement = manualTokenId ? document.getElementById(manualTokenId) : null;
    var manualToken = manualTokenElement ? manualTokenElement.value.trim() : '';
    return manualToken || getStoredToken();
  }

  function parseJwtPayload(token) {
    try {
      var parts = String(token || '').split('.');

      if (parts.length < 2) {
        return null;
      }

      var normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      var padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
      return JSON.parse(atob(padded));
    } catch (error) {
      return null;
    }
  }

  function getCurrentRole(manualTokenId) {
    var payload = parseJwtPayload(getToken(manualTokenId));
    return payload && payload.role ? payload.role : null;
  }

  function applyRoleVisibility(manualTokenId) {
    var role = getCurrentRole(manualTokenId);
    var restricted = document.querySelectorAll('[data-role-required]');

    restricted.forEach(function(element) {
      var required = String(element.getAttribute('data-role-required') || '')
        .split(',')
        .map(function(value) { return value.trim(); })
        .filter(Boolean);

      var allowed = role && required.indexOf(role) !== -1;
      element.style.display = allowed ? '' : 'none';
    });
  }

  function buildAuthHeaders(manualTokenId) {
    var token = getToken(manualTokenId);
    var headers = {
      'Content-Type': 'application/json'
    };

    if (token) {
      headers.Authorization = 'Bearer ' + token;
    }

    return headers;
  }

  function showToken(elementId, options) {
    var settings = options || {};
    var token = getToken(settings.manualTokenId);

    if (!token) {
      document.getElementById(elementId).textContent = settings.emptyText || 'Nog geen token gevonden.';
      applyRoleVisibility(settings.manualTokenId);
      return;
    }

    showJson(elementId, { token: token });
    applyRoleVisibility(settings.manualTokenId);
  }

  function toQueryString(values) {
    var params = new URLSearchParams();

    Object.keys(values).forEach(function(key) {
      var value = String(values[key] || '').trim();
      if (value) {
        params.set(key, value);
      }
    });

    var query = params.toString();
    return query ? '?' + query : '';
  }

  function bindHealthCheck(buttonId, resultId, endpoint) {
    document.getElementById(buttonId).addEventListener('click', async function() {
      try {
        var result = await requestJson(endpoint, { method: 'GET' });
        showJson(resultId, result);
      } catch (error) {
        showJson(resultId, { error: error.message });
      }
    });
  }

  window.demoUtils = {
    showJson: showJson,
    requestJson: requestJson,
    getStoredToken: getStoredToken,
    setStoredToken: setStoredToken,
    clearStoredToken: clearStoredToken,
    getToken: getToken,
    applyRoleVisibility: applyRoleVisibility,
    buildAuthHeaders: buildAuthHeaders,
    showToken: showToken,
    toQueryString: toQueryString,
    bindHealthCheck: bindHealthCheck
  };
}(window));
