var express = require('express');

var readRoutes = require('./routes/readRoutes');
var logger = require('./utils/logger');

var app = express();

app.use(logger.requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(readRoutes);

module.exports = app;
