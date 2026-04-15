var Target = require('../models/Target');
var Vote = require('../models/Vote');
var rabbitmq = require('../utils/rabbitmq');

function serviceError(statusCode, message) {
  var error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function closeExpiredTargets() {
  await Target.updateMany({
    status: 'active',
    deadlineAt: { $lt: new Date() }
  }, {
    $set: { status: 'closed' }
  });
}

function parseCoordinates(latValue, lngValue) {
  var lat = Number(latValue);
  var lng = Number(lngValue);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  return {
    lat: lat,
    lng: lng
  };
}

function parseFutureDate(value, message) {
  var date = new Date(value);

  if (Number.isNaN(date.getTime()) || date <= new Date()) {
    throw serviceError(400, message);
  }

  return date;
}

async function buildVoteSummary(targetId) {
  var thumbsUp = await Vote.countDocuments({
    targetId: String(targetId),
    vote: 'up'
  });
  var thumbsDown = await Vote.countDocuments({
    targetId: String(targetId),
    vote: 'down'
  });

  return {
    targetId: String(targetId),
    thumbsUp: thumbsUp,
    thumbsDown: thumbsDown
  };
}

function applyLocationFilter(query, queryParams) {
  if (!queryParams.lat || !queryParams.lng) {
    return query;
  }

  var point = parseCoordinates(queryParams.lat, queryParams.lng);

  if (!point) {
    throw serviceError(400, 'Invalid coordinates in query');
  }

  var radiusMeters = queryParams.radiusMeters ? Number(queryParams.radiusMeters) : null;
  var radiusKm = queryParams.radiusKm ? Number(queryParams.radiusKm) : null;

  if (radiusMeters && Number.isFinite(radiusMeters)) {
    return query.where('location').near({
      center: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      },
      maxDistance: radiusMeters,
      spherical: true
    });
  }

  if (radiusKm && Number.isFinite(radiusKm)) {
    return query.where('location').near({
      center: {
        type: 'Point',
        coordinates: [point.lng, point.lat]
      },
      maxDistance: radiusKm * 1000,
      spherical: true
    });
  }

  return query;
}

async function listTargets(queryParams) {
  await closeExpiredTargets();

  var filter = {};

  if (queryParams.city) {
    filter.city = new RegExp(queryParams.city, 'i');
  }

  if (queryParams.ownerId) {
    filter.ownerId = queryParams.ownerId;
  }

  if (queryParams.active === 'true') {
    filter.status = 'active';
  }

  if (queryParams.active === 'false') {
    filter.status = 'closed';
  }

  var query = Target.find(filter).sort({ createdAt: -1 });
  query = applyLocationFilter(query, queryParams);

  var limit = queryParams.limit ? Number(queryParams.limit) : 50;
  var skip = queryParams.skip ? Number(queryParams.skip) : 0;

  if (Number.isFinite(limit) && limit > 0) {
    query.limit(Math.min(limit, 200));
  }

  if (Number.isFinite(skip) && skip >= 0) {
    query.skip(skip);
  }

  var targets = await query.exec();

  return {
    count: targets.length,
    targets: targets
  };
}

function validateCreatePayload(payload) {
  var requiredFields = ['title', 'imageUrl', 'lat', 'lng', 'deadlineAt'];

  for (var i = 0; i < requiredFields.length; i += 1) {
    if (payload[requiredFields[i]] === undefined || payload[requiredFields[i]] === null || payload[requiredFields[i]] === '') {
      throw serviceError(400, 'Missing required field: ' + requiredFields[i]);
    }
  }
}

async function createTarget(payload, auth) {
  validateCreatePayload(payload);

  var point = parseCoordinates(payload.lat, payload.lng);

  if (!point) {
    throw serviceError(400, 'Invalid coordinates');
  }

  var deadlineAt = parseFutureDate(payload.deadlineAt, 'deadlineAt must be a valid future date');
  var radiusMeters = payload.radiusMeters ? Number(payload.radiusMeters) : 250;

  if (!Number.isFinite(radiusMeters) || radiusMeters <= 0) {
    throw serviceError(400, 'radiusMeters must be a positive number');
  }

  var target = await Target.create({
    title: payload.title,
    description: payload.description || '',
    imageUrl: payload.imageUrl,
    locationDescription: payload.locationDescription || '',
    city: payload.city || '',
    location: {
      type: 'Point',
      coordinates: [point.lng, point.lat]
    },
    radiusMeters: radiusMeters,
    deadlineAt: deadlineAt,
    status: 'active',
    ownerId: auth.userId,
    ownerEmail: auth.email || ''
  });

  rabbitmq.publish('target.created.v1', {
    targetId: String(target._id),
    ownerId: target.ownerId,
    ownerEmail: target.ownerEmail,
    imageUrl: target.imageUrl,
    deadlineAt: target.deadlineAt.toISOString(),
    createdAt: target.createdAt.toISOString()
  });

  return target;
}

async function getTargetOrFail(targetId) {
  var target = await Target.findById(targetId);

  if (!target) {
    throw serviceError(404, 'Target not found');
  }

  return target;
}

async function getTargetWithVotes(targetId) {
  await closeExpiredTargets();

  var target = await getTargetOrFail(targetId);

  return {
    target: target,
    votes: await buildVoteSummary(target._id)
  };
}

async function getTargetVotes(targetId) {
  var target = await getTargetOrFail(targetId);

  return buildVoteSummary(target._id);
}

async function saveVote(targetId, payload, auth) {
  var vote = String(payload.vote || '').trim().toLowerCase();

  if (vote !== 'up' && vote !== 'down') {
    throw serviceError(400, 'vote must be up or down');
  }

  var target = await getTargetOrFail(targetId);

  await Vote.findOneAndUpdate({
    targetId: String(target._id),
    userId: auth.userId
  }, {
    $set: {
      vote: vote
    }
  }, {
    upsert: true,
    setDefaultsOnInsert: true
  });

  return {
    vote: vote,
    votes: await buildVoteSummary(target._id)
  };
}

async function updateDeadline(targetId, payload, auth) {
  var target = await getTargetOrFail(targetId);

  if (target.ownerId !== auth.userId) {
    throw serviceError(403, 'Only the owner can change the deadline');
  }

  target.deadlineAt = parseFutureDate(payload.deadlineAt, 'deadlineAt must be a valid future date');
  target.status = 'active';
  await target.save();

  return target;
}

async function deleteTarget(targetId, auth) {
  var target = await getTargetOrFail(targetId);

  if (target.ownerId !== auth.userId) {
    throw serviceError(403, 'Only the owner can delete this target');
  }

  var targetIdString = String(target._id);

  await Vote.deleteMany({ targetId: targetIdString });
  await Target.deleteOne({ _id: target._id });

  rabbitmq.publish('target.deleted.v1', {
    targetId: targetIdString,
    ownerId: target.ownerId,
    ownerEmail: target.ownerEmail,
    deletedAt: new Date().toISOString()
  });

  return targetIdString;
}

module.exports = {
  listTargets: listTargets,
  createTarget: createTarget,
  getTargetWithVotes: getTargetWithVotes,
  getTargetVotes: getTargetVotes,
  saveVote: saveVote,
  updateDeadline: updateDeadline,
  deleteTarget: deleteTarget
};
