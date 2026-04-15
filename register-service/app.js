var express = require('express');

var registerRoutes = require('./routes/registerRoutes');
var errorHandler = require('./middleware/errorHandler');
var notFoundHandler = require('./middleware/notFoundHandler');
var logger = require('./utils/logger');

var app = express();

app.use(logger.requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    version: 'v1',
    service: 'register-service'
  });
});

app.use(registerRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
