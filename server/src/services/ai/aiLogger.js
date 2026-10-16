import AILog from '../../models/AILog.js';

/**
 * Provider Model Cost Estimates per 1,000 Tokens (in USD)
 */
const COST_PER_1K_TOKENS = {
  gemini: {
    'gemini-1.5-flash': { prompt: 0.000075, completion: 0.0003 },
    'gemini-2.0-flash': { prompt: 0.0001, completion: 0.0004 },
    default: { prompt: 0.0001, completion: 0.0004 },
  },
  openai: {
    'gpt-4o-mini': { prompt: 0.00015, completion: 0.0006 },
    'gpt-4o': { prompt: 0.0025, completion: 0.01 },
    default: { prompt: 0.0005, completion: 0.0015 },
  },
  mock: {
    default: { prompt: 0, completion: 0 },
  },
};

/**
 * Calculates estimated USD cost for a given request.
 * 
 * @param {string} provider 
 * @param {string} model 
 * @param {number} promptTokens 
 * @param {number} completionTokens 
 * @returns {number} Estimated USD cost
 */
export function calculateCost(provider = 'mock', model = '', promptTokens = 0, completionTokens = 0) {
  const providerRates = COST_PER_1K_TOKENS[provider] || COST_PER_1K_TOKENS.mock;
  const rates = providerRates[model] || providerRates.default || { prompt: 0, completion: 0 };

  const promptCost = (promptTokens / 1000) * rates.prompt;
  const completionCost = (completionTokens / 1000) * rates.completion;

  return Number((promptCost + completionCost).toFixed(6));
}

/**
 * Log AI Usage Telemetry to Database without sensitive data.
 * 
 * @param {object} params
 * @param {string} params.userId
 * @param {string} params.provider
 * @param {string} params.model
 * @param {string} params.taskType
 * @param {number} params.promptTokens
 * @param {number} params.completionTokens
 * @param {number} params.totalTokens
 * @param {number} params.latencyMs
 * @param {string} params.status - 'SUCCESS', 'FAILED', 'FALLBACK'
 * @param {string} params.errorType
 * @param {boolean} params.isFallbackUsed
 */
export async function logAIUsage(params) {
  const {
    userId = null,
    provider = 'unknown',
    model = 'unknown',
    taskType = 'GENERAL_STUDY_HELP',
    promptTokens = 0,
    completionTokens = 0,
    totalTokens = 0,
    latencyMs = 0,
    status = 'SUCCESS',
    errorType = null,
    isFallbackUsed = false,
  } = params;

  const costEstimate = calculateCost(provider, model, promptTokens, completionTokens);

  try {
    // Save to MongoDB via AILog model
    await AILog.create({
      userId,
      provider,
      model,
      taskType,
      promptTokens,
      completionTokens,
      totalTokens: totalTokens || promptTokens + completionTokens,
      latencyMs,
      status,
      errorType,
      costEstimate,
      isFallbackUsed,
    });
  } catch (err) {
    // Silent fail for logging errors to prevent breaking user workflow
    console.error('Failed to log AI telemetry usage record:', err.message);
  }
}
