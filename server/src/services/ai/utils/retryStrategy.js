import { AITimeoutError, AIRateLimitError, AIProviderError, AIError } from '../errors/AIError.js';

/**
 * Wraps an async function execution with an explicit timeout signal.
 * @param {Function} asyncFn - Function receiving signal: (signal) => Promise
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} providerName - Provider name for error reporting
 * @returns {Promise<any>}
 */
export async function withTimeout(asyncFn, timeoutMs = 15000, providerName = 'unknown') {
  const controller = new AbortController();
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(
        new AITimeoutError(`AI API request timed out after ${timeoutMs}ms`, {
          provider: providerName,
        })
      );
    }, timeoutMs);
  });

  try {
    const result = await Promise.race([asyncFn(controller.signal), timeoutPromise]);
    clearTimeout(timer);
    return result;
  } catch (error) {
    clearTimeout(timer);
    if (error.name === 'AbortError' || controller.signal?.aborted) {
      throw new AITimeoutError(`AI API request timed out after ${timeoutMs}ms`, {
        provider: providerName,
        originalError: error,
      });
    }
    throw error;
  }
}

/**
 * Checks if an error is considered retryable.
 * @param {Error} error 
 * @returns {boolean}
 */
export function isErrorRetryable(error) {
  if (error instanceof AIError) {
    return error.isRetryable;
  }

  // Network / HTTP status code inspection
  const status = error.status || error.statusCode || error.response?.status;
  if (status) {
    // 429 Rate limit, 500 Server error, 502 Bad gateway, 503 Unavailable, 504 Gateway Timeout
    if ([429, 500, 502, 503, 504].includes(status)) {
      return true;
    }
  }

  const code = error.code || error.originalError?.code;
  if (['ETIMEDOUT', 'ECONNRESET', 'ENOTFOUND', 'EPIPE', 'ECONNREFUSED'].includes(code)) {
    return true;
  }

  return false;
}

/**
 * Executes an async operation with exponential backoff retries.
 * @param {Function} operation - Async function to execute
 * @param {object} options
 * @param {number} options.maxRetries - Maximum retry attempts (default: 3)
 * @param {number} options.initialDelayMs - Initial delay in ms (default: 1000)
 * @param {number} options.maxDelayMs - Cap for delay in ms (default: 8000)
 * @param {number} options.backoffFactor - Multiplier (default: 2)
 * @param {number} options.timeoutMs - Timeout per attempt (default: 15000)
 * @param {string} options.providerName - Provider identifier
 * @param {Function} options.onRetry - Optional hook callback when retrying
 * @returns {Promise<any>}
 */
export async function executeWithRetry(operation, options = {}) {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 8000,
    backoffFactor = 2,
    timeoutMs = 15000,
    providerName = 'unknown',
    onRetry = null,
  } = options;

  let attempt = 0;
  let currentDelay = initialDelayMs;

  while (true) {
    attempt++;
    try {
      return await withTimeout(operation, timeoutMs, providerName);
    } catch (error) {
      const retryable = isErrorRetryable(error);

      if (!retryable || attempt > maxRetries) {
        // Transform generic errors into typed AI Errors if not already typed
        if (!(error instanceof AIError)) {
          const status = error.status || error.response?.status;
          if (status === 429) {
            throw new AIRateLimitError(error.message, { provider: providerName, originalError: error });
          }
          if (status === 504 || error.code === 'ETIMEDOUT') {
            throw new AITimeoutError(error.message, { provider: providerName, originalError: error });
          }
          throw new AIProviderError(error.message || 'AI request failed', {
            provider: providerName,
            originalError: error,
          });
        }
        throw error;
      }

      // Calculate jittered delay: full jitter = delay * (0.5 + Math.random() * 0.5)
      const jitter = 0.5 + Math.random() * 0.5;
      const delay = Math.min(currentDelay * jitter, maxDelayMs);

      if (typeof onRetry === 'function') {
        onRetry({ attempt, error, delay });
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      currentDelay *= backoffFactor;
    }
  }
}
