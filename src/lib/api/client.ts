import type { Label, Member, Project, Status, Task } from "../kanban/types";

export const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = false } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth) {
    if (!authToken) throw new ApiError("not authenticated", 401);
    headers.Authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new ApiError(
      `${method} ${path} failed: ${res.status} ${detail}`,
      res.status,
    );
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export const api = {
  login: (username: string, password: string) =>
    request<TokenResponse>("/auth/login", {
      method: "POST",
      body: { username, password },
    }),

  listProjects: () => request<Project[]>("/projects"),
  createProject: (name: string, color: string) =>
    request<Project>("/projects", { method: "POST", body: { name, color }, auth: true }),

  listProjectTasks: (projectId: string) =>
    request<Task[]>(`/projects/${projectId}/tasks`),

  createTask: (task: Omit<Task, "id" | "createdAt">) =>
    request<Task>("/tasks", { method: "POST", body: task, auth: true }),
  updateTask: (id: string, patch: Partial<Task>) =>
    request<Task>(`/tasks/${id}`, { method: "PATCH", body: patch, auth: true }),
  deleteTask: (id: string) =>
    request<void>(`/tasks/${id}`, { method: "DELETE", auth: true }),
  moveTask: (id: string, status: Status, beforeTaskId: string | null) =>
    request<Task>(`/tasks/${id}/move`, {
      method: "POST",
      body: { status, beforeTaskId },
      auth: true,
    }),

  listLabels: () => request<Label[]>("/labels"),
  createLabel: (name: string, color: string) =>
    request<Label>("/labels", { method: "POST", body: { name, color }, auth: true }),

  listMembers: () => request<Member[]>("/members"),
  createMember: (name: string) =>
    request<Member>("/members", { method: "POST", body: { name }, auth: true }),
};

export { ApiError };
