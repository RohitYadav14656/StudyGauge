# Deterministic Weak-Topic Detection Engine

## Overview

The **Weak-Topic Detection Engine** in StudyGauge is a purely deterministic backend algorithm responsible for identifying and classifying student topic mastery across competitive exam syllabi.

> [!IMPORTANT]
> **Zero LLM Dependency**: As per system rules, an LLM is **never** used to evaluate topic weakness or calculate mathematical metrics. All scores are computed deterministically via MongoDB aggregation pipelines and JavaScript business logic in `analyticsService.js`.

---

## 1. Classification Categories

Each topic is classified into one of three primary status levels:

| Status | Color Badge | Score Range | Description |
| :--- | :--- | :--- | :--- |
| **STRONG** | Green | $S_{topic} \ge 75\%$ | High accuracy ($\ge 75\%$), solid practice volume, up-to-date revisions. |
| **MODERATE** | Yellow | $50\% \le S_{topic} < 75\%$ | Moderate accuracy ($50–74\%$), acceptable progress, minor revision gaps. |
| **WEAK** | Red | $S_{topic} < 50\%$ | Low accuracy ($< 50\%$), high error rate in PYQs/Mocks, or severe revision decay. |

---

## 2. Mathematical Formula

The overall **Topic Mastery Score** ($S_{topic} \in [0, 100]$) is computed as follows:

$$S_{topic} = \min\left(100, \max\left(0, A_{weighted} \cdot M_{syl} + P_{rev}\right)\right)$$

### Step 2.1: Practice Accuracy Combination ($A_{combined}$)
Practice accuracy merges Previous Year Question (PYQ) attempts and Mock Test performance:

- If both PYQ ($A_{pyq}$) and Mock ($A_{mock}$) data exist:
  $$A_{combined} = 0.5 \cdot A_{pyq} + 0.5 \cdot A_{mock}$$
- If only PYQ attempts exist: $A_{combined} = A_{pyq}$
- If only Mock test data exists: $A_{combined} = A_{mock}$
- If zero attempts exist: $A_{combined} = 0$ (default base value)

### Step 2.2: Recency Weighting ($A_{weighted}$)
Student performance changes over time. Attempts made in the last 30 days are given higher weight than older attempts:

$$A_{weighted} = 0.60 \cdot A_{recent\_30d} + 0.40 \cdot A_{overall}$$

*(Note: If no attempts exist prior to 30 days or no recent attempts exist, $A_{weighted} = A_{combined}$.)*

### Step 2.3: Syllabus Completion Multiplier ($M_{syl}$)
Topic progress in the student's study plan scales the raw performance score:

| Syllabus Status | Multiplier ($M_{syl}$) | Rationale |
| :--- | :--- | :--- |
| **Revised** | $1.05$ | Multi-pass completion provides extra stability. |
| **Completed** | $1.00$ | Standard full coverage multiplier. |
| **In Progress** | $0.85$ | Incomplete coverage reduces effective mastery. |
| **Not Started** | $0.70$ | Unstudied topic cap. |

### Step 2.4: Revision Decay Penalty / Bonus ($P_{rev}$)
Let $D$ be the number of days since the topic was last revised:

$$D = \frac{\text{Current Date} - \text{lastRevisedAt}}{86400 \times 1000}$$

- **Overdue Penalty**:
  - If $D > 30$ days: $P_{rev} = -15$ points.
  - If $14 < D \le 30$ days: $P_{rev} = -5$ points.
- **Recent Revision Bonus**:
  - If $D \le 7$ days: $P_{rev} = +5$ points.
- Default ($7 < D \le 14$ days or no revision record): $P_{rev} = 0$ points.

---

## 3. Confidence & Insufficient Data Handling

To avoid false positive classifications from tiny sample sizes (e.g., 1 correct question = 100% accuracy = STRONG), the engine computes a **Data Confidence Level**:

### Sample Size Calculation
$$N_{total} = N_{pyq\_attempts} + N_{mock\_questions}$$

