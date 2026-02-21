/**
 * MetricsCollector - Collect and aggregate metrics
 */
class MetricsCollector {
  constructor() {
    this.metrics = {
      apiRequests: {
        total: 0,
        success: 0,
        failure: 0,
        byEndpoint: {}
      },
      quotes: {
        total: 0,
        valid: 0,
        invalid: 0,
        rejectionReasons: {}
      },
      swaps: {
        total: 0,
        success: 0,
        failure: 0,
        totalLatency: 0,
        totalSlippage: 0,
        totalGasUsed: 0
      },
      circuitBreaker: {
        activations: 0,
        currentState: 'CLOSED',
        lastActivation: null
      }
    };
  }

  recordAPIRequest(endpoint, latency, success, statusCode) {
    this.metrics.apiRequests.total++;
    if (success) {
      this.metrics.apiRequests.success++;
    } else {
      this.metrics.apiRequests.failure++;
    }

    if (!this.metrics.apiRequests.byEndpoint[endpoint]) {
      this.metrics.apiRequests.byEndpoint[endpoint] = {
        total: 0,
        success: 0,
        failure: 0,
        totalLatency: 0
      };
    }

    const endpointMetrics = this.metrics.apiRequests.byEndpoint[endpoint];
    endpointMetrics.total++;
    if (success) {
      endpointMetrics.success++;
    } else {
      endpointMetrics.failure++;
    }
    endpointMetrics.totalLatency += latency;
  }

  recordQuoteValidation(valid, reason) {
    this.metrics.quotes.total++;
    if (valid) {
      this.metrics.quotes.valid++;
    } else {
      this.metrics.quotes.invalid++;
      if (reason) {
        this.metrics.quotes.rejectionReasons[reason] = 
          (this.metrics.quotes.rejectionReasons[reason] || 0) + 1;
      }
    }
  }

  recordSwapExecution(data) {
    this.metrics.swaps.total++;
    if (data.success) {
      this.metrics.swaps.success++;
      if (data.slippage) {
        this.metrics.swaps.totalSlippage += parseFloat(data.slippage);
      }
      if (data.gasUsed) {
        this.metrics.swaps.totalGasUsed += parseInt(data.gasUsed);
      }
    } else {
      this.metrics.swaps.failure++;
    }
    if (data.latency) {
      this.metrics.swaps.totalLatency += data.latency;
    }
  }

  emitAlert(type, data) {
    console.warn(`ALERT: ${type}`, data);
    if (type === 'circuit_breaker_open') {
      this.metrics.circuitBreaker.activations++;
      this.metrics.circuitBreaker.currentState = 'OPEN';
      this.metrics.circuitBreaker.lastActivation = Date.now();
    }
  }

  getMetrics() {
    return {
      ...this.metrics,
      apiRequests: {
        ...this.metrics.apiRequests,
        successRate: this.metrics.apiRequests.total > 0
          ? (this.metrics.apiRequests.success / this.metrics.apiRequests.total * 100).toFixed(2)
          : 0
      },
      swaps: {
        ...this.metrics.swaps,
        avgLatency: this.metrics.swaps.total > 0
          ? Math.round(this.metrics.swaps.totalLatency / this.metrics.swaps.total)
          : 0,
        avgSlippage: this.metrics.swaps.success > 0
          ? (this.metrics.swaps.totalSlippage / this.metrics.swaps.success).toFixed(3)
          : 0,
        avgGasUsed: this.metrics.swaps.success > 0
          ? Math.round(this.metrics.swaps.totalGasUsed / this.metrics.swaps.success)
          : 0
      }
    };
  }
}

module.exports = MetricsCollector;
