import { mutation } from "./_generated/server";
import { handleUserId } from "./auth";

// Idempotent. Run after provisioning a fresh deployment OR after schema
// migrations that add new tables. Safe to re-run.
//   npx convex run seed:seedDefaults
//
// Creates:
//   - RS workspace (slug "rs")
//   - System "Inbox" project (no workspace — used as a personal catch-all)
//   - "RS Day to Day" project in the RS workspace, with 4 sections that
//     match the team's existing Todoist layout: Today / This Week /
//     Short Term Projects / Long Term Projects.
//   - System "General" label.
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    // Try auth context first; fall back to first user in DB for CLI runs.
    const authedUserId = await handleUserId(ctx);
    const firstUser = await ctx.db.query("users").first();
    const userId = authedUserId ?? firstUser?._id ?? null;

    // ---- RS workspace ----
    let rsWorkspace = await ctx.db
      .query("workspaces")
      .withIndex("by_slug", (q) => q.eq("slug", "rs"))
      .unique();

    if (!rsWorkspace && userId) {
      const wsId = await ctx.db.insert("workspaces", {
        name: "RS Electronique",
        slug: "rs",
        ownerId: userId,
        createdAt: Date.now(),
      });
      await ctx.db.insert("workspaceMembers", {
        workspaceId: wsId,
        userId,
        role: "owner",
        joinedAt: Date.now(),
      });
      rsWorkspace = await ctx.db.get(wsId);
    }

    // ---- System Inbox project ----
    let inbox = await ctx.db
      .query("projects")
      .filter((q) =>
        q.and(q.eq(q.field("type"), "system"), q.eq(q.field("name"), "Inbox"))
      )
      .first();

    if (!inbox) {
      const id = await ctx.db.insert("projects", {
        userId: null,
        name: "Inbox",
        type: "system",
        position: 0,
      });
      inbox = await ctx.db.get(id);
    }

    // ---- "RS Day to Day" project + default sections ----
    let rsDayProject = await ctx.db
      .query("projects")
      .filter((q) => q.eq(q.field("name"), "RS Day to Day"))
      .first();

    if (!rsDayProject && rsWorkspace && userId) {
      const id = await ctx.db.insert("projects", {
        userId,
        workspaceId: rsWorkspace._id,
        name: "RS Day to Day",
        type: "user",
        color: "red",
        isFavorite: true,
        position: 100,
      });
      rsDayProject = await ctx.db.get(id);
    }

    if (rsDayProject) {
      const defaultSections = [
        { name: "Today", color: "amber", position: 1000 },
        { name: "This Week", color: "blue", position: 2000 },
        { name: "Short Term Projects", color: "violet", position: 3000 },
        { name: "Long Term Projects", color: "emerald", position: 4000 },
      ];
      for (const s of defaultSections) {
        const exists = await ctx.db
          .query("sections")
          .withIndex("by_project", (q) =>
            q.eq("projectId", rsDayProject!._id)
          )
          .filter((q) => q.eq(q.field("name"), s.name))
          .first();
        if (!exists) {
          await ctx.db.insert("sections", {
            projectId: rsDayProject._id,
            ...s,
          });
        }
      }
    }

    // ---- System General label ----
    const existingGeneral = await ctx.db
      .query("labels")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "system"),
          q.eq(q.field("name"), "General")
        )
      )
      .first();
    if (!existingGeneral) {
      await ctx.db.insert("labels", {
        userId: null,
        name: "General",
        type: "system",
      });
    }

    return { ok: true };
  },
});
