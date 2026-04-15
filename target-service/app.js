var express = require('express');

var targetController = require('./controllers/targetController');
var targetsRouter = require('./routes/targets');
var logger = require('./utils/logger');

var app = express();

app.use(logger.requestLogger);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', targetController.health);

app.use('/', targetsRouter);

module.exports = app;
