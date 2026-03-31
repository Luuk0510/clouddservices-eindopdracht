module.exports = {
  port: process.env.PORT || 3003,
  mongoUri: process.env.MONGODB_URI || 'mongodb://register-mongodb:27017/register-service',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  targetServiceUrl: process.env.TARGET_SERVICE_URL || 'http://target-service:3002',
  targetServiceTimeoutMs: parseInt(process.env.TARGET_SERVICE_TIMEOUT_MS || '5000', 10),
  eventPublishingEnabled: process.env.EVENT_PUBLISHING_ENABLED === 'true'
};
