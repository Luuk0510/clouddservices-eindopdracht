var express = require('express');
var router = express.Router();

router.post('/targets/:targetId/join', function(req, res) {
  res.status(201).json({
    message: 'Register participant on target endpoint',
    targetId: req.params.targetId,
    body: req.body
  });
});

router.delete('/targets/:targetId/leave', function(req, res) {
  res.status(200).json({
    message: 'Unregister participant from target endpoint',
    targetId: req.params.targetId
  });
});

router.get('/targets/:targetId/participants', function(req, res) {
  res.status(200).json({
    message: 'List participants for target endpoint',
    targetId: req.params.targetId
  });
});

module.exports = router;
