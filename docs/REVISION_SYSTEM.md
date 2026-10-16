# Spaced Revision System

The **Spaced Revision System** manages spaced repetition schedules for studied topics to optimize long-term memory retention.

---

## Core Concepts & Interval Progression

When a topic is studied or reviewed, the system schedules the next revision using a configurable sequence of spaced intervals (in days).

### Default Interval Sequence
- **Initial Study (Stage 0)** $\rightarrow$ **1st Revision**: +1 day (`intervals[0] = 1`)
- **1st Revision Done (Stage 1)** $\rightarrow$ **2nd Revision**: +3 days (`intervals[1] = 3`)
- **2nd Revision Done (Stage 2)** $\rightarrow$ **3rd Revision**: +7 days (`intervals[2] = 7`)
- **3rd Revision Done (Stage 3)** $\rightarrow$ **4th Revision**: +14 days (`intervals[3] = 14`)
- **4th Revision Done (Stage 4+)** $\rightarrow$ **5th Revision+**: +30 days (`intervals[4] = 30`)

Custom interval sequences can be supplied per user or topic request.

---

## Status State Machine

A revision record transitions through the following statuses:

```
 [Topic Studied] ──> PENDING (scheduled for future date)
                        │
                        ├──> [Target Date Reached / Passed] ──> DUE / OVERDUE
                        │                                          │
                        └───────────────────< [Revision Completed] ┘
```

- **PENDING**: Next revision date is strictly in the future (`nextRevisionDate > endOfToday`).
- **DUE**: Next revision date falls on today (`startOfToday <= nextRevisionDate <= endOfToday`).
- **OVERDUE**: Next revision date passed before today (`nextRevisionDate < startOfToday`).
- **COMPLETED**: Topic revision logged today, next revision scheduled.

---

## Timezone Strategy

To avoid date mismatch bugs where revisions trigger a day early or late:
1. All dates (`studiedDate`, `lastRevisedDate`, `nextRevisionDate`) are stored in MongoDB in standard **UTC ISO 8601** format.
2. When querying due revisions (`GET /api/revisions/due`), the client's local date boundary is calculated using timezone offset or UTC midnight boundary helpers:
   $$\text{startOfDay} = \text{Date}(\text{YYYY}, \text{MM}, \text{DD}, 00, 00, 00, 000)$$
   $$\text{endOfDay} = \text{Date}(\text{YYYY}, \text{MM}, \text{DD}, 23, 59, 59, 999)$$
3. Any revision with $\text{nextRevisionDate} \le \text{endOfDay}$ is returned as **DUE** or **OVERDUE**.

---

## API Endpoints

### 1. Get Due Revisions
`GET /api/revisions/due`

**Headers**: `Authorization: Bearer <token>`  
**Query Parameters**:
- `examId` (optional): Filter by exam.
- `subjectId` (optional): Filter by subject.
- `timezoneOffset` (optional): Client timezone offset in minutes (e.g. `-330` for UTC+5:30).

**Response**:
```json
{
  "success": true,
  "data": {
    "dueTodayCount": 3,
    "overdueCount": 1,
    "revisions": [
      {
        "_id": "6500a123...",
        "userId": "6500b456...",
        "topicId": {
          "_id": "6500c789...",
          "name": "Newton's Laws of Motion",
          "subjectId": { "name": "Physics" }
        },
        "studiedDate": "2026-09-10T00:00:00.000Z",
        "lastRevisedDate": "2026-09-15T00:00:00.000Z",
        "revisionCount": 2,
        "intervalStage": 2,
        "nextRevisionDate": "2026-09-19T00:00:00.000Z",
        "status": "DUE",
        "intervals": [1, 3, 7, 14, 30]
      }
    ]
  }
}
```

### 2. Schedule or Complete Revision
`POST /api/revisions`

**Headers**: `Authorization: Bearer <token>`  
**Body**:
```json
{
  "topicId": "6500c789...",
  "action": "COMPLETE",
  "quality": 5,
  "intervals": [1, 3, 7, 14, 30]
}
```

- If `action` is `"SCHEDULE"` (or topic not recorded yet): Initializes revision tracking starting at stage 0.
- If `action` is `"COMPLETE"`: Logs completion, increments `revisionCount` and `intervalStage`, updates `lastRevisedDate` to current date, and sets `nextRevisionDate = lastRevisedDate + intervals[nextStage]`.
