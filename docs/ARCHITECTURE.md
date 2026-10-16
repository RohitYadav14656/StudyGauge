# Architecture

StudyGauge uses a modern MERN-like stack with AI enhancements.

## Frontend
- **Framework:** React.js (via Vite)
- **Routing:** React Router
- **Styling:** Tailwind CSS (v4)
- **Data Fetching:** Axios
- **Visualization:** Recharts

## Backend
- **Environment:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB via Mongoose
- **Architecture Pattern:** MVC/Service Layer

## AI Integration
- **LLM Context:** LangChain (where applicable) for RAG processing
- **Vector Search:** MongoDB Atlas Vector Search (planned)

## Syllabus Architecture
StudyGauge separates master content from user interactions. The master syllabus relies on a 4-tier hierarchy:
`Exam -> Subject -> Topic -> Subtopic`
Subtopics are modeled as subdocuments embedded within Topics for maximum query performance. 
- **Admin Management**: `/api/subjects` and `/api/topics` provide RESTful, admin-only CRUD operations.
- **Student Retrieval**: `/api/exams/:examId/syllabus` provides a highly optimized read-only aggregation (avoiding N+1 queries) for students to fetch the entire active hierarchy in one network request.

## Data Flow
1. Client makes API requests to `/api/*`
2. Express Router forwards to specific Controllers
3. Controllers use Services for business logic
4. Services interact with Mongoose Models or AI Services
5. Response is returned to Client

## Directory Structure
- `/client` - Frontend React application
- `/server` - Backend Express application
- `/docs` - Project documentation
- `/tests` - Integration and E2E tests (planned)

## Roles and Access Control (RBAC)

StudyGauge enforces Role-Based Access Control via JWT and middleware. 
Currently, there are two primary roles:
1. **student**: The default role for all new sign-ups. Restricted to their own data.
2. **admin**: The system administrator. Grants access to the Admin Panel and management APIs.

### Backend Authorization
- `protect`: Middleware to verify a valid JWT and inject `req.user`.
- `requireAdmin`: Middleware to verify that `req.user.role === 'admin'`. Returns a `403 Forbidden` for non-admins.

### Admin Panel Routes
The frontend Admin Panel is located under `/admin`.
Currently Implemented Sections:
- **Dashboard** (`/admin`): Shows real database statistics.
- **Exams** (`/admin/exams`): Full CRUD for Exam management (integrated with Day 7 Exam schema).

Placeholder Sections (Coming Soon):
- Subjects (`/admin/subjects`)
- Topics (`/admin/topics`)
- PYQs (`/admin/pyqs`)
- Users (`/admin/users`)

### Development Admin Setup
Admin registration is restricted. To create an admin account for local development, run the secure seed script. 
Ensure you define `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `server/.env` file.

```bash
cd server
npm run seed:admin
# OR
node src/scripts/seedAdmin.js
```
