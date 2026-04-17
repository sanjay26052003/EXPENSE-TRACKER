# Expense Tracker

A full-stack expense tracker with:

- local account-based auth
- fast expense entry and editing
- monthly category summaries
- an AI assistant for totals, recent expenses, top categories, and period comparisons

## Stack

- `frontend/`: Next.js 15, React 19, CSS Modules
- `backend/`: Express, Mongoose, MongoDB
- `frontend/src/app/api/*`: thin proxy routes to the backend API

## Local Setup

### 1. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure environment variables

Backend `.env`:

```bash
PORT=5001
MONGODB_URI=mongodb://localhost:27017/expense-tracker
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
APP_BASE_URL=http://localhost:3000
ALLOWED_ORIGINS=http://localhost:3000
```

Frontend `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:5001
```

`OPENROUTER_API_KEY` is optional. If it is missing, the chat still answers core questions using deterministic logic instead of hosted AI phrasing.

### 3. Run the app

Terminal 1:

```bash
cd backend
npm start
```

Terminal 2:

```bash
cd frontend
npm run dev
```

## Product Areas

- `/`: dashboard with quick add, recent activity, and monthly headline metrics
- `/expenses`: grouped transaction log with edit and delete flows
- `/summary`: category totals and top-spend overview
- `/chat`: AI assistant backed by real expense aggregates

## Notes

- The backend is the source of truth for auth, expense data, and AI answers.
- The Next.js API routes exist to keep the frontend on relative `/api/*` calls while proxying to the backend.
- `npm run build` in `frontend/` succeeds in the current codebase.
