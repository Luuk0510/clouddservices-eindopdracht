var env = require('../config/env');
var HttpError = require('../utils/HttpError');

function createBasicAuthHeader() {
  var token = Buffer.from(env.imaggaApiKey + ':' + env.imaggaApiSecret).toString('base64');
  return 'Basic ' + token;
}

exports.fetchTagsForImage = async function fetchTagsForImage(imageUrl) {
  try {
    var response = await fetch(
      env.imaggaApiBaseUrl + '/tags?image_url=' + encodeURIComponent(imageUrl),
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Authorization': createBasicAuthHeader()
        }
      }
    );

    if (!response.ok) {
      throw new HttpError(502, 'Imagga request failed');
    }

    var payload = await response.json();

    if (!payload || !payload.result || !Array.isArray(payload.result.tags)) {
      throw new HttpError(502, 'Imagga returned an invalid response');
    }

    return payload.result.tags.map(function(tagEntry) {
      return {
        tag: tagEntry.tag && tagEntry.tag.en ? tagEntry.tag.en : '',
        confidence: Number(tagEntry.confidence) || 0
      };
    }).filter(function(tagEntry) {
      return tagEntry.tag;
    });
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }

    throw new HttpError(503, 'Imagga is unavailable');
  }
};
