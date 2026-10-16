# StudyGauge

StudyGauge is an adaptive competitive-exam preparation platform built to track, analyze, identify weakness, recommend, adapt, and improve student performance.

## Prerequisites

- Node.js (v18+)
- MongoDB (Local or Atlas)

## Getting Started

### 1. Clone the repository and install dependencies

```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### 2. Environment Setup

Copy the example environment file in the root directory:

```bash
cp .env.example .env
```
And similarly for the server:
```bash
cp server/.env.example server/.env
```

Ensure `MONGODB_URI` is correctly pointing to your MongoDB instance.

### 3. Running Locally

**Start the Backend:**
```bash
cd server
npm run dev
```
The backend will run on `http://localhost:5000`.

**Start the Frontend:**
```bash
cd client
npm run dev
```
The frontend will run on `http://localhost:5173`.

## Architecture Overview

- **Frontend:** React, React Router, Tailwind CSS, Recharts
- **Backend:** Node.js, Express.js
- **Database:** MongoDB / Mongoose
- **AI:** LLM & RAG integrations for contextual learning

## Admin Panel Setup (Development)

To access the admin features, you must create a development admin account via the seed script.
Ensure you have set `ADMIN_EMAIL` and `ADMIN_PASSWORD` in your `server/.env` file or export them directly in the terminal before running the script:

```bash
cd server
npm run seed:admin # or: node src/scripts/seedAdmin.js
```

Log in via the normal `/login` route using these credentials, and navigate to the Admin Dashboard at `/admin`.
