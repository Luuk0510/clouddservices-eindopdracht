var Submission = require('../models/Submission');
var env = require('../config/env');
var imaggaClient = require('./imaggaClient');
var targetServiceClient = require('./targetServiceClient');
var HttpError = require('../utils/HttpError');
var rabbitmq = require('../utils/rabbitmq');
var logger = require('../utils/logger');

function normalizeImageUrl(value) {
  return String(value || '').trim();
}

function calculateTagSimilarityScore(targetTags, submissionTags) {
  var limit = 10;
  var submissionMap = {};
  var sharedConfidence = 0;
  var sharedCount = 0;
  var i;

  for (i = 0; i < Math.min(submissionTags.length, limit); i += 1) {
    submissionMap[submissionTags[i].tag] = submissionTags[i].confidence;
  }

  for (i = 0; i < Math.min(targetTags.length, limit); i += 1) {
    if (submissionMap[targetTags[i].tag] !== undefined) {
      sharedConfidence += Math.min(targetTags[i].confidence, submissionMap[targetTags[i].tag]);
      sharedCount += 1;
    }
  }

  if (!sharedCount) {
    return 0;
  }

  return Math.round(sharedConfidence / sharedCount);
}

async function calculateScore(targetUrl, submissionUrl) {
  var targetTags = await imaggaClient.fetchTagsForImage(targetUrl);
  var submissionTags = await imaggaClient.fetchTagsForImage(submissionUrl);

  return calculateTagSimilarityScore(targetTags, submissionTags);
}

function serializeSubmission(submission) {
  return {
    submissionId: submission._id,
    targetId: submission.targetId,
    userId: submission.userId,
    userEmail: submission.userEmail,
    imageUrl: submission.imageUrl,
    similarityScore: submission.similarityScore,
    submittedAt: submission.createdAt
  };
}

function parseSubmissionUploadedMessage(message) {
  if (!message || typeof message !== 'object') {
    throw new Error('submission.uploaded.v1 message must be an object');
  }

  var targetId = String(message.targetId || '').trim();
  var submissionId = String(message.submissionId || '').trim();
  var userId = String(message.userId || '').trim();
  var imageUrl = normalizeImageUrl(message.imageUrl);
  var userEmail = String(message.userEmail || '').trim();
  var targetImageUrl = normalizeImageUrl(message.targetImageUrl);

  if (!targetId || !submissionId || !userId || !imageUrl || !targetImageUrl) {
    throw new Error('submission.uploaded.v1 message is missing required fields');
  }

  return {
    targetId: targetId,
    submissionId: submissionId,
    userId: userId,
    userEmail: userEmail,
    imageUrl: imageUrl,
    targetImageUrl: targetImageUrl
  };
}

function publishScoreCalculated(submission, sourceSubmissionId) {
  var payload = {
    scoreId: String(submission._id),
    submissionId: sourceSubmissionId,
    targetId: submission.targetId,
    userId: submission.userId,
    userEmail: submission.userEmail,
    similarityScore: submission.similarityScore,
    calculatedAt: submission.updatedAt.toISOString()
  };
  
  logger.info('score.publishing', {
    routingKey: 'score.calculated.v1',
    scoreId: payload.scoreId,
    submissionId: sourceSubmissionId,
    similarityScore: payload.similarityScore
  });
  
  rabbitmq.publish('score.calculated.v1', payload);
}

function publishWinnerCalculated(message, winnerSubmission) {
  var payload = {
    targetId: message.targetId,
    winnerSubmissionId: winnerSubmission ? String(winnerSubmission._id) : null,
    winnerUserId: winnerSubmission ? winnerSubmission.userId : null,
    similarityScore: winnerSubmission ? winnerSubmission.similarityScore : null,
    submittedAt: winnerSubmission ? winnerSubmission.createdAt.toISOString() : null,
    deadlineAt: message.deadlineAt,
    calculatedAt: new Date().toISOString()
  };

  logger.info('competition.publishing', {
    routingKey: 'competition.winner-calculated.v1',
    targetId: payload.targetId,
    winnerSubmissionId: payload.winnerSubmissionId
  });

  rabbitmq.publish('competition.winner-calculated.v1', payload);
}

async function loadOpenTarget(targetId, authToken) {
  var target = await targetServiceClient.getTargetById(targetId, authToken);

  if (!target) {
    throw new HttpError(404, 'Target not found');
  }

  var deadlineAt = new Date(target.deadlineAt);

  if (Number.isNaN(deadlineAt.getTime())) {
    throw new HttpError(502, 'Target service returned an invalid deadline');
  }

  if (target.status !== 'active' || deadlineAt.getTime() <= Date.now()) {
    throw new HttpError(409, 'Target is closed, no submissions accepted');
  }

  return target;
}

