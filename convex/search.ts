import { v } from "convex/values";
import { query } from "./_generated/server";
import { handleUserId } from "./auth";

// Simple text search across task names and descriptions, scoped to the
// current user's visibility rules (assigned to me OR unassigned-mine).
// We do the substring match in JS — fine for the small RS team scale.
// When AI search comes back, this query stays as a fallback.
export const searchTasks = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, { query: q }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const needle = q.trim().toLowerCase();
    if (!needle) return [];

    const all = await ctx.db.query("todos").collect();
    return all.filter((t) => {
      const mine =
        t.assigneeId === userId ||
        (t.assigneeId === undefined && t.userId === userId);
      if (!mine) return false;
      return (
        t.taskName.toLowerCase().includes(needle) ||
        (t.description?.toLowerCase().includes(needle) ?? false)
      );
    });
  },
});
