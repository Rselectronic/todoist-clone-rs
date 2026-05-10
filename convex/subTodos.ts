import { Id, Doc } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { handleUserId } from "./auth";

const isMine = (task: Doc<"subTodos">, me: Id<"users">) =>
  task.assigneeId === me ||
  (task.assigneeId === undefined && task.userId === me);

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const all = await ctx.db.query("subTodos").collect();
    return all.filter((t) => isMine(t, userId));
  },
});

// Subtasks of a parent task — visible to the whole team since the parent is.
export const getSubTodosByParentId = query({
  args: {
    parentId: v.id("todos"),
  },
  handler: async (ctx, { parentId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("subTodos")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .collect();
  },
});

export const checkASubTodo = mutation({
  args: { taskId: v.id("subTodos") },
  handler: async (ctx, { taskId }) => {
    return await ctx.db.patch(taskId, { isCompleted: true });
  },
});

export const unCheckASubTodo = mutation({
  args: { taskId: v.id("subTodos") },
  handler: async (ctx, { taskId }) => {
    return await ctx.db.patch(taskId, { isCompleted: false });
  },
});

export const createASubTodo = mutation({
  args: {
    taskName: v.string(),
    description: v.optional(v.string()),
    priority: v.number(),
    dueDate: v.number(),
    projectId: v.id("projects"),
    labelId: v.id("labels"),
    parentId: v.id("todos"),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (
    ctx,
    {
      taskName,
      description,
      priority,
      dueDate,
      projectId,
      labelId,
      parentId,
      assigneeId,
    }
  ) => {
    try {
      const userId = await handleUserId(ctx);
      if (!userId) return null;
      return await ctx.db.insert("subTodos", {
        userId,
        assigneeId,
        parentId,
        taskName,
        description,
        priority,
        dueDate,
        projectId,
        labelId,
        isCompleted: false,
      });
    } catch (err) {
      console.log("Error occurred during createASubTodo mutation", err);
      return null;
    }
  },
});

export const completedSubTodos = query({
  args: {
    parentId: v.id("todos"),
  },
  handler: async (ctx, { parentId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("subTodos")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();
  },
});

export const inCompleteSubTodos = query({
  args: {
    parentId: v.id("todos"),
  },
  handler: async (ctx, { parentId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("subTodos")
      .withIndex("by_parent", (q) => q.eq("parentId", parentId))
      .filter((q) => q.eq(q.field("isCompleted"), false))
      .collect();
  },
});

export const deleteASubTodo = mutation({
  args: {
    taskId: v.id("subTodos"),
  },
  handler: async (ctx, { taskId }) => {
    try {
      const userId = await handleUserId(ctx);
      if (!userId) return null;
      return await ctx.db.delete(taskId);
    } catch (err) {
      console.log("Error occurred during deleteASubTodo mutation", err);
      return null;
    }
  },
});
