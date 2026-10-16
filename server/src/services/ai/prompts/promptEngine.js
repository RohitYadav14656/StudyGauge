import { PROMPT_TEMPLATES, SYSTEM_DIRECTIVE } from './promptTemplates.js';
import { AIError } from '../errors/AIError.js';

/**
 * Sanitizes template variable inputs against simple prompt injection delimiters.
 * @param {any} val 
 * @returns {string}
 */
export function sanitizeVariable(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  const str = String(val);

  // Strip potential instruction injection delimiters
  return str
    .replace(/<system>/gi, '')
    .replace(/<\/system>/gi, '')
    .replace(/\[SYSTEM_INSTRUCTION\]/gi, '');
}

/**
 * Builds system directive and user prompt for a specific task type.
 * 
 * @param {string} taskType - Key from PROMPT_TEMPLATES
 * @param {object} variables - Key-value pair object matching template placeholders
 * @returns {object} { systemDirective, userPrompt, taskType }
 */
export function buildPrompt(taskType, variables = {}) {
  const templateConfig = PROMPT_TEMPLATES[taskType];

  if (!templateConfig) {
    throw new AIError(`Unknown AI task type: '${taskType}'`, {
      statusCode: 400,
      errorType: 'INVALID_TASK_TYPE',
    });
  }

  const { systemDirective, userTemplate, requiredVariables = [] } = templateConfig;

  // Validate required variables
  const missing = requiredVariables.filter((key) => variables[key] === undefined || variables[key] === null);
  if (missing.length > 0) {
    throw new AIError(`Missing required prompt variables for task ${taskType}: ${missing.join(', ')}`, {
      statusCode: 400,
      errorType: 'MISSING_PROMPT_VARIABLES',
    });
  }

  // Substitute variables
  let userPrompt = userTemplate;
  Object.keys(variables).forEach((key) => {
    const value = sanitizeVariable(variables[key]);
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    userPrompt = userPrompt.replace(regex, value);
  });

  // Clean remaining unfilled optional handlebars placeholders
  userPrompt = userPrompt.replace(/{{\s*\w+\s*}}/g, 'N/A');

  return {
    systemDirective: systemDirective || SYSTEM_DIRECTIVE,
    userPrompt,
    taskType,
  };
}
