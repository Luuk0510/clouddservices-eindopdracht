var express = require('express');
var morgan = require('morgan');

var scoreRoutes = require('./routes/scoreRoutes');
var errorHandler = require('./middleware/errorHandler');
var notFoundHandler = require('./middleware/notFoundHandler');

var app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use(scoreRoutes);
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
