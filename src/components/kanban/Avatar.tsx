import type { Member } from "@/lib/kanban/types";
import { cn } from "@/lib/utils";

export function Avatar({
  member,
  size = "md",
  ring = false,
}: {
  member: Member;
  size?: "sm" | "md";
  ring?: boolean;
}) {
  return (
    <span
      title={member.name}
      className={cn(
        "grid shrink-0 place-items-center rounded-full font-semibold text-primary-foreground",
        size === "sm"
          ? "size-6 text-[10px]"
          : "size-7 text-[10px]",
        ring && "ring-2 ring-background",
      )}
      style={{ backgroundColor: member.color }}
    >
      {member.initials}
    </span>
  );
}
