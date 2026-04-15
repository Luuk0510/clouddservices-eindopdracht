module.exports = {
  port: process.env.PORT || 3007,
  targetServiceUrl: process.env.TARGET_SERVICE_URL || 'http://target-service:3002',
  requestTimeoutMs: Number(process.env.REQUEST_TIMEOUT_MS || 5000),
  retryAttempts: Math.max(1, Number(process.env.READ_SERVICE_RETRY_ATTEMPTS || 3)),
  retryDelayMs: Number(process.env.READ_SERVICE_RETRY_DELAY_MS || 250),
  circuitBreakerThreshold: Math.max(1, Number(process.env.READ_SERVICE_CIRCUIT_BREAKER_THRESHOLD || 3)),
  circuitBreakerResetTimeoutMs: Number(process.env.READ_SERVICE_CIRCUIT_BREAKER_RESET_TIMEOUT_MS || 10000)
};
