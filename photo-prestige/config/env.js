module.exports = {
  port: process.env.PORT || 3000,

  authServiceUrl: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
  targetServiceUrl: process.env.TARGET_SERVICE_URL || 'http://target-service:3002',
  registerServiceUrl: process.env.REGISTER_SERVICE_URL || 'http://register-service:3003',
  scoreServiceUrl: process.env.SCORE_SERVICE_URL || 'http://score-service:3005',
  clockServiceUrl: process.env.CLOCK_SERVICE_URL || 'http://clock-service:3004',
  mailServiceUrl: process.env.MAIL_SERVICE_URL || 'http://mail-service:3006',
  readServiceUrl: process.env.READ_SERVICE_URL || 'http://read-service:3007',

  gatewayProxyTimeoutMs: Number(process.env.GATEWAY_PROXY_TIMEOUT_MS || 5000),
  gatewayRetryAttempts: Math.max(1, Number(process.env.GATEWAY_RETRY_ATTEMPTS || 3)),
  gatewayRetryDelayMs: Number(process.env.GATEWAY_RETRY_DELAY_MS || 250),
  gatewayCircuitBreakerThreshold: Math.max(1, Number(process.env.GATEWAY_CIRCUIT_BREAKER_THRESHOLD || 3)),
  gatewayCircuitBreakerResetTimeoutMs: Number(process.env.GATEWAY_CIRCUIT_BREAKER_RESET_TIMEOUT_MS || 10000),

  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672',
  rabbitmqExchange: process.env.RABBITMQ_EXCHANGE || 'photo-prestige',
  rabbitmqExchangeType: process.env.RABBITMQ_EXCHANGE_TYPE || 'topic',
  rabbitmqReconnectDelayMs: Number(process.env.RABBITMQ_RECONNECT_DELAY_MS || 5000)
};
