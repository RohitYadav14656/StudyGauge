# StudyGauge Master Plan

This document serves as the central source of truth for the ongoing development of the StudyGauge platform. It includes the Daily Development Master Prompt that must be followed for every task, as well as a high-level roadmap of the project's phases.

## High-Level Roadmap

- **Phase 1 (Completed):** Project Scaffolding & Full-Stack Architecture Setup (React, Vite, Node.js, Express, MongoDB, Tailwind CSS).
- **Phase 2 (Next):** Data Modeling, Database Schemas, and Authentication System (JWT + bcrypt).
- **Phase 3:** Core Tracking and Quiz Engine (Track -> Analyze -> Identify Weakness).
- **Phase 4:** AI Integration (RAG, Recommendation Engine, Adaptive Planner).
- **Phase 5:** Polishing, Performance Optimization, and Security Hardening.

---

## Daily Development Master Prompt

*This prompt must be followed before and after the work of any day.*

**STUDYGAUGE — DAILY DEVELOPMENT MASTER PROMPT**

You are continuing development of the existing StudyGauge project.

StudyGauge is an adaptive competitive-exam preparation platform built using:

**Frontend:**
- React.js
- React Router
- Tailwind CSS
- Axios
- Recharts

**Backend:**
- Node.js
- Express.js
- Mongoose

**Database:**
- MongoDB / MongoDB Atlas

**AI:**
- LLM
- RAG
- Embeddings
- Vector Search
- LangChain where genuinely useful
- Controlled AI tool calling

The project follows:
TRACK → ANALYZE → IDENTIFY WEAKNESS → RECOMMEND → ADAPT → IMPROVE

==================================================
**IMPORTANT: YOU ARE CONTINUING AN EXISTING PROJECT**
==================================================

Before doing anything:
1. Inspect the existing project structure.
2. Read the README.
3. Read relevant files in `/docs`.
4. Read `PROJECT_STATUS.md`.
5. Read `CHANGELOG.md` if it exists.
6. Inspect the existing implementation related to today's task.
7. Understand existing APIs, models, services and components.
8. Do NOT unnecessarily rewrite working code.
9. Preserve existing functionality.
10. Reuse existing architecture and components where appropriate.

Do not assume the project is empty.

==================================================
**TODAY'S TASK**
==================================================

I will provide today's development task after this prompt.

Implement ONLY the requested task and the necessary supporting changes. Do not start unrelated features.

If today's task depends on an incomplete previous feature:
- inspect the dependency
- implement only what is necessary
- do not create fake functionality
- clearly report the dependency

==================================================
**CODE QUALITY**
==================================================

Write production-quality, understandable code.

Prefer:
- modular architecture
- clear naming
- small functions
- reusable components
- service layers
- centralized error handling
- validation
- consistent API patterns

Avoid:
- giant files
- duplicated code
- unnecessary abstractions
- unnecessary dependencies
- hard-coded values
- hard-coded secrets
- fake API responses presented as real functionality

Comments should explain WHY something is done when the reason is not obvious.

==================================================
**DATABASE RULES**
==================================================

For database changes:
- inspect existing Mongoose schemas first
- reuse existing relationships
- add validation
- add appropriate indexes
- avoid unnecessary duplication
- consider query performance
- maintain user data isolation

Never allow one user to access another user's private data. Use pagination for potentially large datasets. Avoid N+1 queries where possible.

==================================================
**API RULES**
==================================================

For every API endpoint:
- validate input
- authenticate where required
- authorize the user
- handle errors
- return consistent responses
- do not expose sensitive information
- avoid leaking internal stack traces
- consider rate limiting for sensitive/high-cost endpoints

Business logic should be placed in services rather than giant route handlers.

==================================================
**FRONTEND RULES**
==================================================

For every UI feature:
- handle loading state
- handle error state
- handle empty state
- validate forms
- prevent duplicate submissions
- make it responsive
- reuse existing components
- avoid unnecessary API requests
- avoid unnecessary React re-renders

