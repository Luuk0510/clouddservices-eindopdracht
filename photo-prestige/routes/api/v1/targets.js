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

router.delete('/:targetId', function(req, res) {
  res.status(200).json({
    message: 'Delete target endpoint',
    targetId: req.params.targetId
  });
});

module.exports = router;
