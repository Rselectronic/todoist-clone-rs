import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { handleUserId } from "./auth";

export const getMyWorkspaces = query({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];

    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();

    const workspaces = await Promise.all(
      memberships.map(async (m) => {
        const ws = await ctx.db.get(m.workspaceId);
        if (!ws) return null;
        return { ...ws, role: m.role };
      })
    );

    return workspaces.filter((w): w is NonNullable<typeof w> => w !== null);
  },
});

export const getWorkspaceBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;
    return await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
  },
});

export const createWorkspace = mutation({
  args: {
    name: v.string(),
    slug: v.string(),
  },
  handler: async (ctx, { name, slug }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;

    const existing = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (existing) return existing._id;

    const workspaceId = await ctx.db.insert("workspaces", {
      name,
      slug,
      ownerId: userId,
      createdAt: Date.now(),
    });

    await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "owner",
      joinedAt: Date.now(),
    });

    return workspaceId;
  },
});

export const joinWorkspace = mutation({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;

    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", userId).eq("workspaceId", workspaceId)
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("workspaceMembers", {
      workspaceId,
      userId,
      role: "member",
      joinedAt: Date.now(),
    });
  },
});

export const getWorkspaceMembers = query({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, { workspaceId }) => {
    const userId = await handleUserId(ctx);
    if (!userId) return [];
    const memberships = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", workspaceId))
      .collect();
    return await Promise.all(
      memberships.map(async (m) => {
        const user = await ctx.db.get(m.userId);
        return {
          membershipId: m._id,
          userId: m.userId,
          role: m.role,
          joinedAt: m.joinedAt,
          name: user?.name,
          email: user?.email,
          image: user?.image,
        };
      })
    );
  },
});

// Auto-onboard: ensure the calling user is a member of the default RS
// workspace. Called from the client right after sign-in so every team
// member ends up in the right workspace without manual admin work.
export const ensureRsMembership = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await handleUserId(ctx);
    if (!userId) return null;

    const ws = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", "rs"))
      .unique();
    if (!ws) return null;

    const existing = await ctx.db
      .query("workspaceMembers")
      .withIndex("by_user_workspace", (q) =>
        q.eq("userId", userId).eq("workspaceId", ws._id)
      )
      .unique();
    if (existing) return existing._id;

    return await ctx.db.insert("workspaceMembers", {
      workspaceId: ws._id,
      userId,
      role: "member",
      joinedAt: Date.now(),
    });
  },
});
