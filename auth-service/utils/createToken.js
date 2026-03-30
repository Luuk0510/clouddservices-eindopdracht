var jwt = require('jsonwebtoken');

module.exports = function createToken(user) {
  return jwt.sign({
    userId: user._id.toString(),
    email: user.email,
    role: user.role
  }, process.env.JWT_SECRET || 'dev-secret-change-me', {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
};
