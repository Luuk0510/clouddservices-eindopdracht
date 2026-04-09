module.exports = {
  port: process.env.PORT || 3004,
  mongoUri: process.env.MONGODB_URI || 'mongodb://clock-mongodb:27017/clock-service',
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672',
  deadlineReminderMinutes: Number(process.env.DEADLINE_REMINDER_MINUTES || 60),
  pollIntervalMs: Number(process.env.CLOCK_POLL_INTERVAL_MS || 5000)
};
