import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { handleUserId } from "./auth";

// All RS team members share the same labels (team-wide).
export const getLabels = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    return await ctx.db.query("labels").collect();
  },
});

export const getLabelByLabelId = query({
  args: {
    labelId: v.id("labels"),
  },
  handler: async (ctx, { labelId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;
    return await ctx.db.get(labelId);
  },
});

export const createALabel = mutation({
  args: {
    name: v.string(),
  },
  handler: async (ctx, { name }) => {
    try {
      const userId = await handleUserId(ctx);
      if (!userId) return null;
      return await ctx.db.insert("labels", {
        userId,
        name,
        type: "user",
      });
    } catch (err) {
      console.log("Error occurred during createALabel mutation", err);
      return null;
    }
  },
});