| Attempt Volume ($N_{total}$) | Confidence Level | Insufficient Data Flag | Rationale |
| :--- | :--- | :--- | :--- |
| $N_{total} < 5$ | **LOW** | `true` | Insufficient sample size for statistical certainty. |
| $5 \le N_{total} < 15$ | **MEDIUM** | `false` | Moderate confidence; recommendation is to continue practice. |
| $N_{total} \ge 15$ | **HIGH** | `false` | High statistical confidence in classification. |

> [!NOTE]
> When `insufficientData: true`, the topic is explicitly flagged in the UI with an `INSUFFICIENT_DATA` badge alongside its preliminary score, advising the user to attempt at least 5 questions.

---

## 4. Rationale Generation

The backend engine generates clear, deterministic rationale strings for every topic, such as:
- *"Accuracy is 35% across 12 PYQ attempts. Classified as WEAK."*
- *"Topic not started yet and 0 questions attempted."*
- *"Limited data (3 questions attempted, 66% accuracy). Insufficient sample size for high confidence."*
- *"Score is 88% with 22 attempts and recent revision 3 days ago. Classified as STRONG."*

---

## 5. API Contract (`GET /api/analytics/topics`)

### Query Parameters
- `examId` (optional): Filter topics belonging to a specific exam.
- `subjectId` (optional): Filter topics belonging to a specific subject.
- `dateRange` (optional): `7d`, `30d`, `90d`, `1y`, `all` (default: `all`).
- `classification` (optional): Filter by `WEAK`, `MODERATE`, `STRONG`.

### Response Payload Structure
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalTopics": 25,
      "weakTopics": 5,
      "moderateTopics": 12,
      "strongTopics": 8,
      "insufficientDataCount": 3
    },
    "topics": [
      {
        "topicId": "650f123456789abcdef01234",
        "topicName": "Thermodynamics",
        "subjectId": "650f987654321fedcba43210",
        "subjectName": "Physics",
        "examId": "650f11112222333344445555",
        "pyqAttempted": 12,
        "pyqCorrect": 4,
        "pyqAccuracy": 33.3,
        "mockAttempted": 5,
        "mockCorrect": 2,
        "mockAccuracy": 40.0,
        "recentAccuracy": 30.0,
        "syllabusStatus": "In Progress",
        "revisionCount": 1,
        "lastRevisedAt": "2026-08-10T00:00:00.000Z",
        "daysSinceRevision": 38,
        "masteryScore": 31.8,
        "classification": "WEAK",
        "confidence": "HIGH",
        "insufficientData": false,
        "totalAttempts": 17,
        "reason": "Combined accuracy is 35.3% across 17 attempts. Overdue for revision (38 days ago)."
      }
    ]
  }
}
```

---

## 6. Edge Cases Handled

1. **0 Attempts**: Mastery score defaults based on syllabus status ($70\%$ for completed/revised without practice, lower for unstudied). `insufficientData: true`, `confidence: "LOW"`.
2. **100% Accuracy on 1 Question**: Scores high raw accuracy but flagged with `insufficientData: true` and `confidence: "LOW"`.
3. **Old Revision History**: Applies decay penalty if $> 30$ days without revision even if initial practice accuracy was high.
4. **Deleted or Inactive Subjects/Topics**: Handled cleanly with `$unwind` fallback parameters in Mongoose pipelines.
5. **Unauthorized User Access**: Mongo pipeline strictly matches `userId: req.user._id`.

---

## 7. Viva Q&A Guide

**Q: Why is weak-topic classification deterministic instead of LLM-based?**
*A: LLMs are non-deterministic, expensive, slow, and prone to hallucination. Weak-topic detection relies on precise accuracy statistics, attempt counts, and spaced-repetition timestamps, which are best solved with fast database aggregations and algorithmic formulas.*

**Q: How do you handle small sample sizes?**
*A: We calculate an `insufficientData` boolean flag based on total attempt volume ($N < 5$). Topics with insufficient data are labeled `LOW` confidence so the student knows more practice is needed before relying on the classification.*
