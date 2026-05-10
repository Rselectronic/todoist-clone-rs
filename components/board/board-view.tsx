"use client";

import { useMemo, useState } from "react";
import { Doc, Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import BoardColumn from "./board-column";
import TaskCard from "./task-card";
import AddTaskInline from "../add-tasks/add-task-inline";

type AddingTarget = Id<"sections"> | "unsectioned" | null;

export default function BoardView({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const project = useQuery(api.projects.getProjectByProjectId, { projectId });
  const sections = useQuery(api.sections.getSectionsByProject, { projectId }) ?? [];
  const tasks = useQuery(api.todos.getTodosByProjectId, { projectId }) ?? [];
  const moveTask = useMutation(api.todos.moveTask);

  const [activeTaskId, setActiveTaskId] = useState<Id<"todos"> | null>(null);
  const [addingToSection, setAddingToSection] = useState<AddingTarget>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columns = useMemo(() => {
    const bySection = new Map<string, Doc<"todos">[]>();
    bySection.set("unsectioned", []);
    for (const s of sections) bySection.set(s._id, []);
    for (const t of tasks) {
      const key = (t.sectionId ?? "unsectioned") as string;
      const arr = bySection.get(key) ?? [];
      arr.push(t);
      bySection.set(key, arr);
    }
    bySection.forEach((arr: Doc<"todos">[]) => {
      arr.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    });
    return bySection;
  }, [sections, tasks]);

  const activeTask = activeTaskId
    ? tasks.find((t) => t._id === activeTaskId)
    : null;

  const handleDragStart = (event: DragStartEvent) => {
    setActiveTaskId(event.active.id as Id<"todos">);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTaskId(null);
    const { active, over } = event;
    if (!over) return;

    const taskId = active.id as Id<"todos">;
    const overId = over.id as string;

    let targetSectionId: Id<"sections"> | undefined;
    if (overId === "unsectioned") {
      targetSectionId = undefined;
    } else if (sections.find((s) => s._id === overId)) {
      targetSectionId = overId as Id<"sections">;
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      targetSectionId = overTask?.sectionId;
    }

    const siblings = tasks.filter((t) =>
      targetSectionId
        ? t.sectionId === targetSectionId
        : t.sectionId === undefined
    );
    const newPosition =
      siblings.reduce(
        (max, t) => ((t.position ?? 0) > max ? t.position ?? 0 : max),
        0
      ) + 1000;

    moveTask({ taskId, sectionId: targetSectionId, position: newPosition });
  };

  const projectName = project?.name ?? "Project";
  const unsectioned = columns.get("unsectioned") ?? [];
  const showUnsectioned = unsectioned.length > 0 || sections.length === 0;

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      <header className="px-6 py-4 border-b border-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">{projectName}</h1>
      </header>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex-1 overflow-x-auto px-6 py-4">
          <div className="flex gap-4 min-w-max">
            {showUnsectioned && (
              <div className="flex flex-col">
                <BoardColumn
                  id="unsectioned"
                  name="Inbox"
                  tasks={unsectioned}
                  onAddTask={() => setAddingToSection("unsectioned")}
                />
                {addingToSection === "unsectioned" && (
                  <div className="w-[320px] mt-2">
                    <AddTaskInline
                      setShowAddTask={(v) =>
                        setAddingToSection(v ? "unsectioned" : null)
                      }
                      projectId={projectId}
                    />
                  </div>
                )}
              </div>
            )}

            {sections.map((section) => (
              <div key={section._id} className="flex flex-col">
                <BoardColumn
                  id={section._id}
                  name={section.name}
                  tasks={columns.get(section._id) ?? []}
                  onAddTask={() => setAddingToSection(section._id)}
                />
                {addingToSection === section._id && (
                  <div className="w-[320px] mt-2">
                    <AddTaskInline
                      setShowAddTask={(v) =>
                        setAddingToSection(v ? section._id : null)
                      }
                      projectId={projectId}
                      sectionId={section._id}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
