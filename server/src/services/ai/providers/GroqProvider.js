import { BaseProvider } from './BaseProvider.js';
import { AIProviderError, AIRateLimitError, AITimeoutError } from '../errors/AIError.js';
import { estimateTokenCount } from '../utils/tokenLimiter.js';

export class GroqProvider extends BaseProvider {
  constructor() {
    super('groq');
    this.apiKey = process.env.GROQ_API_KEY || '';
    this.defaultModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateText({ systemDirective = '', userPrompt = '', maxTokens = 1000, temperature = 0.7, signal = null }) {
    if (!this.isAvailable()) {
      throw new AIProviderError('Groq API key is missing or not configured', {
        provider: this.name,
      });
    }

    const model = this.defaultModel;
    const url = 'https://api.groq.com/openai/v1/chat/completions';

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
        throw new AITimeoutError('Groq API request aborted due to timeout', {
          provider: this.name,
          originalError: err,
        });
      }
      throw new AIProviderError(`Network error connecting to Groq API: ${err.message}`, {
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
        throw new AIRateLimitError(`Groq API rate limit exceeded (429): ${errorBody}`, {
          provider: this.name,
        });
      }
      throw new AIProviderError(`Groq API returned status ${status}: ${errorBody}`, {
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
