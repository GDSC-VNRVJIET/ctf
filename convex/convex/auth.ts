import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get user by ID
export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("_id"), args.userId))
      .first();

    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_verified: user.is_verified,
    };
  },
});

// Get user by email
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!user) return null;

    return {
      id: user._id,
      email: user.email,
      password_hash: user.password_hash,
      name: user.name,
      role: user.role,
      is_verified: user.is_verified,
      verification_token: user.verification_token,
      reset_token: user.reset_token,
      reset_token_expiry: user.reset_token_expiry,
    };
  },
});

// Create user
export const createUser = mutation({
  args: {
    email: v.string(),
    password_hash: v.string(),
    name: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("admin"))),
    is_verified: v.optional(v.boolean()),
    verification_token: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await ctx.db.insert("users", {
      email: args.email,
      password_hash: args.password_hash,
      name: args.name,
      role: args.role || "user",
      is_verified: args.is_verified || false,
      verification_token: args.verification_token,
      created_at: Date.now(),
    });

    return { id: userId };
  },
});

// Update user
export const updateUser = mutation({
  args: {
    userId: v.string(),
    updates: v.object({
      name: v.optional(v.string()),
      is_verified: v.optional(v.boolean()),
      verification_token: v.optional(v.string()),
      reset_token: v.optional(v.string()),
      reset_token_expiry: v.optional(v.number()),
      last_login: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId as any, args.updates);
    return { success: true };
  },
});

// Verify user email
export const verifyUserEmail = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId as any, {
      is_verified: true,
      verification_token: undefined,
    });
    return { success: true };
  },
});

// Log security event
export const logSecurityEvent = mutation({
  args: {
    userId: v.optional(v.string()),
    action: v.string(),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("auditLogs", {
      user_id: args.userId as any,
      action: args.action,
      details_json: args.details,
      timestamp: Date.now(),
    });
    return { success: true };
  },
});
