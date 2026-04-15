var targetService = require('../services/targetService');

function sendError(res, error, fallbackStatus, fallbackMessage) {
  res.status(error.statusCode || fallbackStatus).json({
    message: error.statusCode ? error.message : fallbackMessage,
    error: error.statusCode ? undefined : error.message
  });
}

exports.health = function health(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'target-service'
  });
};

exports.listTargets = async function listTargets(req, res) {
  try {
    res.status(200).json(await targetService.listTargets(req.query));
  } catch (error) {
    sendError(res, error, 500, 'Failed to list targets');
  }
};

exports.createTarget = async function createTarget(req, res) {
  try {
    var target = await targetService.createTarget(req.body, req.auth);

    res.status(201).json({
      message: 'Target created',
      target: target
    });
  } catch (error) {
    sendError(res, error, 400, 'Failed to create target');
  }
};

exports.getTarget = async function getTarget(req, res) {
  try {
    res.status(200).json(await targetService.getTargetWithVotes(req.params.targetId));
  } catch (error) {
    sendError(res, error, 400, 'Failed to load target');
  }
};

exports.getVotes = async function getVotes(req, res) {
  try {
    res.status(200).json(await targetService.getTargetVotes(req.params.targetId));
  } catch (error) {
    sendError(res, error, 400, 'Failed to load votes');
  }
};

exports.saveVote = async function saveVote(req, res) {
  try {
    var result = await targetService.saveVote(req.params.targetId, req.body, req.auth);

    res.status(200).json({
      message: 'Vote saved',
      vote: result.vote,
      votes: result.votes
    });
  } catch (error) {
    sendError(res, error, 400, 'Failed to save vote');
  }
};

exports.updateDeadline = async function updateDeadline(req, res) {
  try {
    var target = await targetService.updateDeadline(req.params.targetId, req.body, req.auth);

    res.status(200).json({
      message: 'Deadline updated',
      target: target
    });
  } catch (error) {
    sendError(res, error, 400, 'Failed to update deadline');
  }
};

exports.deleteTarget = async function deleteTarget(req, res) {
  try {
    var targetId = await targetService.deleteTarget(req.params.targetId, req.auth);

    res.status(200).json({
      message: 'Target deleted',
      targetId: targetId
    });
  } catch (error) {
    sendError(res, error, 400, 'Failed to delete target');
  }
};
