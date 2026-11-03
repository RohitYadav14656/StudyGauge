

export class AIError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = options.statusCode || 500;
    this.errorType = options.errorType || 'AI_ERROR';
    this.provider = options.provider || 'unknown';
    this.isRetryable = options.isRetryable ?? false;
    this.originalError = options.originalError || null;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class AITimeoutError extends AIError {
  constructor(message = 'AI request timed out', options = {}) {
    super(message, {
      statusCode: 504,
      errorType: 'TIMEOUT',
      isRetryable: true,
      ...options,
    });
  }
}

export class AIRateLimitError extends AIError {
  constructor(message = 'AI rate limit exceeded', options = {}) {
    super(message, {
      statusCode: 429,
      errorType: 'RATE_LIMIT',
      isRetryable: true,
      ...options,
    });
  }
}

export class AIProviderError extends AIError {
  constructor(message = 'AI provider failed to complete request', options = {}) {
    super(message, {
      statusCode: 502,
      errorType: 'PROVIDER_ERROR',
      isRetryable: true,
      ...options,
    });
  }
}

export class AIValidationError extends AIError {
  constructor(message = 'AI output failed structured schema validation', options = {}) {
    super(message, {
      statusCode: 422,
      errorType: 'VALIDATION_ERROR',
      isRetryable: false,
      ...options,
    });
  }
}

export class AITokenLimitExceededError extends AIError {
  constructor(message = 'Input payload exceeded maximum allowable token limit', options = {}) {
    super(message, {
      statusCode: 400,
      errorType: 'TOKEN_LIMIT_EXCEEDED',
      isRetryable: false,
      ...options,
    });
  }
}
