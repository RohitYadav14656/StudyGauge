import AILog from '../../models/AILog.js';

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

export function calculateCost(provider = 'mock', model = '', promptTokens = 0, completionTokens = 0) {
  const providerRates = COST_PER_1K_TOKENS[provider] || COST_PER_1K_TOKENS.mock;
  const rates = providerRates[model] || providerRates.default || { prompt: 0, completion: 0 };

  const promptCost = (promptTokens / 1000) * rates.prompt;
  const completionCost = (completionTokens / 1000) * rates.completion;

  return Number((promptCost + completionCost).toFixed(6));
}

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

    console.error('Failed to log AI telemetry usage record:', err.message);
  }
}
