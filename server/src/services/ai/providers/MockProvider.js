import { BaseProvider } from './BaseProvider.js';
import { estimateTokenCount } from '../utils/tokenLimiter.js';

export class MockProvider extends BaseProvider {
  constructor() {
    super('mock');
    this.defaultModel = 'mock-studygauge-v1';
  }

  isAvailable() {
    return true;
  }

  async generateText({ systemDirective = '', userPrompt = '', maxTokens = 1000, temperature = 0.7, signal = null }) {

    if (signal?.aborted) {
      const err = new Error('Aborted');
      err.name = 'AbortError';
      throw err;
    }

    let outputText = '';

    if (userPrompt.includes('REQUIRED JSON SCHEMA') || userPrompt.includes('"questions"')) {

      outputText = JSON.stringify(
        {
          topic: 'Sample Topic',
          subject: 'Sample Subject',
          questions: [
            {
              questionId: 'mock-q1',
              questionText: 'Which of the following best describes the core principle of this topic?',
              options: [
                'First fundamental principle rule',
                'Second alternative option',
                'Third incorrect premise',
                'Fourth unrelated statement',
              ],
              correctAnswerIndex: 0,
              explanation:
                'Option A is correct because it directly applies the fundamental formula under standard exam conditions.',
            },
            {
              questionId: 'mock-q2',
              questionText: 'What is the primary constraint to keep in mind when solving these problems?',
              options: [
                'Time efficiency and boundary checks',
                'Ignoring units',
                'Random guessing',
                'Using wrong formulas',
              ],
              correctAnswerIndex: 0,
              explanation:
                'Boundary checks and dimensional accuracy are critical for competitive exam accuracy.',
            },
          ],
        },
        null,
        2
      );
    } else if (userPrompt.includes('Task: Explain the topic')) {
      outputText = `
## Concept Explanation: Topic Breakdown

### 1. Definition & Core Formula
This topic covers fundamental principles essential for competitive exam problem-solving. Key relationship:
\\( E = m \\cdot c^2 \\) or standard proportional relations.

### 2. Step-by-Step Breakdown
- Step 1: Identify given variables and boundary constraints.
- Step 2: Apply standard simplification rules.
- Step 3: Solve for target variable while preserving precision.

### 3. Practical Exam Examples
**Example 1:** Given parameter X = 10, calculate yield Y.
- *Solution:* Substitute X into formula to yield Y = 42.

### 4. Common Exam Pitfalls
- Forgetting unit conversions before calculation.
- Overlooking boundary conditions.

### 5. Key Revision Takeaways
- Always verify units.
- Memorize core short-cut formulas for rapid solving.
`.trim();
    } else if (userPrompt.includes('Task: Generate personalized, actionable study advice')) {
      outputText = `
## Personalized AI Study Strategy

### 1. Immediate Priority Tasks (Today)
- Spend 45 minutes revising weak topic formulas.
- Complete a targeted 15-question quiz to test recall accuracy.

### 2. Weekly Strategy Adjustment
- Increase time allocation on identified weak topics by 20%.
- Maintain daily consistency with minimum 2-hour focused sessions.

### 3. Recommended Practice Focus
- Focus on PYQ practice sets under strict timed conditions.
`.trim();
    } else {
      outputText = `StudyGauge AI Assistant Response:\n\nBased on your query, here is a structured breakdown of the academic concept:\n- Key Concept 1: Core definition and theoretical framework.\n- Key Concept 2: Exam application and formula usage.\n- Key Concept 3: Recommended next practice steps.`;
    }

    const promptTokens = estimateTokenCount(userPrompt + systemDirective);
    const completionTokens = estimateTokenCount(outputText);
    const totalTokens = promptTokens + completionTokens;

    return {
      text: outputText,
      promptTokens,
      completionTokens,
      totalTokens,
      model: this.defaultModel,
    };
  }
}
