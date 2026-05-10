"use client";

import { Doc } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { format, isToday, isTomorrow, isYesterday } from "date-fns";
import clsx from "clsx";

const PRIORITY_RING: Record<number, string> = {
  1: "ring-rose-500",
  2: "ring-amber-500",
  3: "ring-sky-500",
  4: "ring-zinc-400",
};

function dueLabel(due: number): string {
  const d = new Date(due);
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "EEE MMM d");
}

function dueClass(due: number, completed: boolean): string {
  if (completed) return "text-zinc-500";
  const d = new Date(due);
  if (d.getTime() < Date.now() && !isToday(d)) return "text-rose-400";
  if (isToday(d) || isTomorrow(d)) return "text-amber-300";
  return "text-zinc-400";
}

export default function TaskCard({ task }: { task: Doc<"todos"> }) {
  const toggleCheck = useMutation(api.todos.checkATodo);
  const toggleUncheck = useMutation(api.todos.unCheckATodo);
  const assignee = useQuery(
    api.users.getUserById,
    task.assigneeId ? { userId: task.assigneeId } : "skip"
  );

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const handleToggle = () => {
    if (task.isCompleted) toggleUncheck({ taskId: task._id });
    else toggleCheck({ taskId: task._id });
  };

  const priority = (task.priority ?? 4) as 1 | 2 | 3 | 4;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={clsx(
        "group rounded-xl bg-zinc-900/70 border border-zinc-800 p-3 shadow-sm",
        "hover:border-zinc-700 transition cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-start gap-2.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggle();
          }}
          className={clsx(
            "mt-0.5 h-4 w-4 shrink-0 rounded-full ring-2 ring-offset-1 ring-offset-zinc-900 transition",
            PRIORITY_RING[priority],
            task.isCompleted
              ? "bg-emerald-500 ring-emerald-500"
              : "bg-transparent hover:bg-white/5"
          )}
          aria-label={task.isCompleted ? "Mark incomplete" : "Mark complete"}
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3
              className={clsx(
                "text-sm font-medium leading-snug text-zinc-100",
                task.isCompleted && "line-through text-zinc-500"
              )}
            >
              {task.taskName}
            </h3>
            {assignee && (
              <div
                title={assignee.name ?? assignee.email}
                className="h-6 w-6 shrink-0 rounded-full bg-zinc-700 text-[10px] text-zinc-200 grid place-items-center overflow-hidden"
              >
                {assignee.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={assignee.image}
                    alt={assignee.name ?? assignee.email}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (assignee.name ?? assignee.email).slice(0, 1).toUpperCase()
                )}
              </div>
            )}
          </div>

          {task.description && (
            <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
              <span className="text-zinc-500">What it is: </span>
              {task.description}
            </p>
          )}

          <div className="mt-2 flex items-center gap-2 text-[11px]">
            <span className={clsx("font-medium", dueClass(task.dueDate, task.isCompleted))}>
              {dueLabel(task.dueDate)}
            </span>
            {task.source && (
              <span className="text-zinc-500 truncate">
                <span className="text-zinc-600">Source:</span> {task.source}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
