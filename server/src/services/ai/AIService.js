import { GeminiProvider } from './providers/GeminiProvider.js';
import { OpenAIProvider } from './providers/OpenAIProvider.js';
import { GroqProvider } from './providers/GroqProvider.js';
import { MockProvider } from './providers/MockProvider.js';
import { buildPrompt } from './prompts/promptEngine.js';
import { enforceTokenLimits } from './utils/tokenLimiter.js';
import { executeWithRetry } from './utils/retryStrategy.js';
import { parseStructuredOutput } from './utils/structuredOutputParser.js';
import { logAIUsage } from './aiLogger.js';
import { AIError } from './errors/AIError.js';

export class AIService {
  constructor() {
    this.providers = new Map();
    this.registerProvider(new GeminiProvider());
    this.registerProvider(new OpenAIProvider());
    this.registerProvider(new GroqProvider());
    this.registerProvider(new MockProvider());
  }

  /**
   * Registers an LLM Provider implementation.
   * @param {BaseProvider} provider 
   */
  registerProvider(provider) {
    this.providers.set(provider.name, provider);
  }

  /**
   * Determines active primary provider based on config and availability.
   * @returns {BaseProvider}
   */
  getActiveProvider() {
    const preferred = (process.env.AI_PROVIDER || 'gemini').toLowerCase();
    const candidate = this.providers.get(preferred);

    if (candidate && candidate.isAvailable()) {
      return candidate;
    }

    // Fall back to any available live provider
    for (const [_, p] of this.providers) {
      if (p.name !== 'mock' && p.isAvailable()) {
        return p;
      }
    }

    // Final safety fallback: MockProvider
    return this.providers.get('mock');
  }

  /**
   * Core orchestrator method: Executes AI task with token limits, retries, timeouts, telemetry, and fallback.
   * 
   * @param {string} taskType - Registered prompt template key
   * @param {object} variables - Template variables
   * @param {object} options - Call options (userId, timeoutMs, maxRetries, etc.)
   * @returns {Promise<object>} { text, metadata }
   */
  async executeTask(taskType, variables = {}, options = {}) {
    const startTime = Date.now();
    const {
      userId = null,
      timeoutMs = Number(process.env.AI_TIMEOUT_MS) || 15000,
      maxRetries = Number(process.env.AI_MAX_RETRIES) || 3,
      temperature = 0.7,
      forceProvider = null,
    } = options;

    // 1. Build & sanitize prompt
    const { systemDirective, userPrompt } = buildPrompt(taskType, variables);

    // 2. Enforce token limits
    const { estimatedPromptTokens, maxOutputTokens } = enforceTokenLimits(userPrompt, taskType);

    // 3. Select Provider
    let provider = forceProvider ? this.providers.get(forceProvider) : this.getActiveProvider();
    if (!provider || !provider.isAvailable()) {
      provider = this.providers.get('mock');
    }

    let isFallbackUsed = provider.name === 'mock' && (process.env.AI_PROVIDER || 'gemini') !== 'mock';
    let result = null;
    let status = 'SUCCESS';
    let errorType = null;

    try {
      // 4. Execute call with retry strategy
      result = await executeWithRetry(
        (signal) =>
          provider.generateText({
            systemDirective,
            userPrompt,
            maxTokens: maxOutputTokens,
            temperature,
            signal,
          }),
        {
          maxRetries,
          timeoutMs,
          providerName: provider.name,
        }
      );
    } catch (primaryError) {
      // 5. Automatic Fallback Execution if Primary Provider Failed
      console.warn(`Primary AI provider '${provider.name}' failed. Initiating Mock Fallback. Reason: ${primaryError.message}`);
      
      const fallbackProvider = this.providers.get('mock');
      isFallbackUsed = true;
      status = 'FALLBACK';
      errorType = primaryError.errorType || primaryError.name;

      try {
        result = await fallbackProvider.generateText({
          systemDirective,
          userPrompt,
          maxTokens: maxOutputTokens,
          temperature,
        });
      } catch (fallbackError) {
        status = 'FAILED';
        const latencyMs = Date.now() - startTime;
        
        await logAIUsage({
          userId,
          provider: provider.name,
          model: provider.defaultModel || 'unknown',
          taskType,
          promptTokens: estimatedPromptTokens,
          completionTokens: 0,
          totalTokens: estimatedPromptTokens,
          latencyMs,
          status: 'FAILED',
          errorType: fallbackError.errorType || fallbackError.name,
          isFallbackUsed: true,
        });

        throw fallbackError;
      }
    }

    const latencyMs = Date.now() - startTime;

    // 6. Log Anonymized Telemetry (NO prompt/response text!)
    await logAIUsage({
      userId,
      provider: provider.name,
      model: result.model,
      taskType,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      totalTokens: result.totalTokens,
      latencyMs,
      status,
      errorType,
      isFallbackUsed,
    });

    return {
      text: result.text,
      metadata: {
        provider: provider.name,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
        latencyMs,
        isFallbackUsed,
      },
    };
  }

  /**
   * Executes AI task and returns validated structured JSON object.
   * 
   * @param {string} taskType 
   * @param {object} variables 
   * @param {object} schemaOptions - { requiredFields, validator }
   * @param {object} options 
   * @returns {Promise<object>} { data, metadata }
   */
  async executeStructuredTask(taskType, variables = {}, schemaOptions = {}, options = {}) {
    const rawResult = await this.executeTask(taskType, variables, options);

    const data = parseStructuredOutput(rawResult.text, {
      ...schemaOptions,
      providerName: rawResult.metadata.provider,
    });

    return {
      data,
      metadata: rawResult.metadata,
    };
  }

  // --- Domain-Specific Convenience Service API ---

  async explainWeakTopic({ topicName, subjectName, examName, weaknessLevel = 'WEAK', accuracy = 40, commonErrors = 'Conceptual confusion', userId }) {
    return this.executeTask(
      'CONCEPT_EXPLANATION',
      { topicName, subjectName, examName, weaknessLevel, accuracy, commonErrors },
      { userId }
    );
  }

  async generatePracticeQuestions({ topicName, subjectName, examName, count = 2, difficulty = 'Medium', userId }) {
    return this.executeStructuredTask(
      'QUESTION_GENERATION',
      { count, topicName, subjectName, examName, difficulty },
      { requiredFields: ['questions'] },
      { userId }
    );
  }

  async generateStudyAdvice({ examName, daysRemaining, weakTopicsList, gapSummary, consistencyScore, userId }) {
    return this.executeTask(
      'STUDY_GUIDANCE',
      { examName, daysRemaining, weakTopicsList, gapSummary, consistencyScore },
      { userId }
    );
  }

  async generateRevisionSummary({ topicName, subjectName, userId }) {
    return this.executeTask(
      'REVISION_SUMMARY',
      { topicName, subjectName },
      { userId }
    );
  }

  async answerStudyQuestion({ userQuery, topicContext = 'General', userId }) {
    return this.executeTask(
      'GENERAL_STUDY_HELP',
      { userQuery, topicContext },
      { userId }
    );
  }
}

// Singleton instance export
const aiService = new AIService();
export default aiService;
