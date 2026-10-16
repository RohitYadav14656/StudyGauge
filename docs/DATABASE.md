# Database Architecture

## 1. Syllabus Hierarchy
StudyGauge uses a strictly hierarchical syllabus model:
**Exam → Subject → Topic → Subtopic**

- **Exam (`Exam.js`)**: The root competitive exam (e.g., GATE).
- **Subject (`Subject.js`)**: Belongs to an Exam via `examId`.
- **Topic (`Topic.js`)**: Belongs to a Subject via `subjectId`, and additionally holds `examId` for efficient macro filtering.
- **Subtopics (`Topic.js`)**: Stored internally as an embedded subdocument array within the Topic document. This avoids the overhead of managing a separate Mongoose model while still preserving discrete subtopic properties (name, order, active).

*Data Integrity Rule*: Topics must belong to a Subject that belongs to the same Exam. This validation is strictly enforced by the backend on creation/update. Duplicate names within a specific parent are also prevented.

## 2. Global Syllabus vs Student Progress
It is critical to distinguish between global syllabus definitions and student-specific analytics.

- **Global Master Data**: `Exam`, `Subject`, `Topic`. 
  - These are managed **exclusively by Admin** users.
  - Students only possess READ access to this data (`GET /api/exams/:id/syllabus`).
  - Active/Inactive flags govern whether content is globally visible.
- **Student Progress**: `UserExam`, `UserTopicProgress`.
  - When a student completes a topic, they manipulate their personal progress records, NOT the global `Topic` collection.
  - Modifying global topics in response to student behavior is strictly prohibited.
  - `UserTopicProgress` schema strictly maps `userId`, `examId`, and `topicId` to a `status` (Not Started, In Progress, Completed, Revised).
  - A compound unique index on `{ userId: 1, topicId: 1 }` prevents duplicated progress tracking.

## 3. Order and Sorting
The visual presentation of syllabus components does not rely on random or chronological insertion order. Instead, `Subject`, `Topic`, and `Subtopic` schemas all possess an explicit `order` field (Number) that dictates their UI sequence.
