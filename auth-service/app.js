var express = require('express');
var morgan = require('morgan');

var authRouter = require('./routes/auth');

var app = express();

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get('/health', function(req, res) {
  res.status(200).json({
    status: 'ok',
    service: 'auth-service'
  });
});

app.use('/', authRouter);

module.exports = app;
