var authService = require('../services/authService');

exports.health = function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'auth-service'
  });
};

exports.register = async function(req, res) {
  var result = await authService.registerUser(req.body);
  res.status(201).json(result);
};

exports.login = async function(req, res) {
  var result = await authService.loginUser(req.body);
  res.status(200).json(result);
};

exports.me = function(req, res) {
  res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
};

exports.listUsers = async function(req, res) {
  var result = await authService.listUsers();
  res.status(200).json(result);
};
