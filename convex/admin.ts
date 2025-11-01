import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Helper to hash flags
async function hashFlag(flag: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(flag + "SECRET_SALT_FOR_FLAGS");
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

// Helper to check if user is admin
async function requireAdmin(ctx: any, userId: string) {
  const user = await ctx.db.get(userId);
  if (!user || (user.role !== "admin" && user.role !== "organiser")) {
    throw new ConvexError("Admin access required");
  }
}

// Mutations
export const createRoom = mutation({
  args: {
    userId: v.id("users"),
    name: v.string(),
    orderIndex: v.number(),
    description: v.string(),
    brief: v.optional(v.string()),
    isChallenge: v.boolean(),
    unlockCost: v.number(),
    challengeInvestment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      orderIndex: args.orderIndex,
      description: args.description,
      brief: args.brief,
      isChallenge: args.isChallenge,
      unlockCost: args.unlockCost,
      challengeInvestment: args.challengeInvestment,
      challengeRewardMultiplier: 2.0,
      isActive: true,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "create_room",
      detailsJson: JSON.stringify({ roomName: args.name }),
      createdAt: Date.now(),
    });

    return { roomId, message: "Room created" };
  },
});

export const updateRoom = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.id("rooms"),
    name: v.string(),
    orderIndex: v.number(),
    description: v.string(),
    brief: v.optional(v.string()),
    isChallenge: v.boolean(),
    unlockCost: v.number(),
    challengeInvestment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new ConvexError("Room not found");
    }

    await ctx.db.patch(args.roomId, {
      name: args.name,
      orderIndex: args.orderIndex,
      description: args.description,
      brief: args.brief,
      isChallenge: args.isChallenge,
      unlockCost: args.unlockCost,
      challengeInvestment: args.challengeInvestment,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "update_room",
      detailsJson: JSON.stringify({ roomId: args.roomId }),
      createdAt: Date.now(),
    });

    return { message: "Room updated" };
  },
});

export const deleteRoom = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.id("rooms"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const room = await ctx.db.get(args.roomId);
    if (!room) {
      throw new ConvexError("Room not found");
    }

    await ctx.db.delete(args.roomId);

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "delete_room",
      detailsJson: JSON.stringify({ roomId: args.roomId }),
      createdAt: Date.now(),
    });

    return { message: "Room deleted" };
  },
});

export const createPuzzle = mutation({
  args: {
    userId: v.id("users"),
    roomId: v.id("rooms"),
    title: v.string(),
    type: v.string(),
    description: v.string(),
    flag: v.string(),
    pointsReward: v.number(),
    isChallenge: v.optional(v.boolean()),
    challengeTimerMinutes: v.optional(v.number()),
    challengePointsMultiplier: v.optional(v.number()),
    topic: v.optional(v.string()),
    difficulty: v.optional(v.string()),
    imageUrls: v.optional(v.array(v.string())),
    fileUrls: v.optional(v.array(v.object({ name: v.string(), url: v.string() }))),
    externalLinks: v.optional(v.array(v.object({ title: v.string(), url: v.string() }))),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const flagHash = await hashFlag(args.flag);

    const puzzleId = await ctx.db.insert("puzzles", {
      roomId: args.roomId,
      title: args.title,
      type: args.type,
      description: args.description,
      flagHash,
      pointsReward: args.pointsReward,
      isActive: true,
      isChallenge: args.isChallenge,
      challengeTimerMinutes: args.challengeTimerMinutes,
      challengePointsMultiplier: args.challengePointsMultiplier,
      topic: args.topic,
      difficulty: args.difficulty,
      imageUrls: args.imageUrls,
      fileUrls: args.fileUrls,
      externalLinks: args.externalLinks,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "create_puzzle",
      detailsJson: JSON.stringify({ puzzleTitle: args.title }),
      createdAt: Date.now(),
    });

    return { puzzleId, message: "Puzzle created" };
  },
});

export const updatePuzzle = mutation({
  args: {
    userId: v.id("users"),
    puzzleId: v.id("puzzles"),
    roomId: v.id("rooms"),
    title: v.string(),
    type: v.string(),
    description: v.string(),
    flag: v.string(),
    pointsReward: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const puzzle = await ctx.db.get(args.puzzleId);
    if (!puzzle) {
      throw new ConvexError("Puzzle not found");
    }

    const flagHash = await hashFlag(args.flag);

    await ctx.db.patch(args.puzzleId, {
      roomId: args.roomId,
      title: args.title,
      type: args.type,
      description: args.description,
      flagHash,
      pointsReward: args.pointsReward,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "update_puzzle",
      detailsJson: JSON.stringify({ puzzleId: args.puzzleId }),
      createdAt: Date.now(),
    });

    return { message: "Puzzle updated" };
  },
});

