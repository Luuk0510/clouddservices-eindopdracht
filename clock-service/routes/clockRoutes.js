var express = require('express');

var router = express.Router();

router.get('/health', function health(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'clock-service'
  });
});

module.exports = router;
