var express = require('express');
var router = express.Router();

router.post('/:targetId/registrations', function(req, res) {
  res.status(201).json({
    message: 'Register participant on target endpoint',
    targetId: req.params.targetId,
    body: req.body
  });
});

router.get('/:targetId/participants', function(req, res) {
  res.status(200).json({
    message: 'List participants for target endpoint',
    targetId: req.params.targetId
  });
});

router.delete('/:targetId/registrations/me', function(req, res) {
  res.status(200).json({
    message: 'Delete my registration on target endpoint',
    targetId: req.params.targetId
  });
});

module.exports = router;
