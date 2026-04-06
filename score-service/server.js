var app = require('./app');
var connectDatabase = require('./config/database');
var env = require('./config/env');
var mongoose = require('mongoose');
var logger = require('./utils/logger');
var rabbitmq = require('./utils/rabbitmq');
var scoreService = require('./services/scoreService');

function subscribeToSubmissionUploaded() {
  rabbitmq.subscribe(
    'score-service.submission-uploaded.v1',
    'submission.uploaded.v1',
    scoreService.handleSubmissionUploadedEvent
  ).then(function() {
    logger.info('rabbitmq.subscribed', {
      queue: 'score-service.submission-uploaded.v1',
      routingKey: 'submission.uploaded.v1'
    });
  }).catch(function(error) {
    logger.error('rabbitmq.subscribe_failed', {
      queue: 'score-service.submission-uploaded.v1',
      routingKey: 'submission.uploaded.v1',
      message: error.message
    });

    setTimeout(subscribeToSubmissionUploaded, 5000);
  });
}

connectDatabase(env.mongoUri).then(function() {
  rabbitmq.connect().catch(function() {
    // reconnect is handled in utils/rabbitmq
  });

  subscribeToSubmissionUploaded();

  var server = app.listen(env.port, function() {
    logger.info('server.started', { port: env.port });
  });

  function shutdown() {
    logger.info('server.stopping');
    server.close(function() {
      rabbitmq.close().then(function() {
        mongoose.connection.close(false).then(function() {
          logger.info('server.stopped');
          process.exit(0);
        }).catch(function() {
          logger.error('server.stop_failed');
          process.exit(1);
        });
      }).catch(function(error) {
        logger.error('rabbitmq.close_failed', { message: error.message });
        mongoose.connection.close(false).then(function() {
          process.exit(1);
        });
      });
    });
  }

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}).catch(function(error) {
  logger.error('server.start_failed', {
    message: error.message
  });
  process.exit(1);
});