Do not put secrets or private API keys in frontend code.

==================================================
**SECURITY RULES**
==================================================

Security must be considered for every feature. Check:
- authentication / authorization
- input validation / output handling
- MongoDB injection
- XSS / CSRF where relevant
- CORS
- rate limiting
- security headers
- sensitive data exposure
- API key exposure
- insecure logging
- improper error messages
- user data isolation

For AI features additionally check:
- prompt injection
- malicious retrieved documents
- excessive token usage
- unrestricted tool access
- unauthorized access to user data
- unsafe generated output
- hallucination risks

Never give the LLM unrestricted database or code execution access.

==================================================
**AI RULES**
==================================================

Use AI only where it provides genuine value. Do NOT use an LLM for deterministic calculations that should be handled by normal backend algorithms.

Examples of deterministic backend calculations:
- Readiness score
- Weak-topic classification
- Accuracy
- Syllabus completion
- Priority score

Use AI for:
- explanations / tutoring / summarization
- contextual study assistance
- question generation
- personalized explanations
- RAG-based knowledge retrieval
- natural-language interaction

For RAG: User question → embedding → vector retrieval → relevant context → LLM → answer. Do not blindly trust LLM output. Validate structured AI responses. Do not expose API keys.

==================================================
**TESTING RULES**
==================================================

A feature is NOT complete merely because the code compiles.

For every significant feature:
1. Write appropriate tests.
2. Run the tests.
3. Fix failures.
4. Run them again.
5. Run lint/type checks if configured.
6. Run the production build.
7. Perform regression testing.

Never claim tests passed unless they were actually executed. Never create fake test results. Test both successful and failure cases. For security-sensitive features, test unauthorized behavior as well.

==================================================
**PERFORMANCE RULES**
==================================================

Consider performance during implementation.

Backend: database indexes, query efficiency, pagination, aggregation efficiency, response size, duplicate API calls.
Frontend: unnecessary re-renders, lazy loading, bundle size, chart rendering, API request duplication.
AI: unnecessary LLM calls, token usage, context size, retrieval count, duplicate requests.

Do not prematurely optimize, but fix obvious performance problems.

==================================================
**DOCUMENTATION RULES**
==================================================

Keep documentation updated during development. Use `/docs`.
When today's task changes architecture, database, APIs, security, AI behavior, or deployment, update the relevant documentation.

==================================================
**VIVA / UNDERSTANDING RULE**
==================================================

The project must remain understandable to a student developer.
Whenever implementing an important subsystem, document:
1. What it does
2. Why it exists
3. How it works
4. Important files
5. Data flow
6. Security / Performance considerations
7. How it is tested
8. Possible future improvements
9. Possible viva questions

==================================================
**DO NOT HIDE PROBLEMS**
==================================================

If something cannot be implemented DO NOT fake it. Clearly document the limitation and create the cleanest architecture possible for completing it later.

==================================================
**BEFORE FINISHING TODAY'S TASK**
==================================================

Perform the following sequence:
IMPLEMENT ↓ RUN TESTS ↓ FIX FAILURES ↓ RUN TESTS AGAIN ↓ RUN LINT / TYPE CHECK ↓ RUN PRODUCTION BUILD ↓ CHECK FOR REGRESSIONS ↓ SECURITY REVIEW ↓ PERFORMANCE REVIEW ↓ UPDATE DOCUMENTATION ↓ UPDATE PROJECT STATUS ↓ UPDATE CHANGELOG
Do not skip these steps unless technically impossible.

==================================================
**FINAL RESPONSE FORMAT**
==================================================

At the end of today's work, provide:
## IMPLEMENTED
## FILES CHANGED
## DATABASE CHANGES
## API CHANGES
## FRONTEND CHANGES
## AI CHANGES
## TESTS WRITTEN
## TESTS EXECUTED
## SECURITY CHECK
## PERFORMANCE CHECK
## DOCUMENTATION UPDATED
## KNOWN ISSUES
## PROJECT STATUS
## NEXT STEP
