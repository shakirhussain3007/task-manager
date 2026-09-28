# Task Manager Pro

A full-stack task management application: **create, update, delete and track tasks.**

| Layer    | Technology                                           |
|----------|------------------------------------------------------|
| Frontend | HTML, CSS, vanilla JavaScript (served statically)    |
| Backend  | Node.js, Express, layered (routes → controllers → models) |
| Database | SQLite (better-sqlite3), indexed schema with CHECK constraints |
| Quality  | Input validation, centralized error handling, Helmet, rate limiting, request logging, automated tests, Docker |

## Quick start
```bash
npm install
cp .env.example .env      # optional (Windows: copy .env.example .env)
npm start                 # http://localhost:3000
npm run dev               # auto-restart on changes
npm test                  # run API tests
```
Docker: `docker build -t task-manager . && docker run -p 3000:3000 -v tasks-data:/app/data task-manager`

## Project structure
```
src/
  server.js              entry point, graceful shutdown
  app.js                 Express app factory (middleware + routes)
  config.js  db.js       configuration, SQLite connection + schema
  routes/tasks.js        route definitions
  controllers/           request handling
  models/taskModel.js    all SQL lives here
  middleware/            validation, error handling
public/                  frontend (index.html, css/, js/)
tests/tasks.test.js      API tests (node:test, in-memory DB)
```

## REST API (base: `/api`)
| Method | Endpoint       | Description |
|--------|----------------|-------------|
| GET    | /tasks         | List tasks. Query: `status`, `priority`, `q`, `sort`, `order`, `page`, `limit` (max 100). Total count in `X-Total-Count` header |
| GET    | /tasks/:id     | Get one task |
| POST   | /tasks         | Create `{ title*, description, status, priority, due_date }` |
| PUT    | /tasks/:id     | Partial update of any field |
| DELETE | /tasks/:id     | Delete (204) |
| GET    | /tasks/stats   | Counts per status + overdue |
| GET    | /health        | Health check |

Values: `status` = `todo | in_progress | done`, `priority` = `low | medium | high`, `due_date` = `YYYY-MM-DD`.
Errors are JSON: `{ "error": "Validation failed", "details": ["title is required"] }`.
