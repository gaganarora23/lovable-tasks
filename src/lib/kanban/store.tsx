import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  seedLabels,
  seedMembers,
  seedProjects,
  seedTasks,
} from "./mock-data";
import type { Label, Member, Priority, Project, Status, Task } from "./types";

/**
 * Mock backend.
 *
 * Everything the UI needs lives in this store. When your FastAPI service is
 * ready, replace the bodies of these actions with fetch() calls to your API
 * (e.g. POST /projects, POST /tasks, PATCH /tasks/:id) — the components only
 * talk to this interface, so nothing else needs to change.
 */

interface KanbanState {
  projects: Project[];
  tasks: Task[];
  members: Member[];
  labels: Label[];
  activeProjectId: string;
}

interface KanbanContextValue extends KanbanState {
  activeProject: Project;
  projectTasks: (projectId: string) => Task[];
  columnTasks: (projectId: string, status: Status) => Task[];
  taskCount: (projectId: string) => number;
  setActiveProject: (id: string) => void;
  addProject: (name: string, color: string) => void;
  addTask: (
    task: Omit<Task, "id" | "createdAt">,
  ) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, status: Status, beforeTaskId: string | null) => void;
  addLabel: (name: string, color: string) => Label;
  addMember: (name: string) => void;
}

const STORAGE_KEY = "kanvas-board-state-v1";

const KanbanContext = createContext<KanbanContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function loadState(): KanbanState {
  const fallback: KanbanState = {
    projects: seedProjects,
    tasks: seedTasks,
    members: seedMembers,
    labels: seedLabels,
    activeProjectId: seedProjects[0].id,
  };
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as KanbanState;
    if (!parsed.projects?.length) return fallback;
    return parsed;
  } catch {
    return fallback;
  }
}

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KanbanState>(loadState);
  const [hydrated, setHydrated] = useState(false);

  // Re-hydrate on the client to avoid SSR/CSR mismatch, then persist.
  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // storage full or unavailable — ignore, this is a mock
    }
  }, [state, hydrated]);

  const value = useMemo<KanbanContextValue>(() => {
    const activeProject =
      state.projects.find((p) => p.id === state.activeProjectId) ??
      state.projects[0];

    return {
      ...state,
      activeProject,
      projectTasks: (projectId) =>
        state.tasks.filter((t) => t.projectId === projectId),
      columnTasks: (projectId, status) =>
        state.tasks.filter(
          (t) => t.projectId === projectId && t.status === status,
        ),
      taskCount: (projectId) =>
        state.tasks.filter((t) => t.projectId === projectId).length,
      setActiveProject: (id) =>
        setState((s) => ({ ...s, activeProjectId: id })),
      addProject: (name, color) =>
        setState((s) => {
          const project: Project = { id: uid("p"), name, color };
          return {
            ...s,
            projects: [...s.projects, project],
            activeProjectId: project.id,
          };
        }),
      addTask: (task) =>
        setState((s) => ({
          ...s,
          tasks: [
            ...s.tasks,
            { ...task, id: uid("t"), createdAt: new Date().toISOString() },
          ],
        })),
      updateTask: (id, patch) =>
        setState((s) => ({
          ...s,
          tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        })),
      deleteTask: (id) =>
        setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) })),
      moveTask: (taskId, status, beforeTaskId) =>
        setState((s) => {
          const task = s.tasks.find((t) => t.id === taskId);
          if (!task) return s;
          const without = s.tasks.filter((t) => t.id !== taskId);
          const moved: Task = { ...task, status };
          let insertAt = without.length;
          if (beforeTaskId) {
            const idx = without.findIndex((t) => t.id === beforeTaskId);
            if (idx >= 0) insertAt = idx;
          } else {
            // append after the last task of the target column in this project
            for (let i = without.length - 1; i >= 0; i--) {
              if (
                without[i].projectId === task.projectId &&
                without[i].status === status
              ) {
                insertAt = i + 1;
                break;
              }
            }
          }
          const tasks = [...without];
          tasks.splice(insertAt, 0, moved);
          return { ...s, tasks };
        }),
      addLabel: (name, color) => {
        const label: Label = { id: uid("l"), name, color };
        setState((s) => ({ ...s, labels: [...s.labels, label] }));
        return label;
      },
      addMember: (name) =>
        setState((s) => {
          const initials = name
            .split(/\s+/)
            .map((w) => w[0])
            .join("")
            .slice(0, 2)
            .toUpperCase();
          const colors = ["#2f5bff", "#16b364", "#b34bff", "#0ea5b7"];
          const member: Member = {
            id: uid("m"),
            name,
            initials,
            color: colors[s.members.length % colors.length],
          };
          return { ...s, members: [...s.members, member] };
        }),
    };
  }, [state]);

  return (
    <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>
  );
}

export function useKanban() {
  const ctx = useContext(KanbanContext);
  if (!ctx) throw new Error("useKanban must be used inside KanbanProvider");
  return ctx;
}

export function priorityColor(priority: Priority | null): string | null {
  if (!priority) return null;
  if (priority === "P1") return "#c9530a";
  if (priority === "P2") return "#6b6b66";
  return "#6b6b66";
}
