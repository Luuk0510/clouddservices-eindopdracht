var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');

connectDatabase(env.mongoUri).then(function() {
  app.listen(env.port, function() {
    console.log('Target service listening on port ' + env.port);
  });
}).catch(function(error) {
  console.error('Failed to start target service', error);
  process.exit(1);
});
