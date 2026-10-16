import { AIValidationError } from '../errors/AIError.js';

/**
 * Extracts and cleans JSON string content from raw LLM output text.
 * Strips Markdown triple backticks (` ```json ... ``` `) and trailing commentary.
 * 
 * @param {string} rawText 
 * @returns {string} Cleaned JSON string
 */
export function cleanJsonText(rawText = '') {
  if (typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  // Strip codeblock markers
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
    cleaned = cleaned.replace(/\s*```$/i, '');
  }

  // Find first '{' or '[' and last '}' or ']'
  const firstBrace = cleaned.search(/[\{\[]/);
  const lastBrace = Math.max(cleaned.lastIndexOf('}'), cleaned.lastIndexOf(']'));

  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  return cleaned.trim();
}

/**
 * Parses raw LLM output as JSON and validates required fields or custom validator schema.
 * 
 * @param {string} rawText - Output string from LLM
 * @param {object} options
 * @param {Array<string>} options.requiredFields - Array of field names required at top-level
 * @param {Function} options.validator - Custom validation function (data) => boolean
 * @param {string} options.providerName - Provider name for error trace
 * @returns {object|Array} Parsed structured data
 */
export function parseStructuredOutput(rawText, options = {}) {
  const { requiredFields = [], validator = null, providerName = 'unknown' } = options;

  if (!rawText || typeof rawText !== 'string') {
    throw new AIValidationError('Empty or invalid output received from AI provider', {
      provider: providerName,
    });
  }

  const cleaned = cleanJsonText(rawText);
  let parsed;

  try {
    parsed = JSON.parse(cleaned);
  } catch (error) {
    throw new AIValidationError(`Failed to parse AI output as valid JSON: ${error.message}`, {
      provider: providerName,
      originalError: error,
    });
  }

  // Validate required top-level fields
  if (requiredFields.length > 0 && typeof parsed === 'object' && parsed !== null) {
    const missing = requiredFields.filter((field) => !(field in parsed));
    if (missing.length > 0) {
      throw new AIValidationError(`AI output JSON is missing required fields: ${missing.join(', ')}`, {
        provider: providerName,
      });
    }
  }

  // Custom validator function check
  if (typeof validator === 'function') {
    const isValid = validator(parsed);
    if (!isValid) {
      throw new AIValidationError('AI output failed custom validation schema check', {
        provider: providerName,
      });
    }
  }

  return parsed;
}
