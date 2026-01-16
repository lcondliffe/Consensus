import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  sessions: defineTable({
    userId: v.string(),
    prompt: v.string(),
    responses: v.array(
      v.object({
        modelId: v.string(),
        modelName: v.string(),
        content: v.string(),
        error: v.union(v.string(), v.null()),
        latencyMs: v.union(v.number(), v.null()),
      })
    ),
    verdict: v.union(
      v.object({
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
        voteCount: v.optional(v.any()),
        consensusResult: v.optional(
          v.object({
            synthesizedResponse: v.string(),
            attributions: v.array(
              v.object({
                modelId: v.string(),
                modelName: v.string(),
                contribution: v.string(),
              })
            ),
            keyPoints: v.array(
              v.object({
                point: v.string(),
                sourceModelIds: v.array(v.string()),
              })
            ),
          })
        ),
      }),
      v.null()
    ),
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
    isComplete: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']).index('by_user_created', ['userId', 'createdAt']),

  userPreferences: defineTable({
    userId: v.string(),
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
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index('by_user', ['userId']),
});
