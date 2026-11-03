import { BaseProvider } from './BaseProvider.js';
import { AIProviderError, AIRateLimitError, AITimeoutError } from '../errors/AIError.js';
import { estimateTokenCount } from '../utils/tokenLimiter.js';

export class GeminiProvider extends BaseProvider {
  constructor() {
    super('gemini');
    this.apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
    this.defaultModel = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  }

  isAvailable() {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  async generateText({ systemDirective = '', userPrompt = '', maxTokens = 1000, temperature = 0.7, signal = null }) {
    if (!this.isAvailable()) {
      throw new AIProviderError('Gemini API key is missing or not configured', {
        provider: this.name,
      });
    }

    const model = this.defaultModel;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: userPrompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: maxTokens,
        temperature: temperature,
      },
    };

    if (systemDirective) {
      payload.systemInstruction = {
        parts: [{ text: systemDirective }],
      };
    }

    let response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err) {
      if (err.name === 'AbortError' || signal?.aborted) {
        throw new AITimeoutError('Gemini API request aborted due to timeout', {
          provider: this.name,
          originalError: err,
        });
      }
      throw new AIProviderError(`Network error connecting to Gemini API: ${err.message}`, {
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
        throw new AIRateLimitError(`Gemini API rate limit exceeded (429): ${errorBody}`, {
          provider: this.name,
        });
      }
      throw new AIProviderError(`Gemini API returned status ${status}: ${errorBody}`, {
        provider: this.name,
      });
    }

    const data = await response.json();
    const candidate = data?.candidates?.[0];
    const outputText = candidate?.content?.parts?.[0]?.text || '';

    const usage = data?.usageMetadata || {};
    const promptTokens = usage.promptTokenCount || estimateTokenCount(userPrompt + systemDirective);
    const completionTokens = usage.candidatesTokenCount || estimateTokenCount(outputText);
    const totalTokens = usage.totalTokenCount || promptTokens + completionTokens;

    return {
      text: outputText,
      promptTokens,
      completionTokens,
      totalTokens,
      model,
    };
  }
}