export const deletePuzzle = mutation({
  args: {
    userId: v.id("users"),
    puzzleId: v.id("puzzles"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const puzzle = await ctx.db.get(args.puzzleId);
    if (!puzzle) {
      throw new ConvexError("Puzzle not found");
    }

    await ctx.db.delete(args.puzzleId);

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "delete_puzzle",
      detailsJson: JSON.stringify({ puzzleId: args.puzzleId }),
      createdAt: Date.now(),
    });

    return { message: "Puzzle deleted" };
  },
});

export const createClue = mutation({
  args: {
    userId: v.id("users"),
    puzzleId: v.id("puzzles"),
    text: v.string(),
    cost: v.number(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    // Check if puzzle already has 3 clues
    const clueCount = await ctx.db
      .query("clues")
      .withIndex("by_puzzle", (q) => q.eq("puzzleId", args.puzzleId))
      .collect();

    if (clueCount.length >= 3) {
      throw new ConvexError("Maximum 3 clues per question allowed");
    }

    const clueId = await ctx.db.insert("clues", {
      puzzleId: args.puzzleId,
      text: args.text,
      cost: args.cost,
      isOneTime: true,
      orderIndex: args.orderIndex,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "create_clue",
      detailsJson: JSON.stringify({ puzzleId: args.puzzleId }),
      createdAt: Date.now(),
    });

    return { clueId, message: "Clue created" };
  },
});

export const updateClue = mutation({
  args: {
    userId: v.id("users"),
    clueId: v.id("clues"),
    text: v.string(),
    cost: v.number(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const clue = await ctx.db.get(args.clueId);
    if (!clue) {
      throw new ConvexError("Clue not found");
    }

    await ctx.db.patch(args.clueId, {
      text: args.text,
      cost: args.cost,
      orderIndex: args.orderIndex,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "update_clue",
      detailsJson: JSON.stringify({ clueId: args.clueId }),
      createdAt: Date.now(),
    });

    return { message: "Clue updated" };
  },
});

export const deleteClue = mutation({
  args: {
    userId: v.id("users"),
    clueId: v.id("clues"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const clue = await ctx.db.get(args.clueId);
    if (!clue) {
      throw new ConvexError("Clue not found");
    }

    await ctx.db.delete(args.clueId);

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "delete_clue",
      detailsJson: JSON.stringify({ clueId: args.clueId }),
      createdAt: Date.now(),
    });

    return { message: "Clue deleted" };
  },
});

export const overrideTeamProgress = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    newRoomId: v.id("rooms"),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    const room = await ctx.db.get(args.newRoomId);
    if (!room) {
      throw new ConvexError("Room not found");
    }

    await ctx.db.patch(args.teamId, {
      currentRoomId: args.newRoomId,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "override_team_progress",
      detailsJson: JSON.stringify({
        teamId: args.teamId,
        newRoomId: args.newRoomId,
        reason: args.reason,
      }),
      createdAt: Date.now(),
    });

    return { message: "Team progress overridden" };
  },
});

export const refundPoints = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    await ctx.db.patch(args.teamId, {
      pointsBalance: team.pointsBalance + args.amount,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "refund_points",
      detailsJson: JSON.stringify({ teamId: args.teamId, amount: args.amount }),
      createdAt: Date.now(),
    });

    return { message: `Refunded ${args.amount} points to ${team.name}` };
  },
});

export const disableTeam = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    await ctx.db.patch(args.teamId, {
      pointsBalance: 0,
      currentRoomId: undefined,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "disable_team",
      detailsJson: JSON.stringify({ teamId: args.teamId }),
      createdAt: Date.now(),
    });

    return { message: `Team ${team.name} disabled` };
  },
});

export const deleteTeamAdmin = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    // Get counts for audit log
    const members = await ctx.db
      .query("teamMembers")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();

    const pendingRequests = await ctx.db
      .query("teamJoinRequests")
      .withIndex("by_team_and_status", (q) => 
        q.eq("teamId", args.teamId).eq("status", "pending")
      )
      .collect();

    // Delete all team members
    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete all join requests
    const allRequests = await ctx.db
      .query("teamJoinRequests")
      .withIndex("by_team", (q) => q.eq("teamId", args.teamId))
      .collect();
    for (const request of allRequests) {
      await ctx.db.delete(request._id);
    }

    // Delete team
    await ctx.db.delete(args.teamId);

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "admin_delete_team",
      detailsJson: JSON.stringify({
        teamId: args.teamId,
        teamName: team.name,
        deletedMembers: members.length,
        deletedPendingRequests: pendingRequests.length,
      }),
      createdAt: Date.now(),
    });

    return { message: `Team ${team.name} deleted` };
  },
});

