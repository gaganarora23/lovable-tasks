export type Priority = "P1" | "P2" | "P3" | "P4";

export type Status = "parked" | "todo" | "in_progress" | "complete";

export interface Member {
  id: string;
  name: string;
  initials: string;
  color: string;
  isYou?: boolean;
}

export interface Label {
  id: string;
  name: string;
  color: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority | null;
  labelIds: string[];
  assigneeId: string | null;
  due?: string;
  createdAt: string;
}

export interface ColumnDef {
  id: Status;
  title: string;
}

export const COLUMNS: ColumnDef[] = [
  { id: "parked", title: "Parked / Backlog" },
  { id: "todo", title: "To Do" },
  { id: "in_progress", title: "In Progress" },
  { id: "complete", title: "Complete" },
];

export const PRIORITIES: { id: Priority; label: string; color: string }[] = [
  { id: "P1", label: "P1 · Urgent", color: "#c9530a" },
  { id: "P2", label: "P2 · High", color: "#1f3fb8" },
  { id: "P3", label: "P3 · Medium", color: "#6b6b66" },
  { id: "P4", label: "P4 · Low", color: "#a3a39e" },
];

export const LABEL_PALETTE = [
  "#ff7a1a",
  "#2f5bff",
  "#16b364",
  "#b34bff",
  "#ff4b6e",
  "#0ea5b7",
  "#b8860b",
  "#6b6b66",
];

export const PROJECT_PALETTE = [
  "#ff7a1a",
  "#2f5bff",
  "#16b364",
  "#8a8a86",
  "#b34bff",
  "#0ea5b7",
];
