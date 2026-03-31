var Registration = require('../models/Registration');
var TargetRegistrationState = require('../models/TargetRegistrationState');
var targetServiceClient = require('./targetServiceClient');
var eventPublisher = require('./eventPublisher');
var HttpError = require('../utils/HttpError');

function serializeRegistration(registration) {
  return {
    registrationId: registration._id,
    targetId: registration.targetId,
    userId: registration.userId,
    userEmail: registration.userEmail,
    userRole: registration.userRole,
    targetOwnerId: registration.targetOwnerId,
    targetDeadline: registration.targetDeadline,
    status: registration.status,
    registeredAt: registration.registeredAt,
    cancelledAt: registration.cancelledAt
  };
}

async function ensureTargetAllowsRegistration(targetId, authToken) {
  var target = await targetServiceClient.getTargetById(targetId, authToken);

  if (!target) {
    throw new HttpError(404, 'Target not found');
  }

  var state = await TargetRegistrationState.findOne({ targetId: targetId });
  var deadline = new Date(target.deadline);

  if (Number.isNaN(deadline.getTime())) {
    throw new HttpError(502, 'Target service returned an invalid deadline');
  }

  if (state && !state.isRegistrationOpen) {
    throw new HttpError(409, 'Registration for this target is closed');
  }

  if (target.status && ['closed', 'expired', 'archived', 'cancelled'].indexOf(String(target.status).toLowerCase()) !== -1) {
    await TargetRegistrationState.findOneAndUpdate(
      { targetId: targetId },
      {
        targetId: targetId,
        isRegistrationOpen: false,
        closedReason: 'manual-close',
        closedAt: new Date(),
        deadlineSnapshot: deadline
      },
      { upsert: true, new: true }
    );

    throw new HttpError(409, 'Registration for this target is closed');
  }

  if (deadline.getTime() <= Date.now()) {
    await TargetRegistrationState.findOneAndUpdate(
      { targetId: targetId },
      {
        targetId: targetId,
        isRegistrationOpen: false,
        closedReason: 'deadline-reached',
        closedAt: new Date(),
        deadlineSnapshot: deadline
      },
      { upsert: true, new: true }
    );

    throw new HttpError(409, 'Registration deadline has passed');
  }

  return {
    targetId: target.targetId,
    ownerId: target.ownerId,
    deadline: deadline,
    status: target.status
  };
}

exports.createRegistration = async function createRegistration(input) {
  var target = await ensureTargetAllowsRegistration(input.targetId, input.authToken);
  var existingRegistration = await Registration.findOne({
    targetId: input.targetId,
    userId: input.user.userId,
    status: 'active'
  });

  if (existingRegistration) {
    throw new HttpError(409, 'User is already registered for this target');
  }

  var registration = await Registration.create({
    targetId: input.targetId,
    userId: input.user.userId,
    userEmail: input.user.email,
    userRole: input.user.role,
    targetOwnerId: target.ownerId,
    targetDeadline: target.deadline,
    status: 'active'
  });

  await TargetRegistrationState.findOneAndUpdate(
    { targetId: input.targetId },
    {
      targetId: input.targetId,
      isRegistrationOpen: true,
      closedReason: null,
      closedAt: null,
      deadlineSnapshot: target.deadline
    },
    { upsert: true, new: true }
  );

  await eventPublisher.publishRegistrationCreated(registration);

  return {
    message: 'Registration created',
    registration: serializeRegistration(registration)
  };
};

exports.listRegistrationsForUser = async function listRegistrationsForUser(userId) {
  var registrations = await Registration.find({ userId: userId }).sort({ createdAt: -1 });

  return {
    registrations: registrations.map(serializeRegistration)
  };
};

exports.listParticipantsForTarget = async function listParticipantsForTarget(input) {
  var target = await targetServiceClient.getTargetById(input.targetId, input.authToken);

  if (!target) {
    throw new HttpError(404, 'Target not found');
  }

  if (target.ownerId !== input.user.userId) {
    throw new HttpError(403, 'Only the target owner can view participants');
  }

  var registrations = await Registration.find({
    targetId: input.targetId,
    status: 'active'
  }).sort({ registeredAt: 1 });

  return {
    targetId: input.targetId,
    participants: registrations.map(function(registration) {
      return {
        registrationId: registration._id,
        userId: registration.userId,
        userEmail: registration.userEmail,
        userRole: registration.userRole,
        registeredAt: registration.registeredAt
      };
    })
  };
};

exports.cancelRegistration = async function cancelRegistration(input) {
  var registration = await Registration.findOne({
    targetId: input.targetId,
    userId: input.userId,
    status: 'active'
  });

  if (!registration) {
    throw new HttpError(404, 'Active registration not found');
  }

  registration.status = 'cancelled';
  registration.cancelledAt = new Date();
  await registration.save();

  await eventPublisher.publishRegistrationCancelled(registration);

  return {
    message: 'Registration cancelled',
    registration: serializeRegistration(registration)
  };
};