// Queries
export const getLogs = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .take(args.limit || 100);

    return logs;
  },
});

export const getAllTeams = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    return await ctx.db.query("teams").collect();
  },
});

export const getAllRooms = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const rooms = await ctx.db.query("rooms").collect();
    return rooms.sort((a, b) => a.orderIndex - b.orderIndex);
  },
});

export const getAllPuzzles = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    return await ctx.db.query("puzzles").collect();
  },
});

export const getCluesByPuzzle = query({
  args: {
    userId: v.id("users"),
    puzzleId: v.id("puzzles"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const clues = await ctx.db
      .query("clues")
      .withIndex("by_puzzle", (q) => q.eq("puzzleId", args.puzzleId))
      .collect();

    return clues.sort((a, b) => a.orderIndex - b.orderIndex);
  },
});

// Team moderation functions
export const skipQuestion = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    puzzleId: v.id("puzzles"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const puzzle = await ctx.db.get(args.puzzleId);
    if (!puzzle) {
      throw new ConvexError("Puzzle not found");
    }

    // Check if already submitted
    const existingSubmission = await ctx.db
      .query("submissions")
      .withIndex("by_team_and_puzzle", (q) =>
        q.eq("teamId", args.teamId).eq("puzzleId", args.puzzleId)
      )
      .first();

    if (existingSubmission && existingSubmission.isCorrect) {
      throw new ConvexError("Question already solved by team");
    }

    // Create or update submission as correct
    if (existingSubmission) {
      await ctx.db.patch(existingSubmission._id, {
        isCorrect: true,
        submissionTime: Date.now(),
      });
    } else {
      await ctx.db.insert("submissions", {
        teamId: args.teamId,
        puzzleId: args.puzzleId,
        submittedFlag: "ADMIN_SKIP",
        isCorrect: true,
        submissionTime: Date.now(),
      });
    }

    // Award points
    const team = await ctx.db.get(args.teamId);
    if (team) {
      await ctx.db.patch(args.teamId, {
        pointsBalance: team.pointsBalance + puzzle.pointsReward,
      });
    }

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "skip_question",
      detailsJson: JSON.stringify({ teamId: args.teamId, puzzleId: args.puzzleId }),
      createdAt: Date.now(),
    });

    return { message: "Question skipped for team" };
  },
});

export const awardPoints = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    points: v.number(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const team = await ctx.db.get(args.teamId);
    if (!team) {
      throw new ConvexError("Team not found");
    }

    await ctx.db.patch(args.teamId, {
      pointsBalance: team.pointsBalance + args.points,
    });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "award_points",
      detailsJson: JSON.stringify({ teamId: args.teamId, points: args.points, reason: args.reason }),
      createdAt: Date.now(),
    });

    return { message: `Awarded ${args.points} points to team` };
  },
});

export const skipTeamQuestion = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    puzzleId: v.id("puzzles"),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    // Mark the puzzle as solved for the team by inserting a correct submission
    await ctx.db.insert("submissions", {
      teamId: args.teamId,
      puzzleId: args.puzzleId,
      submittedFlag: "ADMIN_SKIP",
      isCorrect: true,
      submissionTime: Date.now(),
    });

    // If it's a room question, advance the team to the next room
    const puzzle = await ctx.db.get(args.puzzleId);
    if (puzzle?.isRoomQuestion && puzzle.skipToRoom) {
      await ctx.db.patch(args.teamId, { currentRoomId: puzzle.skipToRoom });
    }

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "skip_team_question",
      detailsJson: JSON.stringify({ teamId: args.teamId, puzzleId: args.puzzleId }),
      createdAt: Date.now(),
    });

    return { message: "Question skipped for team" };
  },
});

export const awardTeamPoints = mutation({
  args: {
    userId: v.id("users"),
    teamId: v.id("teams"),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.userId);

    const team = await ctx.db.get(args.teamId);
    if (!team) throw new ConvexError("Team not found");

    await ctx.db.patch(args.teamId, { pointsBalance: team.pointsBalance + args.points });

    await ctx.db.insert("auditLogs", {
      userId: args.userId,
      action: "award_team_points",
      detailsJson: JSON.stringify({ teamId: args.teamId, points: args.points }),
      createdAt: Date.now(),
    });

    return { message: `Awarded ${args.points} points to team` };
  },
});
