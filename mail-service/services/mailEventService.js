var mailService = require('./mailService');
var logger = require('../utils/logger');
var MailRegistration = require('../models/MailRegistration');

exports.handleRegistrationCreatedEvent = async function handleRegistrationCreatedEvent(message) {
  if (!message || !message.userEmail || !message.targetId) {
    throw new Error('registration.created is missing required fields');
  }

  await MailRegistration.findOneAndUpdate({
    targetId: message.targetId,
    userId: message.userId
  }, {
    $set: {
      userEmail: message.userEmail,
      status: 'active',
      registeredAt: new Date()
    }
  }, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true
  });

  await mailService.sendRegistrationEmail({
    userEmail: message.userEmail,
    targetId: message.targetId,
    registrationId: message.registrationId,
    userId: message.userId
  });

  logger.info('mail.event_processed', {
    routingKey: 'registration.created',
    targetId: message.targetId,
    userEmail: message.userEmail
  });
};

exports.handleWinnerCalculatedEvent = async function handleWinnerCalculatedEvent(message) {
  var registrations = await MailRegistration.find({
    targetId: message.targetId,
    status: 'active'
  });

  for (var i = 0; i < registrations.length; i += 1) {
    await mailService.sendScoreEmail({
      to: registrations[i].userEmail,
      targetId: message.targetId,
      winnerSubmissionId: message.winnerSubmissionId,
      winnerUserId: message.winnerUserId,
      similarityScore: message.similarityScore,
      isWinner: registrations[i].userId === message.winnerUserId
    });
  }

  logger.info('mail.event_processed', {
    routingKey: 'competition.winner-calculated.v1',
    targetId: message.targetId,
    winnerSubmissionId: message.winnerSubmissionId
  });
};

exports.handleDeadlineReminderEvent = async function handleDeadlineReminderEvent(message) {
  if (!message || !message.targetId || !message.deadlineAt) {
    throw new Error('clock.deadline-reminder.v1 is missing required fields');
  }

  var registrations = await MailRegistration.find({
    targetId: message.targetId,
    status: 'active'
  });

  for (var i = 0; i < registrations.length; i += 1) {
    await mailService.sendDeadlineReminderEmail({
      to: registrations[i].userEmail,
      targetId: message.targetId,
      deadlineAt: message.deadlineAt
    });
  }

  logger.info('mail.event_processed', {
    routingKey: 'clock.deadline-reminder.v1',
    targetId: message.targetId,
    recipientCount: registrations.length
  });
};

exports.handleDeadlineReachedEvent = async function handleDeadlineReachedEvent(message) {
  if (!message || !message.targetId || !message.deadlineAt) {
    throw new Error('clock.deadline-reached.v1 is missing required fields');
  }

  var registrations = await MailRegistration.find({
    targetId: message.targetId,
    status: 'active'
  });

  for (var i = 0; i < registrations.length; i += 1) {
    await mailService.sendDeadlineClosedEmail({
      to: registrations[i].userEmail,
      targetId: message.targetId,
      deadlineAt: message.deadlineAt
    });
  }

  logger.info('mail.event_processed', {
    routingKey: 'clock.deadline-reached.v1',
    targetId: message.targetId,
    recipientCount: registrations.length
  });
};
