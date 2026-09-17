# Kanvas Mock API

This folder contains a backend-ready contract and seed data for the Kanvas kanban board.

## Files

- `openapi.yaml` — OpenAPI 3.0 spec describing every endpoint, request body, and response shape.
- `db.json` — Seed data in [json-server](https://github.com/typicode/json-server) format.

## Run a mock server from this contract

### Option 1: json-server (quickest)

```bash
npx json-server --watch mock-api/db.json --port 3001
```

This gives you CRUD on `/projects`, `/tasks`, `/labels`, and `/members` automatically. The `/tasks/:id/move` endpoint is custom, so json-server alone won't implement it — use Option 2 if you need that exact route.

### Option 2: custom mock server

If you prefer a runnable Node/Bun mock that matches the full OpenAPI spec (including move/reorder), copy the seed data from `db.json` and wire these routes:

```text
GET    /projects
POST   /projects
GET    /projects/:projectId/tasks
POST   /tasks
PATCH  /tasks/:taskId
DELETE /tasks/:taskId
POST   /tasks/:taskId/move
GET    /labels
POST   /labels
GET    /members
POST   /members
```

## Frontend integration notes

The React store currently keeps everything in memory + `localStorage`. To swap in this backend later, replace the action bodies in `src/lib/kanban/store.tsx` with `fetch()` calls to the routes above. The component layer does not need to change.

Key shape rules:

- `status` is one of `parked`, `todo`, `in_progress`, `complete`.
- `priority` is one of `P1`, `P2`, `P3`, `P4` or `null`.
- `due` and `description` are optional strings.
- `createdAt` should be an ISO-8601 timestamp.
- Task order within a column is determined by list position; `POST /tasks/:taskId/move` handles reordering.
