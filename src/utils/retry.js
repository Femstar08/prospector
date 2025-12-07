/**
 * Retry utilities with exponential backoff
 */
class RetryHelper {
  /**
   * Retry a function with exponential backoff
   * @param {Function} fn - Function to retry
   * @param {Object} options - Retry options
   * @returns {Promise<any>}
   */
  static async retry(fn, options = {}) {
    const {
      maxRetries = 5,
      initialDelay = 1000,
      maxDelay = 30000,
      backoffMultiplier = 2,
      onRetry = null
    } = options;

    let lastError;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Check if error is retryable
        if (!this.isRetryableError(error)) {
          throw error;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        );

        console.log(`Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        
        if (onRetry) {
          onRetry(attempt + 1, error);
        }

        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Check if an error is retryable
   */
  static isRetryableError(error) {
    // Network errors
    if (error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' || 
        error.code === 'ENOTFOUND') {
      return true;
    }

    // Rate limiting
    if (error.statusCode === 429 || error.status === 429) {
      return true;
    }

    // Server errors (5xx)
    if (error.statusCode >= 500 || error.status >= 500) {
      return true;
    }

    return false;
  }

  /**
   * Sleep for a specified duration
   */
  static sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry with timeout
   */
  static async retryWithTimeout(fn, timeout = 30000, retryOptions = {}) {
    return Promise.race([
      this.retry(fn, retryOptions),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timed out')), timeout)
      )
    ]);
  }
}

module.exports = RetryHelper;
