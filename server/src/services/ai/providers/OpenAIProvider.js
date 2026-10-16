import { BaseProvider } from './BaseProvider.js';
import { AIProviderError, AIRateLimitError, AITimeoutError } from '../errors/AIError.js';
import { estimateTokenCount } from '../utils/tokenLimiter.js';

export class OpenAIProvider extends BaseProvider {
  constructor() {
    super('openai');
    this.apiKey = process.env.OPENAI_API_KEY || '';
    this.defaultModel = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateText({ systemDirective = '', userPrompt = '', maxTokens = 1000, temperature = 0.7, signal = null }) {
    if (!this.isAvailable()) {
      throw new AIProviderError('OpenAI API key is missing or not configured', {
        provider: this.name,
      });
    }

    const model = this.defaultModel;
    const url = 'https://api.openai.com/v1/chat/completions';

    const messages = [];
    if (systemDirective) {
      messages.push({ role: 'system', content: systemDirective });
    }
    messages.push({ role: 'user', content: userPrompt });

    const payload = {
      model,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) {
        throw new AITimeoutError('OpenAI API request aborted due to timeout', {
          provider: this.name,
          originalError: err,
        });
      }
      throw new AIProviderError(`Network error connecting to OpenAI API: ${err.message}`, {
        provider: this.name,
        originalError: err,
      });
    }

    if (!response.ok) {
      const status = response.status;
      let errorBody = '';
      try {
        errorBody = await response.text();
      } catch (_) {}

      if (status === 429) {
        throw new AIRateLimitError(`OpenAI API rate limit exceeded (429): ${errorBody}`, {
          provider: this.name,
        });
      }
      throw new AIProviderError(`OpenAI API returned status ${status}: ${errorBody}`, {
        provider: this.name,
      });
    }

    const data = await response.json();
    const outputText = data?.choices?.[0]?.message?.content || '';

    const usage = data?.usage || {};
    const promptTokens = usage.prompt_tokens || estimateTokenCount(userPrompt + systemDirective);
    const completionTokens = usage.completion_tokens || estimateTokenCount(outputText);
    const totalTokens = usage.total_tokens || promptTokens + completionTokens;

    return {
      text: outputText,
      promptTokens,
      completionTokens,
      totalTokens,
      model,
    };
  }
}
