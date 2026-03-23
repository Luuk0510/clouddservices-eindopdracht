var express = require('express');
var router = express.Router();

router.get('/me', function(req, res) {
  res.status(200).json({
    message: 'List my scores endpoint'
  });
});

router.get('/targets/:targetId', function(req, res) {
  res.status(200).json({
    message: 'List target scores endpoint',
    targetId: req.params.targetId
  });
});

router.get('/submissions/:submissionId', function(req, res) {
  res.status(200).json({
    message: 'Get submission score endpoint',
    submissionId: req.params.submissionId
  });
});

router.get('/targets/:targetId/winner', function(req, res) {
  res.status(200).json({
    message: 'Get target winner endpoint',
    targetId: req.params.targetId
  });
});

module.exports = router;
