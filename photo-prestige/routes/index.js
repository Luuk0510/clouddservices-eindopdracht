var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Photo Prestige' });
});

router.get('/auth-demo', function(req, res, next) {
  res.render('auth-demo', { title: 'Auth Demo' });
});

router.get('/register-demo', function(req, res, next) {
  res.render('register-demo', { title: 'Register Demo' });
});

router.get('/score-demo', function(req, res, next) {
  res.render('score-demo', { title: 'Score Demo' });
});

router.get('/target-demo', function(req, res, next) {
  res.render('target-demo', { title: 'Target Demo' });
});

module.exports = router;