exports.createSubmission = async function createSubmission(input) {
  var target = await loadOpenTarget(input.targetId, input.authToken);
  var imageUrl = normalizeImageUrl(input.body.imageUrl);

  if (imageUrl === normalizeImageUrl(target.imageUrl)) {
    throw new HttpError(400, 'Submission must not use the exact same image URL as the target');
  }

  var similarityScore = await calculateScore(target.imageUrl, imageUrl);

  var submission = await Submission.create({
    targetId: target.targetId,
    userId: input.user.userId,
    userEmail: input.user.email || '',
    imageUrl: imageUrl,
    similarityScore: similarityScore
  });

  return {
    message: 'Submission created',
    submission: serializeSubmission(submission)
  };
};

exports.getBestScoreForUser = async function getBestScoreForUser(input) {
  var target = await targetServiceClient.getTargetById(input.targetId, input.authToken);

  if (!target) {
    throw new HttpError(404, 'Target not found');
  }

  var submission = await Submission.findOne({
    targetId: input.targetId,
    userId: input.user.userId
  }).sort({ similarityScore: -1, createdAt: 1 });

  if (!submission) {
    throw new HttpError(404, 'No submission found for this participant on this target');
  }

  return {
    targetId: input.targetId,
    userId: input.user.userId,
    score: {
      similarityScore: submission.similarityScore
    },
    submissionId: submission._id,
    submittedAt: submission.createdAt
  };
};

exports.getAllScoresForTarget = async function getAllScoresForTarget(input) {
  var target = await targetServiceClient.getTargetById(input.targetId, input.authToken);

  if (!target) {
    throw new HttpError(404, 'Target not found');
  }

  if (target.ownerId !== input.user.userId) {
    throw new HttpError(403, 'Only the target owner can view all scores');
  }

  var submissions = await Submission.find({ targetId: input.targetId }).sort({ similarityScore: -1, createdAt: 1 });

  return {
    targetId: input.targetId,
    winnerSubmissionId: submissions.length ? submissions[0]._id : null,
    scores: submissions.map(function(submission, index) {
      return {
        rank: index + 1,
        submissionId: submission._id,
        userId: submission.userId,
        userEmail: submission.userEmail,
        similarityScore: submission.similarityScore,
        submittedAt: submission.createdAt
      };
    })
  };
};

exports.deleteSubmission = async function deleteSubmission(input) {
  var submission = await Submission.findById(input.submissionId);

  if (!submission) {
    throw new HttpError(404, 'Submission not found');
  }

  if (submission.userId !== input.userId) {
    throw new HttpError(403, 'You can only delete your own upload');
  }

  await Submission.deleteOne({ _id: submission._id });

  return {
    message: 'Submission deleted',
    submissionId: submission._id
  };
};

exports.handleSubmissionUploadedEvent = async function handleSubmissionUploadedEvent(message) {
  logger.info('submission.received', {
    routingKey: 'submission.uploaded.v1',
    submissionId: message.submissionId,
    targetId: message.targetId
  });
  
  var parsed = parseSubmissionUploadedMessage(message);
  var similarityScore = await calculateScore(parsed.targetImageUrl, parsed.imageUrl);

  logger.info('score.calculated', {
    submissionId: parsed.submissionId,
    targetId: parsed.targetId,
    similarityScore: similarityScore
  });

  var submission = await Submission.findOneAndUpdate({
    sourceSubmissionId: parsed.submissionId
  }, {
    $set: {
      targetId: parsed.targetId,
      userId: parsed.userId,
      userEmail: parsed.userEmail,
      imageUrl: parsed.imageUrl,
      similarityScore: similarityScore
    },
    $setOnInsert: {
      sourceSubmissionId: parsed.submissionId
    }
  }, {
    new: true,
    upsert: true,
    setDefaultsOnInsert: true
  });

  publishScoreCalculated(submission, parsed.submissionId);

  return {
    submissionId: parsed.submissionId,
    scoreId: String(submission._id),
    similarityScore: similarityScore
  };
};

exports.handleDeadlineReachedEvent = async function handleDeadlineReachedEvent(message) {
  if (!message || !message.targetId || !message.deadlineAt) {
    throw new Error('clock.deadline-reached.v1 missing required fields');
  }

  var winnerSubmission = await Submission.findOne({
    targetId: message.targetId
  }).sort({ similarityScore: -1, createdAt: 1 });

  publishWinnerCalculated(message, winnerSubmission);

  return {
    targetId: message.targetId,
    winnerSubmissionId: winnerSubmission ? String(winnerSubmission._id) : null
  };
};
