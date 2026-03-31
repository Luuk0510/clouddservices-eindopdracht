var env = require('../config/env');

exports.publishRegistrationCreated = async function publishRegistrationCreated(registration) {
  if (!env.eventPublishingEnabled) {
    return;
  }

  console.log('registration.created.v1', {
    registrationId: registration.id,
    targetId: registration.targetId,
    userId: registration.userId
  });
};

exports.publishRegistrationCancelled = async function publishRegistrationCancelled(registration) {
  if (!env.eventPublishingEnabled) {
    return;
  }

  console.log('registration.cancelled.v1', {
    registrationId: registration.id,
    targetId: registration.targetId,
    userId: registration.userId
  });
};
