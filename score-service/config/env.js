module.exports = {
  port: process.env.PORT || 3005,
  mongoUri: process.env.MONGODB_URI || 'mongodb://score-mongodb:27017/score-service',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  targetServiceUrl: process.env.TARGET_SERVICE_URL || 'http://target-service:3002',
  imaggaApiKey: process.env.IMAGGA_API_KEY || '',
  imaggaApiSecret: process.env.IMAGGA_API_SECRET || '',
  imaggaApiBaseUrl: process.env.IMAGGA_API_BASE_URL || 'https://api.imagga.com/v2'
};
