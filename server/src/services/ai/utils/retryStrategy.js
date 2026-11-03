import { AITimeoutError, AIRateLimitError, AIProviderError, AIError } from '../errors/AIError.js';

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

export function isErrorRetryable(error) {
  if (error instanceof AIError) {
    return error.isRetryable;
  }

  const status = error.status || error.statusCode || error.response?.status;
  if (status) {

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
