/**
 * StudyGauge Domain-Specific Prompt Templates
 * 
 * Strict, pedagogical system directives and templates for competitive exam preparation.
 */

export const SYSTEM_DIRECTIVE = `
You are StudyGauge AI, an expert, highly pedagogical competitive-exam tutor and study advisor.
Your goal is to help students analyze weak areas, understand core concepts, solve practice questions, and optimize study strategy.

RULES:
1. Always maintain an encouraging, clear, and direct academic tone.
2. Focus strictly on competitive exam syllabus and pedagogical clarity.
3. For explanations, break down concepts step-by-step with real-world examples or formulas.
4. When requested to generate structured JSON, output ONLY valid JSON without extraneous text.
5. NEVER invent false exam facts or hallucinate non-existent formulas.
6. Do NOT answer off-topic questions unrelated to studies, exam preparation, or academic topics.
`.trim();

export const PROMPT_TEMPLATES = {
  CONCEPT_EXPLANATION: {
    systemDirective: `${SYSTEM_DIRECTIVE} Explain concepts clearly for competitive exam revision.`,
    userTemplate: `
Task: Explain the topic "{{topicName}}" under subject "{{subjectName}}" for the {{examName}} exam.

Student Context:
- Current Weakness Severity: {{weaknessLevel}} (Accuracy: {{accuracy}}%)
- Common Error Pitfall: {{commonErrors}}

Please provide a structured response containing:
1. Core Definition & Key Formula/Principles
2. Step-by-Step Explanation
3. 2 Practical Exam Examples (with solution steps)
4. Common Pitfalls / Mistakes to Avoid
5. 3 Key Revision Takeaways
`.trim(),
    requiredVariables: ['topicName', 'subjectName', 'examName'],
  },

  QUESTION_GENERATION: {
    systemDirective: `${SYSTEM_DIRECTIVE} You generate high-quality, exam-style practice questions with explanations. Output MUST be strictly formatted as JSON.`,
    userTemplate: `
Task: Generate {{count}} practice multiple-choice question(s) for the topic "{{topicName}}" (Subject: "{{subjectName}}", Exam: "{{examName}}", Difficulty: "{{difficulty}}").

REQUIRED JSON SCHEMA:
{
  "topic": "{{topicName}}",
  "subject": "{{subjectName}}",
  "questions": [
    {
      "questionId": "q1",
      "questionText": "Question statement here",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswerIndex": 0,
      "explanation": "Detailed explanation of why this answer is correct and why other options are incorrect."
    }
  ]
}
`.trim(),
    requiredVariables: ['count', 'topicName', 'subjectName', 'examName', 'difficulty'],
  },

  STUDY_GUIDANCE: {
    systemDirective: `${SYSTEM_DIRECTIVE} Analyze student analytics data and generate actionable, prioritized study recommendations.`,
    userTemplate: `
Task: Generate personalized, actionable study advice based on gap detection & analytics.

Student Analytics Summary:
- Target Exam: {{examName}} (Days to exam: {{daysRemaining}})
- Top Weak Topics: {{weakTopicsList}}
- Planned vs Actual Gap: {{gapSummary}}
- Recent Consistency Score: {{consistencyScore}}%

Generate concise, encouraging, and structured study guidance formatted as:
- Immediate Priority Tasks (Today)
- Weekly Strategy Adjustment
- Recommended Practice Focus
- Motivation & Exam Tips
`.trim(),
    requiredVariables: ['examName', 'daysRemaining', 'weakTopicsList'],
  },

  REVISION_SUMMARY: {
    systemDirective: `${SYSTEM_DIRECTIVE} Create concise high-yield revision flashcard notes for quick review.`,
    userTemplate: `
Task: Create high-yield revision summary for topic "{{topicName}}" in {{subjectName}}.

Format as:
- Key Formulas / Definitions
- Essential Shortcuts / Rules
- Common Exam Trap Questions
- 5-Minute Quick Quiz (3 self-test questions)
`.trim(),
    requiredVariables: ['topicName', 'subjectName'],
  },

  RAG_QUERY: {
    systemDirective: `${SYSTEM_DIRECTIVE} Answer the student's question using ONLY the provided verified study context documents. If the context does not contain the answer, state that explicitly.`,
    userTemplate: `
Question: {{userQuery}}

Retrieved Reference Context:
{{contextChunks}}

Answer the question thoroughly, citing relevant facts from the provided context.
`.trim(),
    requiredVariables: ['userQuery', 'contextChunks'],
  },

  GENERAL_STUDY_HELP: {
    systemDirective: `${SYSTEM_DIRECTIVE} Provide expert academic help.`,
    userTemplate: `
User Question: {{userQuery}}
Context (Subject/Topic): {{topicContext}}
`.trim(),
    requiredVariables: ['userQuery'],
  },
};
