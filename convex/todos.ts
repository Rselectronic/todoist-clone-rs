import { Doc, Id } from "./_generated/dataModel";
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { handleUserId } from "./auth";
import moment from "moment";

// Multi-user model:
// - Project-scoped queries return ALL tasks in the project (everyone on the
//   team can see them). Use `by_project` index for performance.
// - "Smart views" (today/upcoming/inbox) return only tasks the current user
//   should see in their personal lists: assigned to them, or unassigned tasks
//   they created.
const isMine = (task: Doc<"todos">, me: Id<"users">) =>
  task.assigneeId === me ||
  (task.assigneeId === undefined && task.userId === me);

export const get = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const all = await ctx.db.query("todos").collect();
    return all.filter((t) => isMine(t, userId));
  },
});

export const getCompletedTodosByProjectId = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("todos")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();
  },
});

export const getTodosByProjectId = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("todos")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
  },
});

export const getInCompleteTodosByProjectId = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    return await ctx.db
      .query("todos")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("isCompleted"), false))
      .collect();
  },
});

export const getTodosTotalByProjectId = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return 0;
    const todos = await ctx.db
      .query("todos")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();
    return todos.length;
  },
});

export const todayTodos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const todayStart = moment().startOf("day").valueOf();
    const todayEnd = moment().endOf("day").valueOf();
    const due = await ctx.db
      .query("todos")
      .filter((q) =>
        q.and(
          q.gte(q.field("dueDate"), todayStart),
          q.lte(q.field("dueDate"), todayEnd)
        )
      )
      .collect();
    return due.filter((t) => isMine(t, userId));
  },
});

export const overdueTodos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const todayStart = moment().startOf("day").valueOf();
    const overdue = await ctx.db
      .query("todos")
      .filter((q) => q.lt(q.field("dueDate"), todayStart))
      .filter((q) => q.eq(q.field("isCompleted"), false))
      .collect();
    return overdue.filter((t) => isMine(t, userId));
  },
});

export const completedTodos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const all = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();
    return all.filter((t) => isMine(t, userId));
  },
});

export const inCompleteTodos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const all = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("isCompleted"), false))
      .collect();
    return all.filter((t) => isMine(t, userId));
  },
});

export const totalTodos = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return 0;
    const all = await ctx.db
      .query("todos")
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();
    return all.filter((t) => isMine(t, userId)).length;
  },
});

export const checkATodo = mutation({
  args: { taskId: v.id("todos") },
  handler: async (ctx, { taskId }) => {
    return await ctx.db.patch(taskId, { isCompleted: true });
  },
});

export const unCheckATodo = mutation({
  args: { taskId: v.id("todos") },
  handler: async (ctx, { taskId }) => {
    return await ctx.db.patch(taskId, { isCompleted: false });
  },
});

export const createATodo = mutation({
  args: {
    taskName: v.string(),
    description: v.optional(v.string()),
    priority: v.number(),
    dueDate: v.number(),
    projectId: v.id("projects"),
    labelId: v.id("labels"),
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
      assigneeId,
    }
  ) => {
    try {
      const userId = await handleUserId(ctx);
      if (!userId) return null;

      return await ctx.db.insert("todos", {
        userId,
        assigneeId,
        taskName,
        description,
        priority,
        dueDate,
        projectId,
        labelId,
        isCompleted: false,
      });
    } catch (err) {
      console.log("Error occurred during createATodo mutation", err);
      return null;
    }
  },
});

export const setAssignee = mutation({
  args: {
    taskId: v.id("todos"),
    assigneeId: v.optional(v.id("users")),
  },
  handler: async (ctx, { taskId, assigneeId }) => {
    return await ctx.db.patch(taskId, { assigneeId });
  },
});

export const groupTodosByDate = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return {};

    const todos = await ctx.db
      .query("todos")
      .filter((q) => q.gt(q.field("dueDate"), Date.now()))
      .collect();

    const mine = todos.filter((t) => isMine(t, userId));

    return mine.reduce<Record<string, Doc<"todos">[]>>((acc, todo) => {
      const dueDate = new Date(todo.dueDate).toDateString();
      acc[dueDate] = (acc[dueDate] || []).concat(todo);
      return acc;
    }, {});
  },
});

export const deleteATodo = mutation({
  args: {
    taskId: v.id("todos"),
  },
  handler: async (ctx, { taskId }) => {
    try {
      const userId = await handleUserId(ctx);
      if (!userId) return null;
      return await ctx.db.delete(taskId);
    } catch (err) {
      console.log("Error occurred during deleteATodo mutation", err);
      return null;
    }
  },
});
