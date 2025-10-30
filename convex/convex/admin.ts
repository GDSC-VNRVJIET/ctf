import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Room management
export const createRoom = mutation({
  args: {
    name: v.string(),
    orderIndex: v.number(),
    description: v.string(),
    unlockCost: v.number(),
    isChallenge: v.boolean(),
  },
  handler: async (ctx, args) => {
    const roomId = await ctx.db.insert("rooms", {
      name: args.name,
      order_index: args.orderIndex,
      description: args.description,
      unlock_cost: args.unlockCost,
      is_challenge: args.isChallenge,
    });
    return { id: roomId };
  },
});

export const updateRoom = mutation({
  args: {
    roomId: v.string(),
    name: v.optional(v.string()),
    orderIndex: v.optional(v.number()),
    description: v.optional(v.string()),
    unlockCost: v.optional(v.number()),
    isChallenge: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.orderIndex !== undefined) updates.order_index = args.orderIndex;
    if (args.description !== undefined) updates.description = args.description;
    if (args.unlockCost !== undefined) updates.unlock_cost = args.unlockCost;
    if (args.isChallenge !== undefined) updates.is_challenge = args.isChallenge;

    await ctx.db.patch(args.roomId as any, updates);
    return { success: true };
  },
});

export const deleteRoom = mutation({
  args: { roomId: v.string() },
  handler: async (ctx, args) => {
    // Delete associated puzzles and clues
    const puzzles = await ctx.db
      .query("puzzles")
      .filter((q) => q.eq(q.field("room_id"), args.roomId as any))
      .collect();

    for (const puzzle of puzzles) {
      // Delete clues for this puzzle
      const clues = await ctx.db
        .query("clues")
        .filter((q) => q.eq(q.field("puzzle_id"), puzzle._id))
        .collect();

      for (const clue of clues) {
        await ctx.db.delete(clue._id);
      }

      // Delete submissions for this puzzle
      const submissions = await ctx.db
        .query("submissions")
        .filter((q) => q.eq(q.field("puzzle_id"), puzzle._id))
        .collect();

      for (const submission of submissions) {
        await ctx.db.delete(submission._id);
      }

      await ctx.db.delete(puzzle._id);
    }

    await ctx.db.delete(args.roomId as any);
    return { success: true };
  },
});

// Puzzle management
export const createPuzzle = mutation({
  args: {
    roomId: v.string(),
    title: v.string(),
    description: v.string(),
    points: v.number(),
    flagHash: v.string(),
    orderIndex: v.number(),
  },
  handler: async (ctx, args) => {
    const puzzleId = await ctx.db.insert("puzzles", {
      room_id: args.roomId as any,
      title: args.title,
      description: args.description,
      points: args.points,
      flag_hash: args.flagHash,
      order_index: args.orderIndex,
    });
    return { id: puzzleId };
  },
});

export const updatePuzzle = mutation({
  args: {
    puzzleId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    points: v.optional(v.number()),
    flagHash: v.optional(v.string()),
    orderIndex: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const updates: any = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.points !== undefined) updates.points = args.points;
    if (args.flagHash !== undefined) updates.flag_hash = args.flagHash;
    if (args.orderIndex !== undefined) updates.order_index = args.orderIndex;

    await ctx.db.patch(args.puzzleId as any, updates);
    return { success: true };
  },
});

export const deletePuzzle = mutation({
  args: { puzzleId: v.string() },
  handler: async (ctx, args) => {
    // Delete associated clues and submissions
    const clues = await ctx.db
      .query("clues")
      .filter((q) => q.eq(q.field("puzzle_id"), args.puzzleId as any))
      .collect();

    for (const clue of clues) {
      await ctx.db.delete(clue._id);
    }

    const submissions = await ctx.db
      .query("submissions")
      .filter((q) => q.eq(q.field("puzzle_id"), args.puzzleId as any))
      .collect();

    for (const submission of submissions) {
      await ctx.db.delete(submission._id);
    }

    await ctx.db.delete(args.puzzleId as any);
    return { success: true };
  },
});

// Clue management
export const createClue = mutation({
  args: {
    puzzleId: v.string(),
    content: v.string(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const clueId = await ctx.db.insert("clues", {
      puzzle_id: args.puzzleId as any,
      content: args.content,
      cost: args.cost,
    });
    return { id: clueId };
  },
});

// Team management
export const getAllTeams = query({
  handler: async (ctx) => {
    const teams = await ctx.db.query("teams").collect();

    const teamsWithMembers = await Promise.all(
      teams.map(async (team) => {
        const members = await ctx.db
          .query("teamMembers")
          .filter((q) => q.eq(q.field("team_id"), team._id))
          .collect();

        return {
          id: team._id,
          name: team.name,
          description: team.description,
          max_members: team.max_members,
          points_balance: team.points_balance,
          current_room_id: team.current_room_id,
          shield_active: team.shield_active,
          shield_expiry: team.shield_expiry,
          disabled: team.disabled,
          member_count: members.length,
          created_at: team.created_at,
        };
      })
    );

    return teamsWithMembers;
  },
});

export const overrideTeamProgress = mutation({
  args: {
    teamId: v.string(),
    roomId: v.optional(v.string()),
    pointsAdjustment: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("_id"), args.teamId))
      .first();
    if (!team) {
      throw new Error("Team not found");
    }

    const updates: any = {};
    if (args.roomId !== undefined) updates.current_room_id = args.roomId as any;
    if (args.pointsAdjustment !== undefined) {
      updates.points_balance = team.points_balance + args.pointsAdjustment;
    }

    await ctx.db.patch(args.teamId as any, updates);
    return { success: true };
  },
});

export const refundPoints = mutation({
  args: {
    teamId: v.string(),
    amount: v.number(),
  },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("_id"), args.teamId))
      .first();
    if (!team) {
      throw new Error("Team not found");
    }

    await ctx.db.patch(args.teamId as any, {
      points_balance: team.points_balance + args.amount,
    });
    return { success: true };
  },
});

export const disableTeam = mutation({
  args: { teamId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.teamId as any, { disabled: true });
    return { success: true };
  },
});

export const deleteTeamAdmin = mutation({
  args: { teamId: v.string(), adminId: v.string() },
  handler: async (ctx, args) => {
    // Delete team members
    const members = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .collect();

    for (const member of members) {
      await ctx.db.delete(member._id);
    }

    // Delete join requests
    const requests = await ctx.db
      .query("teamJoinRequests")
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .collect();

    for (const request of requests) {
      await ctx.db.delete(request._id);
    }

    // Delete team
    await ctx.db.delete(args.teamId as any);
    return { success: true };
  },
});

// Audit logs
export const getAuditLogs = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    const logs = await ctx.db
      .query("auditLogs")
      .order("desc")
      .paginate({ numItems: limit, cursor: null });

    const logDetails = await Promise.all(
      logs.page.map(async (log) => {
        let user = null;
        if (log.user_id) {
          user = await ctx.db.get(log.user_id);
        }

        return {
          id: log._id,
          user_id: log.user_id,
          user_name: user?.name || null,
          action: log.action,
          details_json: log.details_json,
          timestamp: log.timestamp,
        };
      })
    );

    return {
      logs: logDetails,
      hasMore: !logs.isDone,
      nextCursor: logs.continueCursor,
    };
  },
});
