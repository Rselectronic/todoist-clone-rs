"use client";

import { Doc, Id } from "@/convex/_generated/dataModel";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { MoreHorizontal, Plus } from "lucide-react";
import TaskCard from "./task-card";
import clsx from "clsx";

export default function BoardColumn({
  id,
  name,
  tasks,
  onAddTask,
}: {
  id: Id<"sections"> | "unsectioned";
  name: string;
  tasks: Doc<"todos">[];
  onAddTask?: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={clsx(
        "flex flex-col w-[320px] shrink-0 rounded-2xl bg-zinc-950/40 border border-zinc-900",
        isOver && "border-zinc-700 bg-zinc-900/40"
      )}
    >
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-900">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold text-zinc-100">{name}</h2>
          <span className="text-xs text-zinc-500">{tasks.length}</span>
        </div>
        <button
          type="button"
          className="text-zinc-500 hover:text-zinc-300"
          aria-label="Column options"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </header>

      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 p-3 overflow-y-auto min-h-[120px] max-h-[calc(100vh-220px)]"
      >
        <SortableContext
          items={tasks.map((t) => t._id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.map((task) => (
            <TaskCard key={task._id} task={task} />
          ))}
        </SortableContext>
      </div>

      {onAddTask && (
        <button
          type="button"
          onClick={onAddTask}
          className="flex items-center gap-2 px-4 py-2 text-xs text-rose-400 hover:text-rose-300 border-t border-zinc-900"
        >
          <Plus className="h-3.5 w-3.5" />
          Add task
        </button>
      )}
    </div>
  );
}
