import { query } from "./_generated/server";
import { v } from "convex/values";
import { handleUserId } from "./auth";

export const getUserById = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const requester = await handleUserId(ctx);
    if (!requester) return null;
    return await ctx.db.get(userId);
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(userId);
  },
});

export const getTeammates = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    // For v1 RS-only model: all users in the system are teammates.
    return await ctx.db.query("users").collect();
  },
});
