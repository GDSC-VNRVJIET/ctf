import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get team by ID
export const getTeam = query({
  args: { teamId: v.string() },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("_id"), args.teamId))
      .first();
    if (!team) return null;

    const members = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("team_id"), team._id))
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.user_id);
        return user ? {
          id: user._id,
          name: user.name,
          email: user.email,
        } : null;
      })
    );

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
      members: memberDetails.filter(Boolean),
      member_count: members.length,
    };
  },
});

// Get team by invite code
export const getTeamByInviteCode = query({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const team = await ctx.db
      .query("teams")
      .filter((q) => q.eq(q.field("invite_code"), args.inviteCode))
      .first();

    if (!team) return null;

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
      invite_code: team.invite_code,
    };
  },
});

// Get team members
export const getTeamMembers = query({
  args: { teamId: v.string() },
  handler: async (ctx, args) => {
    const members = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .collect();

    const memberDetails = await Promise.all(
      members.map(async (member) => {
        const user = await ctx.db.get(member.user_id);
        return user ? {
          id: user._id,
          name: user.name,
          email: user.email,
          joined_at: member.joined_at,
        } : null;
      })
    );

    return memberDetails.filter(Boolean);
  },
});

// Create team
export const createTeam = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    max_members: v.optional(v.number()),
    creator_id: v.string(),
  },
  handler: async (ctx, args) => {
    // Generate unique invite code
    const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();

    const teamId = await ctx.db.insert("teams", {
      name: args.name,
      description: args.description,
      max_members: args.max_members || 5,
      points_balance: 0,
      shield_active: false,
      disabled: false,
      invite_code: inviteCode,
      created_at: Date.now(),
    });

    // Add creator as team member
    await ctx.db.insert("teamMembers", {
      user_id: args.creator_id as any,
      team_id: teamId as any,
      joined_at: Date.now(),
    });

    return { id: teamId, invite_code: inviteCode };
  },
});

// Join team
export const joinTeam = mutation({
  args: { teamId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const existingMembership = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("user_id"), args.userId as any))
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .first();

    if (existingMembership) {
      throw new Error("User is already a member of this team");
    }

    await ctx.db.insert("teamMembers", {
      user_id: args.userId as any,
      team_id: args.teamId as any,
      joined_at: Date.now(),
    });

    return { success: true };
  },
});

// Leave team
export const leaveTeam = mutation({
  args: { teamId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const member = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("user_id"), args.userId as any))
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .first();

    if (!member) {
      throw new Error("User is not a member of this team");
    }

    await ctx.db.delete(member._id);
    return { success: true };
  },
});

// Request to join team
export const requestJoinTeam = mutation({
  args: { teamId: v.string(), userId: v.string() },
  handler: async (ctx, args) => {
    const existingRequest = await ctx.db
      .query("teamJoinRequests")
      .filter((q) => q.eq(q.field("user_id"), args.userId as any))
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .first();

    if (existingRequest) {
      throw new Error("Join request already exists");
    }

    const requestId = await ctx.db.insert("teamJoinRequests", {
      user_id: args.userId as any,
      team_id: args.teamId as any,
      status: "pending",
      requested_at: Date.now(),
    });

    return { id: requestId };
  },
});

// Get team join requests
export const getTeamJoinRequests = query({
  args: { teamId: v.string() },
  handler: async (ctx, args) => {
    const requests = await ctx.db
      .query("teamJoinRequests")
      .filter((q) => q.eq(q.field("team_id"), args.teamId as any))
      .collect();

    const requestDetails = await Promise.all(
      requests.map(async (request) => {
        const user = await ctx.db.get(request.user_id);
        return user ? {
          id: request._id,
          user: {
            id: user._id,
            name: user.name,
            email: user.email,
          },
          status: request.status,
          requested_at: request.requested_at,
        } : null;
      })
    );

    return requestDetails.filter(Boolean);
  },
});

// Respond to join request
export const respondToJoinRequest = mutation({
  args: {
    requestId: v.string(),
    accept: v.boolean(),
    adminId: v.string(),
  },
  handler: async (ctx, args) => {
    const request = await ctx.db
      .query("teamJoinRequests")
      .filter((q) => q.eq(q.field("_id"), args.requestId))
      .first();
    if (!request) {
      throw new Error("Join request not found");
    }

    const newStatus = args.accept ? "accepted" : "rejected";

    await ctx.db.patch(args.requestId as any, {
      status: newStatus,
      responded_at: Date.now(),
    });

    if (args.accept) {
      // Add user to team
      await ctx.db.insert("teamMembers", {
        user_id: request.user_id,
        team_id: request.team_id,
        joined_at: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get user's teams
export const getUserTeams = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const memberships = await ctx.db
      .query("teamMembers")
      .filter((q) => q.eq(q.field("user_id"), args.userId as any))
      .collect();

    const teams = await Promise.all(
      memberships.map(async (membership) => {
        const team = await ctx.db
          .query("teams")
          .filter((q) => q.eq(q.field("_id"), membership.team_id))
          .first();
        return team;
      })
    );

    return teams.filter(Boolean).map(team => ({
      id: team!._id,
      name: team!.name,
      description: team!.description,
      points_balance: team!.points_balance,
      current_room_id: team!.current_room_id,
      member_count: 0, // Will be calculated separately if needed
    }));
  },
});
