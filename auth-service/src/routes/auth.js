var express = require('express');
var bcrypt = require('bcryptjs');
var User = require('../models/User');
var authenticate = require('../middleware/authenticate');
var authorizeRole = require('../middleware/authorizeRole');
var createToken = require('../utils/createToken');

var router = express.Router();

router.post('/register', async function(req, res) {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    var existingUser = await User.findOne({ email: req.body.email });

    if (existingUser) {
      return res.status(409).json({
        message: 'User already exists'
      });
    }

    var passwordHash = await bcrypt.hash(req.body.password, 10);

    var user = await User.create({
      email: req.body.email,
      passwordHash: passwordHash,
      role: req.body.role || 'participant'
    });

    var token = createToken(user);

    res.status(201).json({
      message: 'User registered',
      token: token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({
      message: 'Register failed',
      error: error.message
    });
  }
});

router.post('/login', async function(req, res) {
  try {
    if (!req.body.email || !req.body.password) {
      return res.status(400).json({
        message: 'Email and password are required'
      });
    }

    var user = await User.findOne({ email: req.body.email });
    var passwordMatches = user && await bcrypt.compare(req.body.password, user.passwordHash);

    if (!user || !passwordMatches) {
      return res.status(401).json({
        message: 'Invalid credentials'
      });
    }

    var token = createToken(user);

    res.status(200).json({
      message: 'Login successful',
      token: token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(400).json({
      message: 'Login failed',
      error: error.message
    });
  }
});

router.get('/me', authenticate, function(req, res) {
  res.status(200).json({
    user: {
      id: req.user._id,
      email: req.user.email,
      role: req.user.role,
      createdAt: req.user.createdAt
    }
  });
});

router.get('/users', authenticate, authorizeRole('target-owner'), async function(req, res) {
  try {
    var users = await User.find({}, 'email role createdAt').sort({ createdAt: -1 });

    res.status(200).json({
      users: users.map(function(user) {
        return {
          id: user._id,
          email: user.email,
          role: user.role,
          createdAt: user.createdAt
        };
      })
    });
  } catch (error) {
    res.status(500).json({
      message: 'Failed to load users',
      error: error.message
    });
  }
});

module.exports = router;
