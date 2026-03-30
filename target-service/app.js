var express = require('express');
var morgan = require('morgan');

var targetsRouter = require('./routes/targets');

var app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'target-service'
  });
});

app.use('/', targetsRouter);

module.exports = app;
