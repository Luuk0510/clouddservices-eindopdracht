var HttpError = require('../utils/HttpError');

module.exports = function validateAuthPayload(req, res, next) {
  if (!req.body.email || !req.body.password) {
    return next(new HttpError(400, 'Email and password are required'));
  }

  next();
};
