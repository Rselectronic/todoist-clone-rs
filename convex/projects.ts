import { query, mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { handleUserId } from "./auth";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// All authenticated RS team members see all projects (team-shared model).
export const getProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];

    const userProjects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("type"), "user"))
      .collect();

    const systemProjects = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("type"), "system"))
      .collect();

    return [...systemProjects, ...userProjects];
  },
});

export const getProjectByProjectId = query({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(projectId);
  },
});

export const createAProject = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    try {
      const userId = await handleUserId(ctx);
      if (!userId) return null;

      return await ctx.db.insert("projects", {
        userId,
        name,
        type: "user",
      });
    } catch (err) {
      console.log("Error occurred during createAProject mutation", err);
      return null;
    }
  },
});

export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    try {
      const userId = await handleUserId(ctx);
      if (!userId) return null;
      return await ctx.db.delete(projectId);
    } catch (err) {
      console.log("Error occurred during deleteProject mutation", err);
      return null;
    }
  },
});

export const deleteProjectAndItsTasks = action({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, { projectId }) => {
    try {
      const allTasks = await ctx.runQuery(api.todos.getTodosByProjectId, {
        projectId,
      });

      await Promise.allSettled(
        allTasks.map(async (task: Doc<"todos">) =>
          ctx.runMutation(api.todos.deleteATodo, {
            taskId: task._id,
          })
        )
      );

      await ctx.runMutation(api.projects.deleteProject, {
        projectId,
      });
    } catch (err) {
      console.error("Error deleting tasks and projects", err);
    }
  },
});
