# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- StudyGauge AI Subsystem Architecture (`server/src/services/ai/AIService.js`).
- Modular LLM Service Abstraction layer with Pluggable Adapter Pattern (`BaseProvider`, `GeminiProvider`, `OpenAIProvider`, `MockProvider`).
- Strict server-side API execution ensuring zero exposure of AI API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`) to React frontend.
- Centralized Prompt Template Engine (`promptTemplates.js` and `promptEngine.js`) with domain-specific pedagogical directives and injection sanitization (`sanitizeVariable`).
- Token Limiter & Context Budget Control (`tokenLimiter.js`) with task-specific token budgets and hard safety caps (`ABSOLUTE_MAX_INPUT_TOKENS = 8000`).
- Custom AI Error Hierarchy (`AIError`, `AITimeoutError`, `AIRateLimitError`, `AIProviderError`, `AIValidationError`, `AITokenLimitExceededError`).
- Reliability engine featuring exponential backoff retries with full jitter, AbortController timeouts (`withTimeout`), and automatic failover to `MockProvider`.
- Anonymized AI Usage & Telemetry Logger (`AILog` Mongoose schema & `aiLogger.js`) enforcing strict data privacy by logging operational telemetry (tokens, latency, status, estimated cost) without storing user prompts or completion text.
- Structured output parser (`structuredOutputParser.js`) with Markdown codeblock stripping and schema validation.
- Express API endpoints (`POST /api/ai/explain`, `POST /api/ai/questions`, `POST /api/ai/study-advice`, `POST /api/ai/ask`, `GET /api/ai/usage-stats`) under protected Express router (`aiRoutes.js`).
- Complete technical documentation in `docs/AI_SUBSYSTEM_ARCHITECTURE.md`.
- Automated test suite in `server/tests/aiSubsystem.test.js` (23/23 tests passing).
- Adaptive Planning Engine comparing `PLANNED ACTIVITY` vs `ACTUAL ACTIVITY`.
- 5 gap detection categories: `missedTasks`, `partiallyCompletedTasks`, `completedTasks`, `decliningPerformanceTopics`, and `overdueRevisions`.
- Tracking fields in `StudyPlanItem` schema (`rescheduleCount`, `originalDate`, `adaptationReason`, `isProtectedRevision`).
- Workload & pedagogical rule enforcement: daily study hours limit, weak topic priority ordering, target exam date deadline boundary, dedicated protected revision time allocation (~25% daily quota), and postponement prevention (`rescheduleCount >= 2` locked into earliest available slot with `high` priority).
- Analysis API endpoint `GET /api/study-plans/:planId/adapt/analysis` and adaptation endpoint `POST /api/study-plans/:planId/adapt`.
- Technical documentation in `docs/ADAPTIVE_PLANNING_ENGINE.md`.
- Integration test suite in `server/tests/adaptivePlanner.test.js`.
- Deterministic Topic Recommendation Engine (`GET /api/recommendations`).
- 7-Factor mathematical topic priority calculation ($P_{score}$) combining weakness, revision due, exam priority, performance trend, syllabus priority, recency decay, and available time fit.
- Explainable reason codes (`WEAK_TOPIC_ACCURACY_LOW`, `REVISION_OVERDUE`, `EXAM_APPROACHING`, `PERFORMANCE_DECLINING`, `SYLLABUS_INCOMPLETE`, `HIGH_INACTIVITY_DECAY`, `TIME_FIT_OPTIMAL`) and human-readable explanation sentences.
- Structured recommended action generation (`PRACTICE_PYQS`, `REVISE_CONCEPTS`, `COMPLETE_STUDY`, `TAKE_MOCK_QUIZ`) tailored to student's available study time.
- Frontend TypeScript recommendation service (`client/src/services/recommendationService.ts`).
- Documentation in `docs/RECOMMENDATION_ENGINE.md`.
- Automated test scripts and integration suite in `server/tests/recommendationEngine.test.js` and `server/src/scripts/unitTestRecEngine.js`.
- Main Analytics Page with interactive Recharts visualizations (`client/src/pages/Analytics/Analytics.tsx`).
- Deterministic Weak-Topic Detection Engine in backend (`server/src/services/analyticsService.js`).
- Multi-criteria filter options (Date Range: 7d/30d/90d/1y/all, Exam, Subject) across backend aggregations and frontend UI.
- Detailed topic metrics endpoint (`GET /api/analytics/topics`) with `STRONG`, `MODERATE`, `WEAK` classifications and confidence ratings (`LOW`, `MEDIUM`, `HIGH`).
- Sample size thresholding and `insufficientData` handling for low attempt counts (< 5 attempts).
- Documentation of weak-topic mathematical formula in `docs/WEAK_TOPIC_DETECTION_ENGINE.md`.
- Comprehensive backend test suite for weak-topic classification in `server/tests/weakTopicEngine.test.js`.
- Initial project scaffolding for Day 1 Architecture.
- `client/` directory with Vite + React + TailwindCSS frontend setup.
- `server/` directory with Node.js + Express + Mongoose backend setup.
- `docs/` directory with `ARCHITECTURE.md` and placeholder files for all required documentation.
