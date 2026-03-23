var express = require('express');
var router = express.Router();

router.delete('/:submissionId', function(req, res) {
  res.status(200).json({
    message: 'Delete submission endpoint',
    submissionId: req.params.submissionId
  });
});

router.post('/:submissionId/votes', function(req, res) {
  res.status(201).json({
    message: 'Vote on submission endpoint',
    submissionId: req.params.submissionId,
    body: req.body
  });
});

module.exports = router;
