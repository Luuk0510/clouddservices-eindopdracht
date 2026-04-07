module.exports = {
  port: process.env.PORT || 3002,
  mongoUri: process.env.MONGODB_URI || 'mongodb://mongodb:27017/photo-prestige',
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672'
};
