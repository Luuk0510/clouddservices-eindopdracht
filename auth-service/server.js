var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');

connectDatabase(env.mongoUri).then(function() {
  app.listen(env.port, function() {
    console.log('Auth service listening on port ' + env.port);
  });
}).catch(function(error) {
  console.error('Failed to start auth service', error);
  process.exit(1);
});
