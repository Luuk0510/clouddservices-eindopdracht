var express = require('express');
var router = express.Router();

router.post('/register', function(req, res) {
  res.status(201).json({
    message: 'Auth register endpoint',
    body: req.body
  });
});

router.post('/login', function(req, res) {
  res.status(200).json({
    message: 'Auth login endpoint',
    body: req.body
  });
});

router.post('/refresh', function(req, res) {
  res.status(200).json({
    message: 'Auth refresh endpoint'
  });
});

router.post('/logout', function(req, res) {
  res.status(200).json({
    message: 'Auth logout endpoint'
  });
});

router.get('/me', function(req, res) {
  res.status(200).json({
    message: 'Auth profile endpoint'
  });
});

module.exports = router;
