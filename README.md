# Todo App

A simple full-stack todo app.

- **Frontend**: React + TypeScript + Tailwind CSS + TanStack Query + Axios
- **Backend**: Node + Express + TypeScript + PostgreSQL
- **Logging**: Winston, writing to console, rotating log files, and a `error_logs` table in PostgreSQL

## Project structure

```
todo-app/
├── backend/     Express API server
└── frontend/    React app (Vite)
```

## Prerequisites

- Node.js 18+
- A running PostgreSQL instance (local or Docker)

## 1. Set up the database

Create a database (defaults to `todo_app`):

```bash
createdb todo_app
# or, in psql:
# CREATE DATABASE todo_app;
```

## 2. Backend setup

```bash
cd backend
cp .env.example .env
# edit .env with your PostgreSQL credentials
npm install
npm run db:init      # creates the `todos` and `error_logs` tables
npm run dev           # starts the API on http://localhost:5000
```

Backend scripts:
- `npm run dev` — run with nodemon + ts-node (auto-restart on changes)
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled build
- `npm run db:init` — apply `src/db/schema.sql` to your database

Logs are written to `backend/logs/` (`combined.log`, `error.log`, `exceptions.log`, `rejections.log`), and `warn`/`error` level logs are also inserted into the `error_logs` table. You can inspect recent DB-stored logs via:

```
GET http://localhost:5000/api/logs?limit=50
```

## 3. Frontend setup

```bash
cd frontend
cp .env.example .env
# edit .env if your backend isn't on http://localhost:5000/api
npm install
npm run dev            # starts the app on http://localhost:5173
```

## API endpoints

| Method | Endpoint          | Description         |
|--------|--------------------|---------------------|
| GET    | /api/todos          | List all todos      |
| GET    | /api/todos/:id       | Get one todo        |
| POST   | /api/todos          | Create a todo (`{ title }`) |
| PUT    | /api/todos/:id       | Update a todo (`{ title?, completed? }`) |
| DELETE | /api/todos/:id       | Delete a todo        |
| GET    | /api/logs?limit=50   | Recent error logs from PostgreSQL |
| GET    | /api/health          | Health check          |

## Notes

- CORS is restricted to `CORS_ORIGIN` in `backend/.env` (defaults to the Vite dev server at `http://localhost:5173`).
- The custom Winston Postgres transport is fire-and-forget: if the DB insert fails, it logs to console only and never crashes the app.
- Double-click a todo's text in the UI to edit it inline; press Enter to save or Escape to cancel.
