import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Create a new session when user submits a prompt
export const create = mutation({
  args: {
    userId: v.string(),
    prompt: v.string(),
    committeeModelIds: v.array(v.string()),
    judgeModelId: v.string(),
    judgingMode: v.string(),
    judgingCriteria: v.object({
      id: v.string(),
      name: v.string(),
      description: v.string(),
      criteria: v.array(
        v.object({
          name: v.string(),
          weight: v.number(),
          description: v.string(),
        })
      ),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const sessionId = await ctx.db.insert('sessions', {
      userId: args.userId,
      prompt: args.prompt,
      responses: [],
      verdict: null,
      committeeModelIds: args.committeeModelIds,
      judgeModelId: args.judgeModelId,
      judgingMode: args.judgingMode,
      judgingCriteria: args.judgingCriteria,
      isComplete: false,
      createdAt: now,
      updatedAt: now,
    });
    return sessionId;
  },
});

// Update session with responses (called after streaming completes)
export const updateResponses = mutation({
  args: {
    sessionId: v.id('sessions'),
    responses: v.array(
      v.object({
        modelId: v.string(),
        modelName: v.string(),
        content: v.string(),
        error: v.union(v.string(), v.null()),
        latencyMs: v.union(v.number(), v.null()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
      throw new Error('Not found or unauthorized');
    }
    await ctx.db.patch(args.sessionId, {
      responses: args.responses,
      updatedAt: Date.now(),
    });
  },
});

// Update session with verdict (called after judge evaluates)
export const updateVerdict = mutation({
  args: {
    sessionId: v.id('sessions'),
    verdict: v.object({
      winnerModelId: v.string(),
      winnerModelName: v.string(),
      reasoning: v.string(),
      scores: v.array(
        v.object({
          modelId: v.string(),
          score: v.number(),
          strengths: v.array(v.string()),
          weaknesses: v.array(v.string()),
        })
      ),
      judgingMode: v.optional(v.string()),
      votes: v.optional(
        v.array(
          v.object({
            judgeModelId: v.string(),
            judgeModelName: v.string(),
            winnerModelId: v.string(),
            reasoning: v.string(),
            scores: v.array(
              v.object({
                modelId: v.string(),
                score: v.number(),
                strengths: v.array(v.string()),
                weaknesses: v.array(v.string()),
              })
            ),
          })
        )
      ),
      voteCount: v.optional(v.record(v.string(), v.number())),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
      throw new Error('Not found or unauthorized');
    }
    await ctx.db.patch(args.sessionId, {
      verdict: args.verdict,
      isComplete: true,
      updatedAt: Date.now(),
    });
  },
});

// List sessions for a user (most recent first)
export const listByUser = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;
    const sessions = await ctx.db
      .query('sessions')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .order('desc')
      .take(limit);
    return sessions;
  },
});

// Get a single session by ID
export const get = query({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

// Delete a session
export const remove = mutation({
  args: {
    sessionId: v.id('sessions'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }
    const session = await ctx.db.get(args.sessionId);
    if (!session || session.userId !== identity.subject) {
      throw new Error('Not found or unauthorized');
    }
    await ctx.db.delete(args.sessionId);
  },
});
