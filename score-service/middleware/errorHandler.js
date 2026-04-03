module.exports = function errorHandler(error, req, res, next) {
  var statusCode = error.statusCode || 500;
  var message = error.message || 'Internal server error';

  if (error && error.name === 'ValidationError') {
    statusCode = 400;
  }

  res.status(statusCode).json({
    error: {
      message: message
    }
  });
};
