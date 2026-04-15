var express = require('express');

var clockRoutes = require('./routes/clockRoutes');
var errorHandler = require('./middleware/errorHandler');
var notFoundHandler = require('./middleware/notFoundHandler');
var logger = require('./utils/logger');

var app = express();

app.use(logger.requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(clockRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
