# Adaptive Planning Engine — StudyGauge Technical Documentation

## Overview

The **Adaptive Planning Engine** is a core component of StudyGauge designed to dynamically adjust a student's study plan based on actual execution performance and historical progress. 

Instead of treating study schedules as static, immutable calendars, the engine continuously monitors the gap between **PLANNED ACTIVITY** and **ACTUAL ACTIVITY**, detects learning and execution anomalies, recalculates topic priorities using a multi-factor priority score formula, and dynamically adjusts future plan items under workload and pedagogical constraints.

---

## Architecture & Data Pipeline

```
┌────────────────────────┐      ┌─────────────────────────┐
│ PLANNED ACTIVITY       │  VS  │ ACTUAL ACTIVITY         │
│ (StudyPlanItems)       │      │ (Sessions, PYQs, Status)│
└───────────┬────────────┘      └────────────┬────────────┘
            │                                │
            └────────────────┬───────────────┘
                             ▼
              ┌─────────────────────────────┐
              │ 1. GAP DETECTION ENGINE     │
              │ - Missed tasks              │
              │ - Partially completed tasks │
              │ - Completed tasks           │
              │ - Declining performance     │
              │ - Overdue revisions         │
              │ - Repeatedly postponed tasks│
              └──────────────┬──────────────┘
                             ▼
              ┌─────────────────────────────┐
              │ 2. PRIORITY RECALCULATION   │
              │ (7-Factor Recommendation)   │
              └──────────────┬──────────────┘
                             ▼
              ┌─────────────────────────────┐
              │ 3. CONSTRAINT ENFORCEMENT   │
              │ - Daily capacity limit      │
              │ - Protected Revision ratio  │
              │ - Exam target date bound    │
              │ - Postponement lock         │
              └──────────────┬──────────────┘
                             ▼
              ┌─────────────────────────────┐
              │ 4. FUTURE PLAN ADJUSTMENT   │
              │ (Updated StudyPlanItems)    │
              └─────────────────────────────┘
```

---

## 1. Gap Detection Categories

The engine categorizes study plan items into 5 primary detection buckets + 1 risk bucket:

1. **Missed Tasks**: Scheduled tasks on or before reference date where `status === 'missed'` or `completion === 0`.
2. **Partially Completed Tasks**: Tasks with `status === 'partially_completed'` or completion percentage between 1% and 99%. The uncompleted remaining fraction $(100 - C)\%$ is extracted for rescheduling.
3. **Completed Tasks**: Tasks with `status === 'completed'` or `completion === 100%`.
4. **Declining Performance**: Topics where recent accuracy dropped by $>15\%$ compared to baseline accuracy, or accuracy $< 50\%$.
5. **Overdue Revisions**: Topics whose spaced revision date has passed (`status === 'OVERDUE'` or `nextRevisionDate <= currentDate`).
6. **Repeatedly Postponed Tasks**: Tasks that have been postponed $\ge 2$ times (`rescheduleCount >= 2`).

---

## 2. Workload & Pedagogical Rules

When rescheduling and injecting future tasks, the engine strictly enforces 6 business rules:

| Rule | Description | Implementation |
|---|---|---|
| **1. No Overload** | Do not overload the student | Total daily minutes $\le$ `dailyStudyHours * 60` (default 4 hours = 240 mins). |
| **2. Respect Daily Hours** | Distribute tasks across available days | Day-by-day scheduler assigns tasks without exceeding max daily minutes. |
| **3. Prioritize Weak Topics** | Focus on highest leverage topics first | Candidate tasks sorted descending by multi-factor priority score before scheduling. |
| **4. Exam Date Boundary** | Bound all tasks within target exam date | Target date fetched from `UserExam`. No items scheduled past exam date. |
| **5. Protect Revision Time** | Guarantee daily spaced revision allocation | Default 25% of daily study hours (`protectRevisionRatio = 0.25`) reserved specifically for `revision` activity tasks. |
| **6. Postponement Prevention** | Prevent tasks from being indefinitely pushed | If `rescheduleCount >= 2`, task is assigned `high` priority and locked into the immediate next available slot with reason `'Locked into immediate next slot to prevent repeated postponement'`. |

