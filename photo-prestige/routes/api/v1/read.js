var express = require('express');
var router = express.Router();

router.get('/contests/active', function(req, res) {
  res.status(200).json({
    message: 'List active contests endpoint'
  });
});

router.get('/contests/:contestId/status', function(req, res) {
  res.status(200).json({
    message: 'Contest status endpoint',
    contestId: req.params.contestId
  });
});

router.get('/contests/:contestId/leaderboard', function(req, res) {
  res.status(200).json({
    message: 'Contest leaderboard endpoint',
    contestId: req.params.contestId
  });
});

router.get('/targets/search', function(req, res) {
  res.status(200).json({
    message: 'Target search endpoint',
    query: req.query
  });
});

module.exports = router;
