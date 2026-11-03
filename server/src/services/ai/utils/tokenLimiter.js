import { AITokenLimitExceededError } from '../errors/AIError.js';

export const TASK_TOKEN_BUDGETS = {
  CONCEPT_EXPLANATION: { maxInputTokens: 3000, maxOutputTokens: 1000 },
  QUESTION_GENERATION: { maxInputTokens: 2500, maxOutputTokens: 1200 },
  STUDY_GUIDANCE: { maxInputTokens: 3500, maxOutputTokens: 1000 },
  REVISION_SUMMARY: { maxInputTokens: 4000, maxOutputTokens: 800 },
  RAG_QUERY: { maxInputTokens: 4500, maxOutputTokens: 1000 },
  GENERAL_STUDY_HELP: { maxInputTokens: 3000, maxOutputTokens: 800 },
};

export const ABSOLUTE_MAX_INPUT_TOKENS = 8000;

export function estimateTokenCount(text = '') {
  if (typeof text !== 'string') return 0;
  if (!text.trim()) return 0;
  return Math.ceil(text.length / 3.8);
}

export function enforceTokenLimits(prompt, taskType = 'GENERAL_STUDY_HELP') {
  const estimatedTokens = estimateTokenCount(prompt);
  const budget = TASK_TOKEN_BUDGETS[taskType] || TASK_TOKEN_BUDGETS.GENERAL_STUDY_HELP;

  if (estimatedTokens > ABSOLUTE_MAX_INPUT_TOKENS) {
    throw new AITokenLimitExceededError(
      `Prompt estimated tokens (${estimatedTokens}) exceed absolute maximum limit of ${ABSOLUTE_MAX_INPUT_TOKENS}`
    );
  }

  if (estimatedTokens > budget.maxInputTokens) {

    return {
      estimatedPromptTokens: estimatedTokens,
      maxOutputTokens: budget.maxOutputTokens,
      exceedsSoftBudget: true,
    };
  }

  return {
    estimatedPromptTokens: estimatedTokens,
    maxOutputTokens: budget.maxOutputTokens,
    exceedsSoftBudget: false,
  };
}

export function pruneTextToTokenLimit(text = '', maxTokens = 2000) {
  const currentTokens = estimateTokenCount(text);
  if (currentTokens <= maxTokens) return text;

  const maxCharLength = Math.floor(maxTokens * 3.8);
  return text.slice(0, maxCharLength) + '\n...[Content truncated to fit token limits]';
}
