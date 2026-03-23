var express = require('express');
var router = express.Router();

var authRouter = require('./auth');
var targetRouter = require('./targets');
var registerRouter = require('./register');
var scoreRouter = require('./scores');
var myRegistrationsRouter = require('./my-registrations');
var submissionsRouter = require('./submissions');

router.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'photo-prestige-api'
  });
});

router.use('/auth', authRouter);
router.use('/targets', targetRouter);
router.use('/targets', registerRouter);
router.use('/me', myRegistrationsRouter);
router.use('/targets', scoreRouter);
router.use('/submissions', submissionsRouter);

module.exports = router;
