# Exam Readiness Score Engine

The **Exam Readiness Score Engine** computes an objective, deterministic score between **0 and 100** indicating a student's preparation level for a targeted examination.

---

## Key Principles & Constraints

1. **Zero LLM Dependency**: The score is calculated strictly using deterministic mathematical formulas, weighted aggregations, and normalization functions.
2. **Transparent Formula**: Every factor, weight, raw metric, and normalized score is exposed to the client in the API response.
3. **Graceful Missing Data Handling**: When historical data is missing for a specific metric (e.g. no mock tests completed yet), its default weight is dynamically redistributed proportionally across all active/available factors.

---

## Mathematical Model & Evaluation Factors

The engine evaluates up to **7 core factors**:

| Factor Key | Factor Name | Default Weight ($w_i$) | Description | Normalization Method |
|---|---|---|---|---|
| `syllabusCompletion` | Syllabus Completion | 20% (0.20) | Percentage of exam syllabus completed or revised | $\text{Score} = \frac{\text{Completed} + 0.5 \times \text{InProgress}}{\text{Total Topics}} \times 100$ |
| `topicMastery` | Topic Mastery | 20% (0.20) | Average mastery score across topics | $\text{Score} = \text{Average}(\text{Topic Mastery Scores})$ (0–100) |
| `mockPerformance` | Mock Performance | 20% (0.20) | Average score percentage in mock tests | $\text{Score} = \frac{\sum \text{Score Percentage}}{\text{Total Mocks}}$ (0–100) |
| `accuracy` | Practice Accuracy | 15% (0.15) | Aggregate accuracy percentage in practice/mocks | $\text{Score} = \frac{\text{Total Correct}}{\text{Total Attempted}} \times 100$ |
| `revisionConsistency` | Revision Consistency | 10% (0.10) | Ratio of topics revised on time vs due/overdue | $\text{Score} = \frac{\text{On-Time Revisions}}{\text{Scheduled Revisions}} \times 100$ |
| `studyConsistency` | Study Consistency | 10% (0.10) | Active study days over last 30 days | $\text{Score} = \frac{\text{Active Days in Last 30 Days}}{30} \times 100$ |
| `pyqPerformance` | PYQ Performance | 5% (0.05) | Past Year Questions practice accuracy percentage | $\text{Score} = \frac{\text{PYQ Correct}}{\text{PYQ Attempted}} \times 100$ |

---

## Normalization & Weight Redistribution Algorithm

Let $\mathcal{F} = \{f_1, f_2, \dots, f_7\}$ be the set of potential factors with default weights $w_1, w_2, \dots, w_7$, where $\sum_{i=1}^7 w_i = 1.0$.

Let $\mathcal{A} \subseteq \mathcal{F}$ be the set of factors with **available data**.

If $|\mathcal{A}| = 0$ (no data recorded for any factor):
$$\text{Overall Score} = 0.0, \quad \text{Confidence} = \text{"NONE"}$$

For each available factor $f_k \in \mathcal{A}$, its normalized weight $w'_k$ is calculated as:
$$w'_k = \frac{w_k}{\sum_{j \in \mathcal{A}} w_j}$$

The **Overall Exam Readiness Score** $S_{\text{readiness}}$ is calculated as:
$$S_{\text{readiness}} = \operatorname{round}\left( \sum_{k \in \mathcal{A}} (w'_k \times S_k), \, 1 \right)$$

where $S_k \in [0, 100]$ is the normalized score for factor $f_k$.

---

## Confidence Level Assessment

- **HIGH**: $\ge 5$ factors evaluated and total practice attempts $\ge 15$.
- **MEDIUM**: 3–4 factors evaluated or total practice attempts $\ge 5$.
- **LOW**: 1–2 factors evaluated.
- **NONE**: 0 factors available.

---

## API Specification

### Endpoint
`GET /api/analytics/readiness`

### Query Parameters
- `examId` (optional): Mongoose ObjectId for a target exam. If omitted, active user exam is selected.

### Response Format
```json
{
  "success": true,
  "data": {
    "overallScore": 76.5,
    "confidenceLevel": "HIGH",
    "componentScores": {
      "syllabusCompletion": {
        "score": 80.0,
        "defaultWeight": 0.20,
        "normalizedWeight": 0.21,
        "status": "available",
        "label": "Syllabus Completion"
      },
      "topicMastery": {
        "score": 70.0,
        "defaultWeight": 0.20,
        "normalizedWeight": 0.21,
        "status": "available",
        "label": "Topic Mastery"
      },
      "mockPerformance": {
        "score": 75.0,
        "defaultWeight": 0.20,
        "normalizedWeight": 0.21,
        "status": "available",
        "label": "Mock Performance"
      },
      "accuracy": {
        "score": 82.0,
        "defaultWeight": 0.15,
        "normalizedWeight": 0.16,
        "status": "available",
        "label": "Practice Accuracy"
      },
      "revisionConsistency": {
        "score": 60.0,
        "defaultWeight": 0.10,
        "normalizedWeight": 0.11,
        "status": "available",
        "label": "Revision Consistency"
      },
      "studyConsistency": {
        "score": 90.0,
        "defaultWeight": 0.10,
        "normalizedWeight": 0.11,
        "status": "available",
        "label": "Study Consistency"
      },
      "pyqPerformance": {
        "score": null,
        "defaultWeight": 0.05,
        "normalizedWeight": 0.00,
        "status": "missing",
        "label": "PYQ Performance",
        "note": "No PYQ attempts recorded. Weight redistributed."
      }
    },
    "explanationMetadata": {
      "formula": "Weighted sum of available normalized factors",
      "totalFactors": 7,
      "availableFactorsCount": 6,
      "missingFactors": ["pyqPerformance"],
      "insights": [
        "Strong performance in Study Consistency (90.0%)",
        "Focus on improving Revision Consistency (60.0%) to increase overall readiness"
      ]
    }
  }
}
```
