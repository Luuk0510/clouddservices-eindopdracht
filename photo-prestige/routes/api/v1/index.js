var express = require('express');
var router = express.Router();

var authRouter = require('./auth');
var targetRouter = require('./targets');
var registerRouter = require('./register');
var scoreRouter = require('./scores');
var readRouter = require('./read');

router.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'photo-prestige-api'
  });
});

router.use('/auth', authRouter);
router.use('/targets', targetRouter);
router.use('/register', registerRouter);
router.use('/scores', scoreRouter);
router.use('/read', readRouter);

module.exports = router;
