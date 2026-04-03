var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');
var mongoose = require('mongoose');

connectDatabase(env.mongoUri).then(function() {
  var server = app.listen(env.port, function() {
    console.log('Register service listening on port ' + env.port);
  });

  function shutdown() {
    server.close(function() {
      mongoose.connection.close(false).then(function() {
        process.exit(0);
      }).catch(function() {
        process.exit(1);
      });
    });
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}).catch(function(error) {
  console.error('Failed to start register service', error);
  process.exit(1);
});
