import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, setAuthToken } from "../api/client";
import type { Label, Member, Priority, Project, Status, Task } from "./types";

/**
 * Backed by the kanbanit FastAPI service. On mount we auto-login as the demo
 * user (no login UI in this phase) and load projects/tasks/labels/members
 * from the API; every mutation calls the corresponding endpoint and applies
 * the server's response to local state. Components only talk to this
 * interface, so nothing else needs to change if the backend does.
 */

const DEMO_USERNAME = "demo";
const DEMO_PASSWORD = "demo1234";

interface KanbanState {
  projects: Project[];
  tasks: Task[];
  members: Member[];
  labels: Label[];
  activeProjectId: string;
}

interface KanbanContextValue extends KanbanState {
  activeProject: Project;
  loading: boolean;
  error: string | null;
  projectTasks: (projectId: string) => Task[];
  columnTasks: (projectId: string, status: Status) => Task[];
  taskCount: (projectId: string) => number;
  setActiveProject: (id: string) => void;
  addProject: (name: string, color: string) => void;
  addTask: (task: Omit<Task, "id" | "createdAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  moveTask: (taskId: string, status: Status, beforeTaskId: string | null) => void;
  addLabel: (name: string, color: string) => Promise<Label>;
  addMember: (name: string) => void;
}

const KanbanContext = createContext<KanbanContextValue | null>(null);

const emptyState: KanbanState = {
  projects: [],
  tasks: [],
  members: [],
  labels: [],
  activeProjectId: "",
};

export function KanbanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<KanbanState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { access_token } = await api.login(DEMO_USERNAME, DEMO_PASSWORD);
        setAuthToken(access_token);

        const [projects, labels, members] = await Promise.all([
          api.listProjects(),
          api.listLabels(),
          api.listMembers(),
        ]);
        const taskLists = await Promise.all(
          projects.map((p) => api.listProjectTasks(p.id)),
        );
        const tasks = taskLists.flat();

        if (cancelled) return;
        setState({
          projects,
          tasks,
          labels,
          members,
          activeProjectId: projects[0]?.id ?? "",
        });
        setError(null);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to load board from backend:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to reach the backend. Is it running?",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<KanbanContextValue>(() => {
    const first = state.projects[0];
    const activeProject: Project =
      state.projects.find((p) => p.id === state.activeProjectId) ??
      first ?? { id: "p-fallback", name: "Project", color: "#2f5bff" };

    return {
      ...state,
      activeProject,
      loading,
      error,
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
      addProject: (name, color) => {
        void api.createProject(name, color).then((project) => {
          setState((s) => ({
            ...s,
            projects: [...s.projects, project],
            activeProjectId: project.id,
          }));
        });
      },
      addTask: (task) => {
        void api.createTask(task).then((created) => {
          setState((s) => ({ ...s, tasks: [...s.tasks, created] }));
        });
      },
      updateTask: (id, patch) => {
        void api.updateTask(id, patch).then((updated) => {
          setState((s) => ({
            ...s,
            tasks: s.tasks.map((t) => (t.id === id ? updated : t)),
          }));
        });
      },
      deleteTask: (id) => {
        void api.deleteTask(id).then(() => {
          setState((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }));
        });
      },
      moveTask: (taskId, status, beforeTaskId) => {
        void api.moveTask(taskId, status, beforeTaskId).then((updated) => {
          setState((s) => ({
            ...s,
            tasks: s.tasks.map((t) => (t.id === taskId ? updated : t)),
          }));
        });
      },
      addLabel: (name, color) =>
        api.createLabel(name, color).then((label) => {
          setState((s) => ({ ...s, labels: [...s.labels, label] }));
          return label;
        }),
      addMember: (name) => {
        void api.createMember(name).then((member) => {
          setState((s) => ({ ...s, members: [...s.members, member] }));
        });
      },
    };
  }, [state, loading, error]);

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
