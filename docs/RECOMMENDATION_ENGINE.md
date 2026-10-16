# Deterministic Recommendation Engine

## Overview

The **Recommendation Engine** in StudyGauge calculates prioritized topic recommendations for competitive exam students without using an LLM for the core priority decision.

> [!IMPORTANT]
> **Zero LLM Core Decision**: As per system directives, topic priority decisions are computed 100% deterministically using a weighted 7-factor formula, database aggregations, and business logic. An LLM is **never** used for ranking topics or calculating mathematical scores.

---

## 1. Core Purpose

The Recommendation Engine helps students answer the fundamental question:  
*"What topic should I study or revise right now to maximize my exam readiness?"*

It synthesizes 7 distinct learning parameters to output an **explainable priority score**, a **recommended action**, **reason codes**, and **supporting metrics**.

---

## 2. 7-Factor Mathematical Priority Formula

The **Topic Priority Score** ($P_{score} \in [0, 100]$) is computed as follows:

$$P_{score} = \min\left(100, \max\left(0, \text{round}\left(0.25 \cdot F_{weakness} + 0.20 \cdot F_{revision} + 0.15 \cdot F_{exam} + 0.15 \cdot F_{trend} + 0.10 \cdot F_{syllabus} + 0.10 \cdot F_{recency} + 0.05 \cdot F_{time}\right)\right)\right)$$

### Factor Breakdown

| Factor | Weight ($w_i$) | Input Source | Calculation & Range ($F_i \in [0, 100]$) |
| :--- | :--- | :--- | :--- |
| **Weakness** ($F_{weakness}$) | $0.25$ | Topic Analytics ($S_{topic}$) | $F_{weakness} = 100 - S_{topic}$. High weakness increases study priority. |
| **Revision Due** ($F_{revision}$) | $0.20$ | `Revision` model | `OVERDUE`: $\min(100, 70 + |D_{overdue}| \times 3)$, `DUE`: $65$, `PENDING`: $\max(0, 40 - D_{until} \times 2)$. |
| **Exam Priority** ($F_{exam}$) | $0.15$ | `UserExam` & `Subject` | Based on days to target exam ($D_{exam}$) and subject weightage: $F_{exam} = 0.7 W_{urgency} + 0.3 \min(100, W_{subj} \times 3)$. |
| **Performance Trend** ($F_{trend}$) | $0.15$ | `PYQAttempt` (30d vs baseline) | $\Delta_{acc} = A_{recent} - A_{baseline}$. Declining ($\Delta \le -20\%$): $90$, Slight drop: $70$, Stable: $50$, Improving: $30$. |
| **Syllabus Priority** ($F_{syllabus}$) | $0.10$ | `UserTopicProgress` | `In Progress`: $85$, `Not Started`: $70$, `Completed`: $40$, `Revised`: $25$. |
| **Recency / Decay** ($F_{recency}$) | $0.10$ | `StudySession` & `Revision` | Days since last activity ($D_{inactive}$): $>30$d: $90$, $14-30$d: $70$, $7-14$d: $50$, $\le 7$d: $20$. |
| **Available Time Fit** ($F_{time}$) | $0.05$ | Query param (`availableTime`) | Matches recommended action to student's available window: $\ge 60$m: $90$, $30-60$m: $80$, $<30$m: $75$. |

---

## 3. Priority Levels

Based on $P_{score}$, recommendations are classified into four priority levels:

| Priority Level | Score Range | Color Badge | Recommended Action Speed |
| :--- | :--- | :--- | :--- |
| **CRITICAL** | $P_{score} \ge 75$ | Red | Immediate action recommended today. |
| **HIGH** | $60 \le P_{score} < 75$ | Orange | Priority for upcoming study sessions. |
| **MEDIUM** | $45 \le P_{score} < 60$ | Yellow | Regular schedule inclusion. |
| **LOW** | $P_{score} < 45$ | Green | Maintenance / Periodic review. |

---

## 4. Reason Codes & Explainability

To maintain complete transparency, each recommendation includes structured `reasonCodes` and human-readable `reasons`:

| Reason Code | Trigger Condition | Example Explanation Sentence |
| :--- | :--- | :--- |
| `WEAK_TOPIC_ACCURACY_LOW` | Mastery $< 50\%$ or Accuracy $< 50\%$ | *"Topic mastery is 31.8% (WEAK classification) with 33.3% accuracy."* |
| `REVISION_OVERDUE` | Revision past due date | *"Revision is overdue by 5 days."* |
| `REVISION_DUE_TODAY` | Revision scheduled for today | *"Revision is scheduled for today."* |
| `EXAM_APPROACHING` | Target exam $\le 30$ days away | *"Target exam is in 15 days."* |
| `PERFORMANCE_DECLINING` | Recent 30d accuracy dropped $\ge 15\%$ | *"Recent accuracy dropped by 18.5% compared to baseline."* |
| `SYLLABUS_INCOMPLETE` | Status is `In Progress` or `Not Started` | *"Syllabus coverage status is 'In Progress'."* |
| `HIGH_INACTIVITY_DECAY` | $> 21$ days without study/revision | *"No practice or revision recorded for 28 days."* |
| `TIME_FIT_OPTIMAL` | `availableTime` specified | *"Recommended activity fits into your 45-minute available study window."* |

