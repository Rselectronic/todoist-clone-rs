import { mutation } from "./_generated/server";

// Idempotent. Creates the default system "Inbox" project and "General" label
// if they don't already exist. Run once after provisioning a fresh deployment:
//   npx convex run seed:seedDefaults
export const seedDefaults = mutation({
  args: {},
  handler: async (ctx) => {
    const existingInbox = await ctx.db
      .query("projects")
      .filter((q) =>
        q.and(
          q.eq(q.field("type"), "system"),
          q.eq(q.field("name"), "Inbox")
        )
      )
      .first();

    if (!existingInbox) {
      await ctx.db.insert("projects", {
        userId: null,
        name: "Inbox",
        type: "system",
      });
    }

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
