import { defineSchema, defineTable } from "convex/server";
import { v, Validator } from "convex/values";

// The users, accounts, sessions and verificationTokens tables are modeled
// from https://authjs.dev/getting-started/adapters#models

export const userSchema = {
  email: v.string(),
  name: v.optional(v.string()),
  emailVerified: v.optional(v.number()),
  image: v.optional(v.string()),
};

export const sessionSchema = {
  userId: v.id("users"),
  expires: v.number(),
  sessionToken: v.string(),
};

export const accountSchema = {
  userId: v.id("users"),
  type: v.union(
    v.literal("email"),
    v.literal("oidc"),
    v.literal("oauth"),
    v.literal("webauthn")
  ),
  provider: v.string(),
  providerAccountId: v.string(),
  refresh_token: v.optional(v.string()),
  access_token: v.optional(v.string()),
  expires_at: v.optional(v.number()),
  token_type: v.optional(v.string() as Validator<Lowercase<string>>),
  scope: v.optional(v.string()),
  id_token: v.optional(v.string()),
  session_state: v.optional(v.string()),
};

export const verificationTokenSchema = {
  identifier: v.string(),
  token: v.string(),
  expires: v.number(),
};

export const authenticatorSchema = {
  credentialID: v.string(),
  userId: v.id("users"),
  providerAccountId: v.string(),
  credentialPublicKey: v.string(),
  counter: v.number(),
  credentialDeviceType: v.string(),
  credentialBackedUp: v.boolean(),
  transports: v.optional(v.string()),
};

const authTables = {
  users: defineTable(userSchema).index("email", ["email"]),
  sessions: defineTable(sessionSchema)
    .index("sessionToken", ["sessionToken"])
    .index("userId", ["userId"]),
  accounts: defineTable(accountSchema)
    .index("providerAndAccountId", ["provider", "providerAccountId"])
    .index("userId", ["userId"]),
  verificationTokens: defineTable(verificationTokenSchema).index(
    "identifierToken",
    ["identifier", "token"]
  ),
  authenticators: defineTable(authenticatorSchema)
    .index("userId", ["userId"])
    .index("credentialID", ["credentialID"]),
};

export default defineSchema({
  ...authTables,

  // ---- Workspaces (Phase 2 multi-tenancy) -----------------------------------
  // A workspace groups projects together. Every user belongs to one or more
  // workspaces via workspace_members. v1: a single "RS" workspace is seeded.
  workspaces: defineTable({
    name: v.string(),
    slug: v.string(),
    ownerId: v.id("users"),
    createdAt: v.number(),
  }).index("by_slug", ["slug"]),

  workspaceMembers: defineTable({
    workspaceId: v.id("workspaces"),
    userId: v.id("users"),
    role: v.union(
      v.literal("owner"),
      v.literal("admin"),
      v.literal("member")
    ),
    joinedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_workspace", ["workspaceId"])
    .index("by_user_workspace", ["userId", "workspaceId"]),

  // ---- Sections (columns inside a project) ---------------------------------
  sections: defineTable({
    projectId: v.id("projects"),
    name: v.string(),
    color: v.optional(v.string()),
    position: v.number(),
  })
    .index("by_project", ["projectId"])
    .index("by_project_position", ["projectId", "position"]),

  // ---- Tasks ---------------------------------------------------------------
  todos: defineTable({
    userId: v.id("users"),
    assigneeId: v.optional(v.id("users")),
    projectId: v.id("projects"),
    sectionId: v.optional(v.id("sections")),
    labelId: v.id("labels"),
    taskName: v.string(),
    description: v.optional(v.string()),
    source: v.optional(v.string()),
    dueDate: v.number(),
    priority: v.optional(v.float64()),
    isCompleted: v.boolean(),
    position: v.optional(v.number()),
  })
    .index("by_project", ["projectId"])
    .index("by_section", ["sectionId"])
    .index("by_assignee", ["assigneeId"]),

  subTodos: defineTable({
    userId: v.id("users"),
    assigneeId: v.optional(v.id("users")),
    projectId: v.id("projects"),
    sectionId: v.optional(v.id("sections")),
    labelId: v.id("labels"),
    parentId: v.id("todos"),
    taskName: v.string(),
    description: v.optional(v.string()),
    source: v.optional(v.string()),
    dueDate: v.number(),
    priority: v.optional(v.float64()),
    isCompleted: v.boolean(),
    position: v.optional(v.number()),
  }).index("by_parent", ["parentId"]),

  // ---- Labels --------------------------------------------------------------
  labels: defineTable({
    userId: v.union(v.id("users"), v.null()),
    name: v.string(),
    type: v.union(v.literal("user"), v.literal("system")),
  }),

  // ---- Projects ------------------------------------------------------------
  projects: defineTable({
    userId: v.union(v.id("users"), v.null()),
    workspaceId: v.optional(v.id("workspaces")),
    name: v.string(),
    description: v.optional(v.string()),
    color: v.optional(v.string()),
    type: v.union(v.literal("user"), v.literal("system")),
    isFavorite: v.optional(v.boolean()),
    position: v.optional(v.number()),
  })
    .index("by_workspace", ["workspaceId"])
    .index("by_user", ["userId"]),
});
