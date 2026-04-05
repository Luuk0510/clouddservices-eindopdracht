var HttpError = require('../utils/HttpError');

module.exports = function validateTargetId(req, res, next) {
  if (!req.params.targetId || typeof req.params.targetId !== 'string' || !req.params.targetId.trim()) {
    return next(new HttpError(400, 'targetId is required'));
  }

  next();
};
