import { AIError } from '../errors/AIError.js';

/**
 * Abstract Base Provider Interface for LLM Service Abstraction Layer.
 * All concrete providers (Gemini, OpenAI, Anthropic, Mock) must extend this class.
 */
export class BaseProvider {
  constructor(name) {
    if (new.target === BaseProvider) {
      throw new Error('BaseProvider is an abstract class and cannot be instantiated directly.');
    }
    this.name = name;
  }

  /**
   * Returns whether the provider is configured and available (e.g. API keys set).
   * @returns {boolean}
   */
  isAvailable() {
    return false;
  }

  /**
   * Generates free-form text response from provider.
   * @param {object} params
   * @param {string} params.systemDirective
   * @param {string} params.userPrompt
   * @param {number} params.maxTokens
   * @param {number} params.temperature
   * @param {AbortSignal} params.signal
   * @returns {Promise<object>} { text, promptTokens, completionTokens, totalTokens, model }
   */
  async generateText(/* params */) {
    throw new AIError(`generateText method not implemented on provider '${this.name}'`, {
      provider: this.name,
    });
  }

  /**
   * Generates structured output response from provider.
   * @param {object} params
   * @returns {Promise<object>} { text, structuredData, promptTokens, completionTokens, totalTokens, model }
   */
  async generateStructured(params) {
    const result = await this.generateText(params);
    return result;
  }
}
