import { useEffect, useState } from "react";
import { useKanban } from "@/lib/kanban/store";
import { PROJECT_PALETTE } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

export function ProjectDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addProject } = useKanban();
  const [name, setName] = useState("");
  const [color, setColor] = useState(PROJECT_PALETTE[0] ?? "#2f5bff");

  useEffect(() => {
    if (open) {
      setName("");
      setColor(PROJECT_PALETTE[0] ?? "#2f5bff");
    }
  }, [open]);

  if (!open) return null;

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addProject(trimmed, color);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="New project"
        className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">New project</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Project name"
          className="w-full rounded-xl bg-background px-3.5 py-2.5 font-display text-base font-semibold ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="mt-4">
          <div className="mb-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-foreground/40">
            Color
          </div>
          <div className="flex gap-2">
            {PROJECT_PALETTE.map((c) => (
              <button
                key={c}
                onClick={() => setColor(c)}
                aria-label={`Color ${c}`}
                className={cn(
                  "size-7 rounded-full transition-transform hover:scale-110",
                  color === c && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
                )}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
        <button
          onClick={save}
          disabled={!name.trim()}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Create project
        </button>
      </div>
    </div>
  );
}

export function MemberDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { addMember } = useKanban();
  const [name, setName] = useState("");

  useEffect(() => {
    if (open) setName("");
  }, [open]);

  if (!open) return null;

  const save = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    addMember(trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/30 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add teammate"
        className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Add teammate</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid size-8 place-items-center rounded-lg text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && save()}
          placeholder="Teammate name"
          className="w-full rounded-xl bg-background px-3.5 py-2.5 text-sm ring-1 ring-border outline-none focus:ring-2 focus:ring-ring"
        />
        <button
          onClick={save}
          disabled={!name.trim()}
          className="mt-6 w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
        >
          Add to team
        </button>
      </div>
    </div>
  );
}
