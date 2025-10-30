import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Users table
  users: defineTable({
    email: v.string(),
    password_hash: v.string(),
    name: v.string(),
    role: v.union(v.literal("user"), v.literal("admin")),
    is_verified: v.boolean(),
    verification_token: v.optional(v.string()),
    reset_token: v.optional(v.string()),
    reset_token_expiry: v.optional(v.number()),
    created_at: v.number(),
    last_login: v.optional(v.number()),
  }).index("by_email", ["email"]),

  // Teams table
  teams: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    max_members: v.number(),
    points_balance: v.number(),
    current_room_id: v.optional(v.id("rooms")),
    shield_active: v.boolean(),
    shield_expiry: v.optional(v.number()),
    disabled: v.boolean(),
    invite_code: v.string(),
    created_at: v.number(),
  }).index("by_name", ["name"]).index("by_invite_code", ["invite_code"]),

  // Team members relationship
  teamMembers: defineTable({
    user_id: v.id("users"),
    team_id: v.id("teams"),
    joined_at: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_team", ["team_id"])
    .index("by_user_team", ["user_id", "team_id"]),

  // Team join requests
  teamJoinRequests: defineTable({
    user_id: v.id("users"),
    team_id: v.id("teams"),
    status: v.union(v.literal("pending"), v.literal("accepted"), v.literal("rejected")),
    requested_at: v.number(),
    responded_at: v.optional(v.number()),
  })
    .index("by_user", ["user_id"])
    .index("by_team", ["team_id"])
    .index("by_status", ["status"]),

  // Rooms table
  rooms: defineTable({
    name: v.string(),
    order_index: v.number(),
    description: v.string(),
    unlock_cost: v.number(),
    is_challenge: v.boolean(),
  }).index("by_order", ["order_index"]),

  // Puzzles table
  puzzles: defineTable({
    room_id: v.id("rooms"),
    title: v.string(),
    description: v.string(),
    points: v.number(),
    flag_hash: v.string(),
    order_index: v.number(),
  })
    .index("by_room", ["room_id"])
    .index("by_room_order", ["room_id", "order_index"]),

  // Clues table
  clues: defineTable({
    puzzle_id: v.id("puzzles"),
    content: v.string(),
    cost: v.number(),
  }).index("by_puzzle", ["puzzle_id"]),

  // Perks table
  perks: defineTable({
    name: v.string(),
    description: v.string(),
    cost: v.number(),
    effect_type: v.string(),
    effect_value: v.number(),
  }),

  // Submissions table
  submissions: defineTable({
    team_id: v.id("teams"),
    puzzle_id: v.id("puzzles"),
    user_id: v.id("users"),
    is_correct: v.boolean(),
    submitted_at: v.number(),
  })
    .index("by_team", ["team_id"])
    .index("by_puzzle", ["puzzle_id"])
    .index("by_team_puzzle", ["team_id", "puzzle_id"]),

  // Actions table (attacks, defenses, etc.)
  actions: defineTable({
    team_id: v.id("teams"),
    target_team_id: v.optional(v.id("teams")),
    action_type: v.string(),
    status: v.union(v.literal("active"), v.literal("completed"), v.literal("cancelled")),
    ends_at: v.optional(v.number()),
    created_at: v.number(),
  })
    .index("by_team", ["team_id"])
    .index("by_target", ["target_team_id"])
    .index("by_status", ["status"]),

  // Audit logs table
  auditLogs: defineTable({
    user_id: v.optional(v.id("users")),
    action: v.string(),
    details_json: v.string(),
    timestamp: v.number(),
  })
    .index("by_user", ["user_id"])
    .index("by_action", ["action"])
    .index("by_timestamp", ["timestamp"]),
});
