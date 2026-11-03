import { PROMPT_TEMPLATES, SYSTEM_DIRECTIVE } from './promptTemplates.js';
import { AIError } from '../errors/AIError.js';

export function sanitizeVariable(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object') return JSON.stringify(val);
  const str = String(val);

  return str
    .replace(/<system>/gi, '')
    .replace(/<\/system>/gi, '')
    .replace(/\[SYSTEM_INSTRUCTION\]/gi, '');
}

export function buildPrompt(taskType, variables = {}) {
  const templateConfig = PROMPT_TEMPLATES[taskType];

  if (!templateConfig) {
    throw new AIError(`Unknown AI task type: '${taskType}'`, {
      statusCode: 400,
      errorType: 'INVALID_TASK_TYPE',
    });
  }

  const { systemDirective, userTemplate, requiredVariables = [] } = templateConfig;

  const missing = requiredVariables.filter((key) => variables[key] === undefined || variables[key] === null);
  if (missing.length > 0) {
    throw new AIError(`Missing required prompt variables for task ${taskType}: ${missing.join(', ')}`, {
      statusCode: 400,
      errorType: 'MISSING_PROMPT_VARIABLES',
    });
  }

  let userPrompt = userTemplate;
  Object.keys(variables).forEach((key) => {
    const value = sanitizeVariable(variables[key]);
    const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    userPrompt = userPrompt.replace(regex, value);
  });

  userPrompt = userPrompt.replace(/{{\s*\w+\s*}}/g, 'N/A');

  return {
    systemDirective: systemDirective || SYSTEM_DIRECTIVE,
    userPrompt,
    taskType,
  };
}
