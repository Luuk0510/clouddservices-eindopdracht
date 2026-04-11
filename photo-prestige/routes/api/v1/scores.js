var express = require('express');
var router = express.Router();

router.post('/:targetId/submissions', function(req, res) {
  res.status(201).json({
    message: 'Create submission endpoint',
    targetId: req.params.targetId,
    body: req.body
  });
});

router.get('/:targetId/score', function(req, res) {
  res.status(200).json({
    message: 'Get my score on target endpoint',
    targetId: req.params.targetId
  });
});

router.get('/:targetId/scores', function(req, res) {
  res.status(200).json({
    message: 'Get all scores on target endpoint',
    targetId: req.params.targetId
  });
});

module.exports = router;
