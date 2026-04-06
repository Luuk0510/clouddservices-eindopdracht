module.exports = {
  port: process.env.PORT || 3003,
  mongoUri: process.env.MONGODB_URI || 'mongodb://register-mongodb:27017/register-service',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  targetServiceUrl: process.env.TARGET_SERVICE_URL || 'http://target-service:3002',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
};
