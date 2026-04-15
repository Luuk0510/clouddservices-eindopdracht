var express = require('express');

var authenticate = require('../middleware/authenticate');
var authorizeRole = require('../middleware/authorizeRole');
var targetService = require('../services/targetService');

var router = express.Router();

function sendError(res, error, fallbackStatus, fallbackMessage) {
  res.status(error.statusCode || fallbackStatus).json({
    message: error.statusCode ? error.message : fallbackMessage,
    error: error.statusCode ? undefined : error.message
  });
}

router.get('/', async function(req, res) {
  try {
    res.status(200).json(await targetService.listTargets(req.query));
  } catch (error) {
    sendError(res, error, 500, 'Failed to list targets');
  }
});

router.post('/', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var target = await targetService.createTarget(req.body, req.auth);

    res.status(201).json({
      message: 'Target created',
      target: target
    });
  } catch (error) {
    sendError(res, error, 400, 'Failed to create target');
  }
});

router.get('/:targetId', async function(req, res) {
  try {
    res.status(200).json(await targetService.getTargetWithVotes(req.params.targetId));
  } catch (error) {
    sendError(res, error, 400, 'Failed to load target');
  }
});

router.get('/:targetId/votes', async function(req, res) {
  try {
    res.status(200).json(await targetService.getTargetVotes(req.params.targetId));
  } catch (error) {
    sendError(res, error, 400, 'Failed to load votes');
  }
});

router.post('/:targetId/vote', authenticate, authorizeRole('participant'), async function(req, res) {
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
});

router.patch('/:targetId/deadline', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var target = await targetService.updateDeadline(req.params.targetId, req.body, req.auth);

    res.status(200).json({
      message: 'Deadline updated',
      target: target
    });
  } catch (error) {
    sendError(res, error, 400, 'Failed to update deadline');
  }
});

router.delete('/:targetId', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var targetId = await targetService.deleteTarget(req.params.targetId, req.auth);

    res.status(200).json({
      message: 'Target deleted',
      targetId: targetId
    });
  } catch (error) {
    sendError(res, error, 400, 'Failed to delete target');
  }
});

module.exports = router;
