import { useKanban } from "@/lib/kanban/store";
import { Plus } from "lucide-react";
import { Avatar } from "./Avatar";
import { cn } from "@/lib/utils";

export function Sidebar({
  onNewProject,
  onNewTask,
  onAddMember,
}: {
  onNewProject: () => void;
  onNewTask: () => void;
  onAddMember: () => void;
}) {
  const {
    projects,
    activeProjectId,
    setActiveProject,
    taskCount,
    members,
  } = useKanban();

  return (
    <aside className="flex w-[264px] shrink-0 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div className="grid size-8 place-items-center rounded-lg bg-primary font-display text-sm font-semibold text-primary-foreground">
          K
        </div>
        <div className="leading-none">
          <span className="font-display text-[15px] font-semibold">Kanvas</span>
          <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
            Board
          </span>
        </div>
      </div>

      <div className="mb-1 mt-4 flex items-center justify-between px-5">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
          Projects
        </span>
        <button
          onClick={onNewProject}
          aria-label="New project"
          className="grid size-5 place-items-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <nav className="space-y-0.5 px-3">
        {projects.map((p) => {
          const active = p.id === activeProjectId;
          return (
            <button
              key={p.id}
              onClick={() => setActiveProject(p.id)}
              className={cn(
                "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition-colors",
                active
                  ? "bg-foreground text-background"
                  : "text-foreground/50 hover:bg-foreground/5",
              )}
            >
              <span
                className="size-2 shrink-0 rounded-full"
                style={{
                  backgroundColor: active ? "currentColor" : p.color,
                }}
              />
              <span className="truncate">{p.name}</span>
              <span
                className={cn(
                  "ml-auto text-xs font-normal",
                  active ? "text-background/50" : "text-foreground/30",
                )}
              >
                {taskCount(p.id)}
              </span>
            </button>
          );
        })}
      </nav>

      <div className="mb-1 mt-5 flex items-center justify-between px-5">
        <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
          Team
        </span>
        <button
          onClick={onAddMember}
          aria-label="Add teammate"
          className="grid size-5 place-items-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="space-y-0.5 px-3">
        {members.map((m) => (
          <div
            key={m.id}
            className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-foreground/70"
          >
            <Avatar member={m} size="sm" />
            <span className="truncate">{m.name}</span>
            {m.isYou && (
              <span className="ml-auto text-[10px] text-foreground/30">
                You
              </span>
            )}
          </div>
        ))}
      </div>

      <div className="mt-auto p-3">
        <button
          onClick={onNewTask}
          className="flex w-full items-center gap-2.5 rounded-xl bg-foreground p-3 text-background transition-transform hover:-translate-y-0.5"
        >
          <span className="text-xs text-background/50">⌘K</span>
          <span className="text-sm font-medium">New task</span>
        </button>
      </div>
    </aside>
  );
}
