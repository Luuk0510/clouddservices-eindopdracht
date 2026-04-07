var env = require('../config/env');
var resendClient = require('./resendClient');
var HttpError = require('../utils/HttpError');
var logger = require('../utils/logger');
var buildRegistrationEmail = require('../templates/registrationEmail');
var buildReminderEmail = require('../templates/reminderEmail');
var buildDeadlineClosedEmail = require('../templates/deadlineClosedEmail');
var buildScoreEmail = require('../templates/scoreEmail');

function resolveRecipient(to) {
  if (env.forceTestRecipient && env.mailTestTo) {
    return env.mailTestTo;
  }

  return String(to || '').trim();
}

async function deliverMail(options) {
  var to = resolveRecipient(options.to);

  if (!to) {
    throw new HttpError(400, 'A recipient email address is required');
  }

  var response = await resendClient.sendEmail({
    from: env.mailFrom,
    to: to,
    subject: options.subject,
    text: options.text,
    html: options.html
  });

  logger.info('mail.sent', {
    to: to,
    subject: options.subject
  });

  return {
    to: to,
    subject: options.subject,
    provider: 'resend',
    id: response && response.data ? response.data.id : null
  };
}

exports.sendTestMail = async function sendTestMail(input) {
  return deliverMail({
    to: input.to || input.user.email || env.mailTestTo,
    subject: input.subject || 'Photo Prestige test email',
    text: input.text || 'This is a test email from the mail-service.',
    html: input.html || '<p>This is a test email from the mail-service.</p>'
  });
};

exports.sendRegistrationEmail = async function sendRegistrationEmail(payload) {
  var message = buildRegistrationEmail(payload);

  return deliverMail({
    to: payload.userEmail,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};

exports.sendReminderEmail = async function sendReminderEmail(payload) {
  var message = buildReminderEmail(payload);

  return deliverMail({
    to: payload.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};

exports.sendScoreEmail = async function sendScoreEmail(payload) {
  var message = buildScoreEmail(payload);

  return deliverMail({
    to: payload.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};

exports.sendDeadlineReminderEmail = async function sendDeadlineReminderEmail(payload) {
  var message = buildReminderEmail(payload);

  return deliverMail({
    to: payload.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};

exports.sendDeadlineClosedEmail = async function sendDeadlineClosedEmail(payload) {
  var message = buildDeadlineClosedEmail(payload);

  return deliverMail({
    to: payload.to,
    subject: message.subject,
    text: message.text,
    html: message.html
  });
};
