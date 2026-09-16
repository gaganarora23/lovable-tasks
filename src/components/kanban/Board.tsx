import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useState } from "react";
import { useKanban } from "@/lib/kanban/store";
import { COLUMNS, type ColumnDef, type Status, type Task } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import { TaskCard } from "./TaskCard";

const columnDot: Record<Status, string> = {
  parked: "bg-status-parked",
  todo: "bg-status-todo",
  in_progress: "bg-status-progress",
  complete: "bg-status-complete",
};

function SortableTaskCard({
  task,
  onClick,
}: {
  task: Task;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id, data: { status: task.status } });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      {...attributes}
      {...listeners}
      className={cn(isDragging && "opacity-30")}
    >
      <TaskCard task={task} onClick={onClick} />
    </div>
  );
}

function Column({
  column,
  tasks,
  onTaskClick,
  onAddTask,
}: {
  column: ColumnDef;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: Status) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <section className="flex w-[300px] shrink-0 flex-col">
      <div className="flex items-center gap-2 px-1 pb-3">
        <span
          className={cn("size-2.5 shrink-0 rounded-full", columnDot[column.id])}
        />
        <span className="font-display text-sm font-semibold text-foreground/70">
          {column.title}
        </span>
        <span className="ml-auto rounded-md bg-foreground/5 px-1.5 py-0.5 text-xs font-medium text-foreground/40">
          {tasks.length}
        </span>
        <button
          onClick={() => onAddTask(column.id)}
          aria-label={`Add task to ${column.title}`}
          className="grid size-5 place-items-center rounded-md text-foreground/40 transition-colors hover:bg-foreground/5 hover:text-foreground"
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "min-h-[120px] space-y-2.5 rounded-2xl p-1 transition-colors",
          isOver && "bg-foreground/5",
        )}
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((t) => (
            <SortableTaskCard key={t.id} task={t} onClick={() => onTaskClick(t)} />
          ))}
        </SortableContext>
        {tasks.length === 0 && (
          <div className="grid place-items-center rounded-2xl border border-dashed border-border px-4 py-8 text-center text-xs text-foreground/35">
            Drop tasks here
          </div>
        )}
      </div>
    </section>
  );
}

export function Board({
  onTaskClick,
  onAddTask,
}: {
  onTaskClick: (task: Task) => void;
  onAddTask: (status: Status) => void;
}) {
  const { activeProject, columnTasks, moveTask, projectTasks } = useKanban();
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const findColumn = (id: string): Status | null => {
    if (COLUMNS.some((c) => c.id === id)) return id as Status;
    const task = projectTasks(activeProject.id).find((t) => t.id === id);
    return task ? task.status : null;
  };

  const handleDragStart = (e: DragStartEvent) => {
    const task = projectTasks(activeProject.id).find(
      (t) => t.id === String(e.active.id),
    );
    setActiveTask(task ?? null);
  };

  const handleDragOver = (e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    const activeCol = findColumn(activeId);
    const overCol = findColumn(overId);
    if (!activeCol || !overCol || activeCol === overCol) return;
    const overIsTask = projectTasks(activeProject.id).some(
      (t) => t.id === overId,
    );
    moveTask(activeId, overCol, overIsTask ? overId : null);
  };

  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveTask(null);
    if (!over) return;
    const activeId = String(active.id);
    const overId = String(over.id);
    if (activeId === overId) return;
    const col = findColumn(overId);
    if (!col) return;
    moveTask(activeId, col, overId);
  };

  return (
    <div className="flex-1 overflow-x-auto">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveTask(null)}
      >
        <div className="flex min-h-full items-start gap-4 p-6">
          {COLUMNS.map((col) => (
            <Column
              key={col.id}
              column={col}
              tasks={columnTasks(activeProject.id, col.id)}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} dragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
