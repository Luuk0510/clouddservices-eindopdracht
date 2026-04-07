var Resend = require('resend').Resend;

var env = require('../config/env');
var HttpError = require('../utils/HttpError');

var client = null;

function getClient() {
  if (!env.resendApiKey) {
    throw new HttpError(500, 'Resend API key is missing');
  }

  if (!client) {
    client = new Resend(env.resendApiKey);
  }

  return client;
}

exports.sendEmail = async function sendEmail(payload) {
  var resend = getClient();
  return resend.emails.send(payload);
};
