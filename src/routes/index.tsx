import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/kanban/Avatar";
import { Board } from "@/components/kanban/Board";
import { MemberDialog, ProjectDialog } from "@/components/kanban/ProjectDialog";
import { Sidebar } from "@/components/kanban/Sidebar";
import { TaskDialog, type TaskDraft } from "@/components/kanban/TaskDialog";
import { KanbanProvider, useKanban } from "@/lib/kanban/store";
import type { Status, Task } from "@/lib/kanban/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Kanvas — Mini Kanban Board" },
      {
        name: "description",
        content:
          "A mini Kanban board: create projects, add tasks with labels and priority, and drag cards from parked to complete.",
      },
      { property: "og:title", content: "Kanvas — Mini Kanban Board" },
      {
        property: "og:description",
        content:
          "Create projects, tag and prioritize tasks, and drag them across a focused Kanban board.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <KanbanProvider>
      <KanbanApp />
    </KanbanProvider>
  );
}

function KanbanApp() {
  const { activeProject, members, projectTasks } = useKanban();
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);
  const [taskOpen, setTaskOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [memberOpen, setMemberOpen] = useState(false);

  const openNewTask = (status: Status = "todo") => {
    setTaskDraft({ status });
    setTaskOpen(true);
  };

  const openTask = (task: Task) => {
    setTaskDraft({ id: task.id, status: task.status });
    setTaskOpen(true);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openNewTask("todo");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const total = projectTasks(activeProject.id).length;

  return (
    <div className="flex min-h-screen w-full bg-background font-body text-foreground antialiased">
      <Sidebar
        onNewProject={() => setProjectOpen(true)}
        onNewTask={() => openNewTask("todo")}
        onAddMember={() => setMemberOpen(true)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="border-b border-border px-6 pb-4 pt-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/40">
                Project · {total} tasks
              </div>
              <h1 className="mt-1 text-balance font-display text-4xl font-semibold leading-none">
                {activeProject.name}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center -space-x-2 sm:flex">
                {members.slice(0, 3).map((m) => (
                  <Avatar key={m.id} member={m} ring />
                ))}
                {members.length > 3 && (
                  <span className="grid size-7 place-items-center rounded-full bg-foreground text-[10px] font-semibold text-background ring-2 ring-background">
                    +{members.length - 3}
                  </span>
                )}
              </div>
              <button
                onClick={() => openNewTask("todo")}
                className="rounded-xl bg-primary py-2 pl-3.5 pr-4 text-sm font-medium text-primary-foreground shadow-[0_1px_0_rgba(0,0,0,0.15)] transition-transform hover:-translate-y-0.5"
              >
                + New task
              </button>
            </div>
          </div>
          <button
            onClick={() => openNewTask("todo")}
            className="mt-4 flex w-full items-center gap-3 rounded-xl bg-card px-4 py-3 text-left ring-1 ring-border transition-transform hover:-translate-y-0.5"
          >
            <span className="font-display text-lg font-semibold leading-none text-foreground/40">
              +
            </span>
            <span className="text-sm text-foreground/45">
              Add a task to To Do…
            </span>
            <span className="ml-auto rounded-md bg-foreground/5 px-2 py-1 text-[11px] font-medium text-foreground/30">
              ⏎
            </span>
          </button>
        </header>

        <Board onTaskClick={openTask} onAddTask={openNewTask} />
      </main>

      <TaskDialog
        open={taskOpen}
        draft={taskDraft}
        onClose={() => setTaskOpen(false)}
      />
      <ProjectDialog open={projectOpen} onClose={() => setProjectOpen(false)} />
      <MemberDialog open={memberOpen} onClose={() => setMemberOpen(false)} />
    </div>
  );
}
