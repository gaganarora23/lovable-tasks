import { useKanban } from "@/lib/kanban/store";
import type { Task } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";
import { Avatar } from "./Avatar";

export function TaskCard({
  task,
  onClick,
  dragging = false,
}: {
  task: Task;
  onClick?: () => void;
  dragging?: boolean;
}) {
  const { labels, members } = useKanban();
  const taskLabels = labels.filter((l) => task.labelIds.includes(l.id));
  const assignee = members.find((m) => m.id === task.assigneeId) ?? null;
  const done = task.status === "complete";

  return (
    <article
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-2xl bg-card p-3.5 ring-1 ring-border transition-transform",
        dragging
          ? "rotate-2 shadow-xl"
          : "hover:-translate-y-1",
      )}
    >
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {taskLabels.map((l) => (
          <span
            key={l.id}
            className="rounded-md px-1.5 py-0.5 text-[11px] font-medium"
            style={{
              backgroundColor: `${l.color}26`,
              color: l.color === "#6b6b66" ? "#55554f" : l.color,
            }}
          >
            {l.name}
          </span>
        ))}
        {task.priority && (
          <span
            className={cn(
              "ml-auto rounded-md px-1.5 py-0.5 text-[10px]",
              task.priority === "P1"
                ? "font-semibold"
                : "font-medium text-foreground/40",
            )}
            style={
              task.priority === "P1"
                ? { backgroundColor: "#ff7a1a26", color: "#c9530a" }
                : undefined
            }
          >
            {task.priority}
          </span>
        )}
      </div>
      <h3
        className={cn(
          "text-pretty font-display text-[15px] font-semibold leading-snug",
          done && "line-through decoration-foreground/30",
        )}
      >
        {task.title}
      </h3>
      <div className="mt-3 flex items-center gap-2">
        {assignee && <Avatar member={assignee} size="sm" />}
        {task.due && (
          <span className="text-[11px] text-foreground/35">{task.due}</span>
        )}
      </div>
    </article>
  );
}
