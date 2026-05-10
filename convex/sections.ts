import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { handleUserId } from "./auth";

export const getSectionsByProject = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, { projectId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const sections = await ctx.db
      .query("sections")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    return sections.sort((a, b) => a.position - b.position);
  },
});

export const createSection = mutation({
  args: {
    projectId: v.id("projects"),
    name: v.string(),
    color: v.optional(v.string()),
  },
  handler: async (ctx, { projectId, name, color }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;

    const existing = await ctx.db
      .query("sections")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    const position =
      existing.reduce((max, s) => (s.position > max ? s.position : max), 0) +
      1000;

    return await ctx.db.insert("sections", {
      projectId,
      name,
      color,
      position,
    });
  },
});

export const renameSection = mutation({
  args: {
    sectionId: v.id("sections"),
    name: v.string(),
  },
  handler: async (ctx, { sectionId, name }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;
    return await ctx.db.patch(sectionId, { name });
  },
});

export const reorderSection = mutation({
  args: {
    sectionId: v.id("sections"),
    position: v.number(),
  },
  handler: async (ctx, { sectionId, position }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;
    return await ctx.db.patch(sectionId, { position });
  },
});

export const deleteSection = mutation({
  args: { sectionId: v.id("sections") },
  handler: async (ctx, { sectionId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;

    // Unset sectionId on any tasks in this section before deleting
    const orphanedTasks = await ctx.db
      .query("todos")
      .withIndex("by_section", (q) => q.eq("sectionId", sectionId))
      .collect();
    for (const t of orphanedTasks) {
      await ctx.db.patch(t._id, { sectionId: undefined });
    }
    return await ctx.db.delete(sectionId);
  },
});
