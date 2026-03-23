var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
  res.status(200).json({
    message: 'List targets endpoint',
    query: req.query
  });
});

router.post('/', function(req, res) {
  res.status(201).json({
    message: 'Create target endpoint',
    body: req.body
  });
});

router.get('/:targetId', function(req, res) {
  res.status(200).json({
    message: 'Get target endpoint',
    targetId: req.params.targetId
  });
});

router.patch('/:targetId', function(req, res) {
  res.status(200).json({
    message: 'Update target endpoint',
    targetId: req.params.targetId,
    body: req.body
  });
});

router.delete('/:targetId', function(req, res) {
  res.status(200).json({
    message: 'Delete target endpoint',
    targetId: req.params.targetId
  });
});

router.post('/:targetId/votes', function(req, res) {
  res.status(201).json({
    message: 'Vote target endpoint',
    targetId: req.params.targetId,
    body: req.body
  });
});

router.get('/:targetId/votes', function(req, res) {
  res.status(200).json({
    message: 'List target votes endpoint',
    targetId: req.params.targetId
  });
});

module.exports = router;
