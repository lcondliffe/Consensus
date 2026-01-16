import { v } from 'convex/values';
import { mutation, query } from './_generated/server';

// Get user preferences
export const get = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return null;
    }
    const preferences = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first();
    return preferences;
  },
});

// Save user preferences (upsert)
export const save = mutation({
  args: {
    committeeModelIds: v.array(v.string()),
    judgeModelId: v.string(),
    judgingMode: v.string(),
    executiveJudgeIds: v.optional(v.array(v.string())),
    criteriaId: v.string(),
    customCriteria: v.optional(
      v.object({
        name: v.string(),
        description: v.string(),
        criteria: v.array(
          v.object({
            name: v.string(),
            weight: v.number(),
            description: v.string(),
          })
        ),
      })
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    const userId = identity.subject;
    const now = Date.now();

    const existing = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        updatedAt: now,
      });
      return existing._id;
    } else {
      const id = await ctx.db.insert('userPreferences', {
        userId,
        ...args,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    }
  },
});

// Reset user preferences (delete)
export const reset = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    const existing = await ctx.db
      .query('userPreferences')
      .withIndex('by_user', (q) => q.eq('userId', identity.subject))
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});
