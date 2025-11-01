import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    email: v.string(),
    passwordHash: v.string(),
    name: v.string(),
    role: v.string(), // player, team_captain, admin, organiser
    isVerified: v.boolean(),
    isAdmin: v.optional(v.boolean()), // Additional admin flag
    createdAt: v.number(),
  })
    .index("by_email", ["email"])
    .searchIndex("search_email", {
      searchField: "email",
    }),

  teams: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    captainUserId: v.id("users"),
    capacity: v.number(),
    pointsBalance: v.number(),
    currentRoomId: v.optional(v.id("rooms")),
    highestRoomId: v.optional(v.id("rooms")), // Highest room unlocked for ranking
    shieldActive: v.boolean(),
    shieldExpiry: v.optional(v.number()),
    inviteCode: v.string(),
    createdAt: v.number(),
    immunityUntil: v.optional(v.number()),
    onboardingComplete: v.optional(v.boolean()), // New field for onboarding
    rulesFlagSubmitted: v.optional(v.boolean()), // New field for flag submission tracking
    lastAttackTime: v.optional(v.number()), // Track last attack for cooldown
    shieldPurchaseTime: v.optional(v.number()), // Track shield purchase time
    nameVerified: v.optional(v.boolean()), // Flag for unique name validation
  })
    .index("by_name", ["name"])
    .index("by_invite", ["inviteCode"])
    .index("by_captain", ["captainUserId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    joinedAt: v.number(),
    role: v.string(), // captain, member
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_user", ["teamId", "userId"]),

  rooms: defineTable({
    name: v.string(),
    orderIndex: v.number(),
    description: v.string(),
    brief: v.optional(v.string()), // Story/briefing text shown when entering room
    isActive: v.boolean(),
    isChallenge: v.boolean(),
    unlockCost: v.number(),
    challengeInvestment: v.optional(v.number()),
    challengeRewardMultiplier: v.number(),
  })
    .index("by_order", ["orderIndex"])
    .index("by_active", ["isActive"]),

  puzzles: defineTable({
    roomId: v.id("rooms"),
    title: v.string(),
    type: v.string(), // static_flag, interactive, question
    description: v.string(),
    flagHash: v.string(),
    pointsReward: v.number(),
    isActive: v.boolean(),
    isRoomQuestion: v.optional(v.boolean()), // New field for room questions
    skipToRoom: v.optional(v.id("rooms")), // New field for skip destination
    isChallenge: v.optional(v.boolean()), // Mark as challenge question
    challengeTimerMinutes: v.optional(v.number()), // Timer duration for challenge
    challengePointsMultiplier: v.optional(v.number()), // Point multiplier (e.g., 2x)
    topic: v.optional(v.string()), // Category/topic (e.g., "Cryptography")
    difficulty: v.optional(v.string()), // very_easy, easy, medium, hard, very_hard
    imageUrls: v.optional(v.array(v.string())), // Image URLs for challenge
    fileUrls: v.optional(v.array(v.object({ name: v.string(), url: v.string() }))), // File downloads
    externalLinks: v.optional(v.array(v.object({ title: v.string(), url: v.string() }))), // External links
  })
    .index("by_room", ["roomId"])
    .index("by_active", ["isActive"]),

  rules: defineTable({
    content: v.string(),
    hiddenFlag: v.string(),
    isActive: v.boolean(),
  }),

  clues: defineTable({
    puzzleId: v.id("puzzles"),
    text: v.string(),
    cost: v.number(),
    isOneTime: v.boolean(),
    orderIndex: v.number(),
  })
    .index("by_puzzle", ["puzzleId"])
    .index("by_puzzle_and_order", ["puzzleId", "orderIndex"]),

  perks: defineTable({
    name: v.string(),
    description: v.string(),
    cost: v.number(),
    effectJson: v.string(), // JSON string with effect details
    isOneTime: v.boolean(),
    perkType: v.string(), // tool, defense, attack
  }),

  purchases: defineTable({
    teamId: v.id("teams"),
    perkId: v.optional(v.id("perks")),
    clueId: v.optional(v.id("clues")),
    purchasedAt: v.number(),
    usedAt: v.optional(v.number()),
    purchaseMetadata: v.optional(v.string()),
  })
    .index("by_team", ["teamId"])
    .index("by_team_and_perk", ["teamId", "perkId"])
    .index("by_team_and_clue", ["teamId", "clueId"]),

  actions: defineTable({
    teamId: v.id("teams"),
    actionType: v.string(), // attack, defend, invest
    targetTeamId: v.optional(v.id("teams")),
    cost: v.number(),
    resultJson: v.optional(v.string()),
    createdAt: v.number(),
    endsAt: v.optional(v.number()),
    status: v.string(), // active, expired, blocked
    cooldownUntil: v.optional(v.number()), // Track 5-minute cooldown for attacker
  })
    .index("by_team", ["teamId"])
    .index("by_target", ["targetTeamId"])
    .index("by_status", ["status"])
    .index("by_target_and_status", ["targetTeamId", "status"]),

  submissions: defineTable({
    teamId: v.id("teams"),
    puzzleId: v.id("puzzles"),
    submittedFlag: v.string(),
    isCorrect: v.boolean(),
    submissionTime: v.number(),
    ipAddress: v.optional(v.string()),
  })
    .index("by_team", ["teamId"])
    .index("by_puzzle", ["puzzleId"])
    .index("by_team_and_puzzle", ["teamId", "puzzleId"])
    .index("by_team_and_correct", ["teamId", "isCorrect"]),

  auditLogs: defineTable({
    userId: v.optional(v.id("users")),
    action: v.string(),
    detailsJson: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_action", ["action"])
    .index("by_created", ["createdAt"]),

  leaderboardSnapshots: defineTable({
    teamId: v.id("teams"),
    score: v.number(),
    roomIndex: v.number(),
    createdAt: v.number(),
  })
    .index("by_team", ["teamId"])
    .index("by_created", ["createdAt"]),

  teamJoinRequests: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    status: v.string(), // pending, accepted, rejected
    requestedAt: v.number(),
    respondedAt: v.optional(v.number()),
  })
    .index("by_team", ["teamId"])
    .index("by_user", ["userId"])
    .index("by_team_and_status", ["teamId", "status"])
    .index("by_user_and_status", ["userId", "status"]),

  challengeAttempts: defineTable({
    teamId: v.id("teams"),
    challengeId: v.id("puzzles"),
    startedAt: v.number(),
    endsAt: v.number(),
    investment: v.number(),
    isCompleted: v.boolean(),
    isPassed: v.optional(v.boolean()),
    solvedAt: v.optional(v.number()),
  })
    .index("by_team", ["teamId"])
    .index("by_challenge", ["challengeId"])
    .index("by_team_and_challenge", ["teamId", "challengeId"])
    .index("by_team_and_completed", ["teamId", "isCompleted"]),
});
