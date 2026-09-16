import { useEffect, useState } from "react";
import { useKanban } from "@/lib/kanban/store";
import {
  COLUMNS,
  LABEL_PALETTE,
  PRIORITIES,
  type Priority,
  type Status,
  type Task,
} from "@/lib/kanban/types";
import { cn } from "@/lib/utils";
import { Plus, Trash2, X } from "lucide-react";

export interface TaskDraft {
  id?: string;
  status: Status;
}

export function TaskDialog({
  open,
  draft,
  onClose,
}: {
  open: boolean;
  draft: TaskDraft | null;
  onClose: () => void;
}) {
  const {
    activeProject,
    tasks,
    labels,
    members,
    addTask,
    updateTask,
    deleteTask,
    addLabel,
  } = useKanban();

  const existing = draft?.id ? tasks.find((t) => t.id === draft.id) : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Status>("todo");
  const [priority, setPriority] = useState<Priority | null>(null);
  const [assigneeId, setAssigneeId] = useState<string | null>(null);
  const [labelIds, setLabelIds] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState("");

  useEffect(() => {
    if (!open || !draft) return;
    setTitle(existing?.title ?? "");
    setDescription(existing?.description ?? "");
    setStatus(existing?.status ?? draft.status);
    setPriority(existing?.priority ?? null);
    setAssigneeId(existing?.assigneeId ?? members[0]?.id ?? null);
    setLabelIds(existing?.labelIds ?? []);
    setNewLabel("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, draft?.id, draft?.status]);

  if (!open || !draft) return null;

  const toggleLabel = (id: string) =>
    setLabelIds((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );

  const handleAddLabel = () => {
    const name = newLabel.trim();
    if (!name) return;
    const color = LABEL_PALETTE[labels.length % LABEL_PALETTE.length] ?? "#6b6b66";
    const label = addLabel(name, color);
    setLabelIds((ids) => [...ids, label.id]);
    setNewLabel("");
  };

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    const desc = description.trim();
    const payload = {
      projectId: activeProject.id,
      title: trimmed,
      ...(desc ? { description: desc } : {}),
      status,
      priority,
      labelIds,
      assigneeId,
    };
    if (existing) updateTask(existing.id, payload);
    else addTask(payload);
    onClose();
  };

  const inputCls =
    "w-full rounded-xl bg-background px-3.5 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-ring";

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={existing ? "Edit task" : "New task"}
        className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">
            {existing ? "Edit task" : "New task"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="Task title"
            className={cn(inputCls, "font-display text-base font-semibold")}
          />
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className={cn(inputCls, "resize-none")}
          />

          <div>
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
              Status
            </div>
            <div className="flex flex-wrap gap-1.5">
              {COLUMNS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setStatus(c.id)}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition-colors",
                    status === c.id
                      ? "bg-foreground text-background ring-foreground"
                      : "text-foreground/60 ring-border hover:bg-foreground/5",
                  )}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
              Priority
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() =>
                    setPriority((cur) => (cur === p.id ? null : p.id))
                  }
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition-colors",
                    priority === p.id
                      ? "bg-foreground text-background ring-foreground"
                      : "text-foreground/60 ring-border hover:bg-foreground/5",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
              Assignee
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => setAssigneeId(null)}
                className={cn(
                  "rounded-lg px-2.5 py-1.5 text-xs font-medium ring-1 transition-colors",
                  assigneeId === null
                    ? "bg-foreground text-background ring-foreground"
                    : "text-foreground/60 ring-border hover:bg-foreground/5",
                )}
              >
                Unassigned
              </button>
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setAssigneeId(m.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg py-1.5 pl-1.5 pr-2.5 text-xs font-medium ring-1 transition-colors",
                    assigneeId === m.id
                      ? "bg-foreground text-background ring-foreground"
                      : "text-foreground/60 ring-border hover:bg-foreground/5",
                  )}
                >
                  <span
                    className="grid size-4 place-items-center rounded-full text-[8px] font-semibold text-primary-foreground"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </span>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
              Labels
            </div>
            <div className="flex flex-wrap gap-1.5">
              {labels.map((l) => {
                const on = labelIds.includes(l.id);
                return (
                  <button
                    key={l.id}
                    onClick={() => toggleLabel(l.id)}
                    className={cn(
                      "rounded-md px-2 py-1 text-[11px] font-medium ring-1 transition-colors",
                      on ? "ring-transparent" : "ring-border hover:bg-foreground/5",
                    )}
                    style={
                      on
                        ? { backgroundColor: `${l.color}26`, color: l.color }
                        : undefined
                    }
                  >
                    {l.name}
                  </button>
                );
              })}
              <span className="flex items-center gap-1 rounded-md ring-1 ring-border">
                <input
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddLabel()}
                  placeholder="New label"
                  className="w-24 bg-transparent px-2 py-1 text-[11px] outline-none"
                />
                <button
                  onClick={handleAddLabel}
                  aria-label="Add label"
                  className="pr-1.5 text-foreground/40 hover:text-foreground"
                >
                  <Plus className="size-3" />
                </button>
              </span>
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2">
          <button
            onClick={save}
            disabled={!title.trim()}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {existing ? "Save changes" : "Create task"}
          </button>
          {existing && (
            <button
              onClick={() => {
                deleteTask(existing.id);
                onClose();
              }}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" />
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
