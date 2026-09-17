/**
 * Standalone mock server for the Kanvas Kanban API.
 * Run with:  bun mock-api/server.ts
 * Or Node:  npx tsx mock-api/server.ts
 */
import { createServer } from "http";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PORT = Number(process.env["PORT"] ?? "3001");

// Load seed data. Mutated in-memory while the server runs.
const seed = JSON.parse(readFileSync(join(__dirname, "db.json"), "utf-8")) as {
  projects: Project[];
  tasks: Task[];
  labels: Label[];
  members: Member[];
};

let projects = [...seed.projects];
let tasks = [...seed.tasks];
let labels = [...seed.labels];
let members = [...seed.members];

type Status = "parked" | "todo" | "in_progress" | "complete";
type Priority = "P1" | "P2" | "P3" | "P4";

interface Project {
  id: string;
  name: string;
  color: string;
}

interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string | null;
  status: Status;
  priority: Priority | null;
  labelIds: string[];
  assigneeId: string | null;
  due?: string | null;
  createdAt: string;
}

interface Label {
  id: string;
  name: string;
  color: string;
}

interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  isYou?: boolean;
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function json(res: import("http").ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
}

function parseBody(req: import("http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
  });
}

const projectColors = ["#ff7a1a", "#2f5bff", "#16b364", "#8a8a86", "#b34bff", "#0ea5b7"];
const memberColors = ["#2f5bff", "#16b364", "#b34bff", "#0ea5b7"];

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);
  const method = req.method ?? "GET";

  // CORS headers so a local Vite dev server can call this directly.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    // GET /projects
    if (method === "GET" && url.pathname === "/projects") {
      return json(res, 200, projects);
    }

    // POST /projects
    if (method === "POST" && url.pathname === "/projects") {
      const body = (await parseBody(req)) as { name?: string; color?: string };
      const project: Project = {
        id: uid("p"),
        name: body.name ?? "New Project",
        color: body.color ?? projectColors[projects.length % projectColors.length] ?? "#2f5bff",
      };
      projects = [...projects, project];
      return json(res, 201, project);
    }

    // GET /projects/:projectId/tasks
    const projectTasksMatch = url.pathname.match(/^\/projects\/([^/]+)\/tasks$/);
    if (method === "GET" && projectTasksMatch) {
      const projectId = projectTasksMatch[1];
      return json(res, 200, tasks.filter((t) => t.projectId === projectId));
    }

    // POST /tasks
    if (method === "POST" && url.pathname === "/tasks") {
      const body = (await parseBody(req)) as Partial<Task>;
      const task: Task = {
        id: uid("t"),
        projectId: body.projectId ?? projects[0]?.id ?? "p-atlas",
        title: body.title ?? "New task",
        description: body.description ?? null,
        status: body.status ?? "todo",
        priority: body.priority ?? null,
        labelIds: body.labelIds ?? [],
        assigneeId: body.assigneeId ?? null,
        due: body.due ?? null,
        createdAt: new Date().toISOString(),
      };
      tasks = [...tasks, task];
      return json(res, 201, task);
    }

    // PATCH /tasks/:taskId
    const taskPatchMatch = url.pathname.match(/^\/tasks\/([^/]+)$/);
    if (method === "PATCH" && taskPatchMatch) {
      const taskId = taskPatchMatch[1];
      const body = (await parseBody(req)) as Partial<Task>;
      const index = tasks.findIndex((t) => t.id === taskId);
      if (index === -1) return json(res, 404, { error: "Task not found" });
      const updated = { ...tasks[index], ...body } as Task;
      tasks = tasks.map((t) => (t.id === taskId ? updated : t));
      return json(res, 200, updated);
    }

    // DELETE /tasks/:taskId
    const taskDeleteMatch = url.pathname.match(/^\/tasks\/([^/]+)$/);
    if (method === "DELETE" && taskDeleteMatch) {
      const taskId = taskDeleteMatch[1];
      tasks = tasks.filter((t) => t.id !== taskId);
      res.writeHead(204);
      res.end();
      return;
    }

    // POST /tasks/:taskId/move
    const taskMoveMatch = url.pathname.match(/^\/tasks\/([^/]+)\/move$/);
    if (method === "POST" && taskMoveMatch) {
      const taskId = taskMoveMatch[1];
      const body = (await parseBody(req)) as { status?: Status; beforeTaskId?: string | null };
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return json(res, 404, { error: "Task not found" });
      const targetStatus: Status = body.status ?? task.status;

      const without = tasks.filter((t) => t.id !== taskId);
      const moved: Task = { ...task, status: targetStatus };
      let insertAt = without.length;

      if (body.beforeTaskId) {
        const idx = without.findIndex((t) => t.id === body.beforeTaskId);
        if (idx >= 0) insertAt = idx;
      } else {
        for (let i = without.length - 1; i >= 0; i--) {
          const t = without[i];
          if (t && t.projectId === task.projectId && t.status === targetStatus) {
            insertAt = i + 1;
            break;
          }
        }
      }

      const next = [...without];
      next.splice(insertAt, 0, moved);
      tasks = next;
      return json(res, 200, moved);
    }

    // GET /labels
    if (method === "GET" && url.pathname === "/labels") {
      return json(res, 200, labels);
    }

    // POST /labels
    if (method === "POST" && url.pathname === "/labels") {
      const body = (await parseBody(req)) as { name?: string; color?: string };
      const label: Label = {
        id: uid("l"),
        name: body.name ?? "Label",
        color: body.color ?? "#6b6b66",
      };
      labels = [...labels, label];
      return json(res, 201, label);
    }

    // GET /members
    if (method === "GET" && url.pathname === "/members") {
      return json(res, 200, members);
    }

    // POST /members
    if (method === "POST" && url.pathname === "/members") {
      const body = (await parseBody(req)) as { name?: string };
      const name = body.name ?? "Member";
      const initials =
        name
          .split(/\s+/)
          .map((w) => w[0] ?? "")
          .join("")
          .slice(0, 2)
          .toUpperCase() || "?";
      const member: Member = {
        id: uid("m"),
        name,
        initials,
        color: memberColors[members.length % memberColors.length] ?? "#2f5bff",
      };
      members = [...members, member];
      return json(res, 201, member);
    }

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    console.error(err);
    return json(res, 500, { error: "Internal server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Kanvas mock API running at http://localhost:${PORT}`);
  console.log("Routes: GET /projects, POST /projects");
  console.log("        GET /projects/:id/tasks");
  console.log("        POST /tasks, PATCH /tasks/:id, DELETE /tasks/:id, POST /tasks/:id/move");
  console.log("        GET /labels, POST /labels");
  console.log("        GET /members, POST /members");
});