---

## 5. API Contract (`GET /api/recommendations`)

### Request Headers
`Authorization: Bearer <JWT_TOKEN>`

### Query Parameters
- `examId` (optional): Filter recommendations for a specific exam.
- `subjectId` (optional): Filter recommendations for a specific subject.
- `availableTime` (optional, default: `60`): Available time in minutes.
- `limit` (optional, default: `10`, max: `50`): Maximum recommendations returned.
- `minPriority` (optional, default: `0`): Minimum priority score filter.

### Response Payload Structure
```json
{
  "success": true,
  "data": {
    "meta": {
      "totalRecommendations": 1,
      "availableTimeMinutes": 60,
      "generatedAt": "2026-09-20T09:05:29.000Z",
      "formula": "P_score = 0.25*Weakness + 0.20*Revision + 0.15*Exam + 0.15*Trend + 0.10*Syllabus + 0.10*Recency + 0.05*TimeFit"
    },
    "recommendations": [
      {
        "topic": {
          "id": "650f123456789abcdef01234",
          "name": "Thermodynamics",
          "subjectId": "650f987654321fedcba43210",
          "subjectName": "Physics",
          "examId": "650f11112222333344445555",
          "examName": "JEE Advanced"
        },
        "priority": {
          "score": 84.3,
          "level": "CRITICAL",
          "breakdown": {
            "weaknessFactor": 75.0,
            "revisionFactor": 85.0,
            "examFactor": 100.0,
            "trendFactor": 90.0,
            "syllabusFactor": 85.0,
            "recencyFactor": 70.0,
            "timeFitFactor": 90.0
          }
        },
        "recommendedAction": {
          "actionType": "PRACTICE_PYQS",
          "title": "Practice PYQs on Thermodynamics",
          "description": "Solve past year questions on Thermodynamics to improve accuracy from 33.3%.",
          "estimatedMinutes": 45
        },
        "reasonCodes": [
          "WEAK_TOPIC_ACCURACY_LOW",
          "REVISION_OVERDUE",
          "EXAM_APPROACHING"
        ],
        "reasons": [
          "Topic mastery is 25.0% (WEAK classification) with 33.3% accuracy.",
          "Revision is overdue by 5 days.",
          "Target exam is in 15 days."
        ],
        "supportingMetrics": {
          "weaknessScore": 75.0,
          "masteryScore": 25.0,
          "accuracy": 33.3,
          "totalAttempts": 12,
          "revisionStatus": "OVERDUE",
          "daysOverdue": 5,
          "daysSinceLastActivity": 25,
          "performanceTrendDelta": -20.0,
          "syllabusStatus": "In Progress",
          "daysToExam": 15,
          "subjectWeightage": 35.0
        }
      }
    ]
  }
}
```

---

## 6. Important Code Files

- [recommendationService.js](file:///c:/Users/ajeet/Desktop/STUDYGAUGE/STUDYGAUGE/server/src/services/recommendationService.js): Core 7-factor calculation algorithm.
- [recommendationController.js](file:///c:/Users/ajeet/Desktop/STUDYGAUGE/STUDYGAUGE/server/src/controllers/recommendationController.js): HTTP controller for handling parameters and responses.
- [recommendationRoutes.js](file:///c:/Users/ajeet/Desktop/STUDYGAUGE/STUDYGAUGE/server/src/routes/recommendationRoutes.js): Route mounting for `GET /api/recommendations`.
- [recommendationEngine.test.js](file:///c:/Users/ajeet/Desktop/STUDYGAUGE/STUDYGAUGE/server/tests/recommendationEngine.test.js): Jest test suite.
- [recommendationService.ts](file:///c:/Users/ajeet/Desktop/STUDYGAUGE/STUDYGAUGE/client/src/services/recommendationService.ts): Frontend TypeScript client.

---

## 7. Viva Q&A Guide

**Q: Why is the recommendation engine deterministic instead of using an LLM?**  
*A: LLMs are non-deterministic, slow, costly, and subject to hallucination. Recommendation decisions must be explainable, consistent, and mathematically grounded in real student practice accuracy, revision schedules, and exam deadlines.*

**Q: How does the engine prevent recommendation bias for topics with 0 attempts?**  
*A: Unattempted topics use baseline weakness scores derived from syllabus status (`In Progress` vs `Not Started`). Once practice attempts begin, accuracy and recency dynamically refine the factors.*

**Q: How does `availableTime` affect the recommendation?**  
*A: `availableTime` scales candidate action durations (e.g. max 30m for quick revision, 45m for PYQ practice, 60m for concept study) and awards fit points ($F_{time}$) to ensure recommended sessions fit the student's available schedule.*
