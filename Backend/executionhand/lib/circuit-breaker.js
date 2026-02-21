/**
 * CircuitBreaker - Track failures and pause trading when thresholds exceeded
 */
class CircuitBreaker {
  constructor(config) {
    this.config = config;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failures = [];
    this.openedAt = null;
  }

  recordFailure(error) {
    const now = Date.now();
    this.failures.push({ timestamp: now, error: error?.message || error });

    // Remove failures outside time window
    this.failures = this.failures.filter(
      f => now - f.timestamp < this.config.timeWindow * 1000
    );

    // Check threshold
    if (this.failures.length >= this.config.failureThreshold) {
      this.state = 'OPEN';
      this.openedAt = now;
      console.error('Circuit breaker OPEN', {
        failureCount: this.failures.length,
        recentErrors: this.failures.map(f => f.error)
      });
    }
  }

  recordSuccess() {
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failures = [];
      console.log('Circuit breaker CLOSED (recovered)');
    }
  }

  isOpen() {
    // Check if we should transition to HALF_OPEN
    if (this.state === 'OPEN') {
      const elapsed = Date.now() - this.openedAt;
      if (elapsed > this.config.resetTimeout * 1000) {
        this.state = 'HALF_OPEN';
        console.log('Circuit breaker HALF_OPEN (testing recovery)');
      }
    }

    return this.state === 'OPEN';
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failures.length,
      lastFailure: this.failures.length > 0 ? this.failures[this.failures.length - 1] : null
    };
  }

  reset() {
    this.state = 'CLOSED';
    this.failures = [];
    this.openedAt = null;
  }
}

module.exports = CircuitBreaker;
