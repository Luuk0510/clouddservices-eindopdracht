var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');
var rabbitmq = require('./utils/rabbitmq');

connectDatabase(env.mongoUri).then(function() {
  // Verbind met RabbitMQ na DB-connectie (niet-blokkerend: fout wordt intern afgehandeld)
  rabbitmq.connect();

  var server = app.listen(env.port, function() {
    console.log('Register service listening on port ' + env.port);
  });

  function shutdown() {
    server.close(function() {
      rabbitmq.close().then(function() {
        process.exit(0);
      });
    });
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}).catch(function(error) {
  console.error('Failed to start register service', error);
  process.exit(1);
});