---

## 3. Priority Recalculation Model

Topic priorities are recalculated using the deterministic 7-Factor Model:

$$\text{PriorityScore} = 0.25 F_{\text{weakness}} + 0.20 F_{\text{revision}} + 0.15 F_{\text{exam}} + 0.15 F_{\text{trend}} + 0.10 F_{\text{syllabus}} + 0.10 F_{\text{recency}} + 0.05 F_{\text{time}}$$

- **Repeatedly Postponed Tasks (`rescheduleCount >= 2`)**: Priority score forced to $\ge 95-100$ and level set to `HIGH`/`CRITICAL`.
- **Overdue Revision Tasks**: Priority score set to $90 + \min(10, \text{daysOverdue})$.
- **Declining Performance Tasks**: Remedial practice tasks created with priority score $85$.

---

## 4. API Specification

### `GET /api/study-plans/:planId/adapt/analysis`
Analyzes current plan progress without making database mutations.

**Query Parameters:**
- `currentDate` (optional, ISO date string)

**Response:**
```json
{
  "studyPlan": {
    "id": "60d5ec49f1b2c81128123456",
    "title": "JEE Main Revision Plan"
  },
  "metrics": {
    "totalTasks": 12,
    "completedTasksCount": 4,
    "partiallyCompletedTasksCount": 2,
    "missedTasksCount": 3,
    "overdueRevisionsCount": 1,
    "decliningPerformanceTopicsCount": 1,
    "atRiskPostponedTasksCount": 1,
    "overallCompletionPercentage": 45
  },
  "gapsDetected": { ... }
}
```

### `POST /api/study-plans/:planId/adapt`
Executes adaptive plan adjustment (or returns preview if `previewOnly: true`).

**Request Body:**
```json
{
  "currentDate": "2026-09-21T00:00:00.000Z",
  "dailyStudyHours": 4,
  "protectRevisionRatio": 0.25,
  "previewOnly": false
}
```

**Response:**
```json
{
  "success": true,
  "studyPlanId": "60d5ec49f1b2c81128123456",
  "metrics": {
    "totalGapsIdentified": 7,
    "rescheduledTasksCount": 5,
    "injectedRevisionsCount": 1,
    "injectedRemedialTasksCount": 1,
    "newItemsCreatedCount": 8
  }
}
```

---

## 5. File Map

- `server/src/models/StudyPlanItem.js`: Schema with `rescheduleCount`, `originalDate`, `adaptationReason`, `isProtectedRevision`.
- `server/src/services/adaptivePlannerService.js`: Core implementation of `analyzePlanProgress` and `adaptStudyPlan`.
- `server/src/validations/studyPlanValidation.js`: Joi schema `adaptStudyPlanSchema`.
- `server/src/controllers/studyPlanController.js`: Controller functions `analyzeStudyPlanProgress` and `adaptStudyPlanController`.
- `server/src/routes/studyPlanRoutes.js`: Route definitions for analysis and adaptation.
- `server/tests/adaptivePlanner.test.js`: Comprehensive integration test suite.

---

## 6. Viva & Defense Questions

**Q1: Why is adaptive planning necessary in a competitive exam platform?**  
*Answer:* Students rarely adhere 100% to fixed static schedules. Without adaptation, missed or partially completed tasks accumulate as silent backlogs, causing stress or abandonment. Adaptive planning dynamically reschedules uncompleted work, protects revision time, and prioritizes weak topics without exceeding daily study capacity.

**Q2: How does the engine prevent a task from being infinitely postponed?**  
*Answer:* The model tracks a `rescheduleCount` per item. When an item reaches `rescheduleCount >= 2`, its priority is elevated to `high` and it is locked into the earliest available day slot with an explicit reason tag `'Locked into immediate next slot to prevent repeated postponement'`.

**Q3: How is protected revision time enforced?**  
*Answer:* The engine reserves a configurable fraction of daily study hours (`protectRevisionRatio`, default 25%) specifically for revision activities (`activityType === 'revision'`), preventing new theoretical reading tasks from crowding out essential memory retention work.
