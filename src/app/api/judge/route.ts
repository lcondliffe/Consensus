import { NextRequest, NextResponse } from 'next/server';
import {
  JudgingCriteria,
  getCriteriaById,
  DEFAULT_CRITERIA_ID,
  formatCriteriaForPrompt,
} from '@/lib/criteria';
import { JudgingMode, JudgeVote, ConsensusResult, ConsensusAttribution, ConsensusKeyPoint } from '@/lib/types';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface ResponseInfo {
  modelId: string;
  modelName: string;
  content: string;
}

interface JudgeRequest {
  prompt: string;
  responses: ResponseInfo[];
  // Single judge mode (backward compatible)
  judgeModelId?: string;
  // Multi-judge mode
  judgingMode?: JudgingMode;
  judgeModelIds?: string[]; // For executive mode
  judgeModelNames?: Record<string, string>; // modelId -> displayName
  criteria?: JudgingCriteria;
  criteriaId?: string;
}

interface SingleJudgeVerdict {
  winnerModelId: string;
  winnerModelName: string;
  reasoning: string;
  scores: Array<{
    modelId: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
}

interface MultiJudgeVerdict extends SingleJudgeVerdict {
  judgingMode: JudgingMode;
  votes: JudgeVote[];
  voteCount: Record<string, number>;
}

interface ConsensusVerdict {
  winnerModelId: string;
  winnerModelName: string;
  reasoning: string;
  scores: Array<{
    modelId: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
  judgingMode: 'consensus';
  consensusResult: ConsensusResult;
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 }
      );
    }

    const body: JudgeRequest = await request.json();
    const { 
      prompt, 
      responses, 
      judgeModelId, 
      judgingMode = 'judge',
      judgeModelIds,
      judgeModelNames = {},
      criteria, 
      criteriaId 
    } = body;

    if (!prompt || !responses || responses.length < 2) {
      return NextResponse.json(
        { error: 'Prompt and at least 2 responses required' },
        { status: 400 }
      );
    }

    // Resolve criteria
    const resolvedCriteria =
      criteria || getCriteriaById(criteriaId || DEFAULT_CRITERIA_ID) || getCriteriaById(DEFAULT_CRITERIA_ID)!;

    // Handle consensus mode separately
    if (judgingMode === 'consensus') {
      if (!judgeModelId) {
        return NextResponse.json(
          { error: 'Judge model required for consensus mode' },
          { status: 400 }
        );
      }

      const consensusPrompt = buildConsensusPrompt(prompt, responses, resolvedCriteria);

      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'Consensus Synthesis',
          },
          body: JSON.stringify({
            model: judgeModelId,
            messages: [{ role: 'user', content: consensusPrompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error?.message || `Judge failed: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) {
          throw new Error('No response from consensus judge');
        }

        const consensusData = parseConsensusResponse(content, responses);

        const result: ConsensusVerdict = {
          winnerModelId: '',
          winnerModelName: '',
          reasoning: `Synthesized response combining insights from ${responses.length} models.`,
          scores: consensusData.scores,
          judgingMode: 'consensus',
          consensusResult: {
            synthesizedResponse: consensusData.synthesizedResponse,
            attributions: consensusData.attributions,
            keyPoints: consensusData.keyPoints,
          },
        };

        return NextResponse.json(result);
      } catch (error) {
        console.error('Consensus synthesis error:', error);
        return NextResponse.json(
          { error: error instanceof Error ? error.message : 'Consensus synthesis failed' },
          { status: 500 }
        );
      }
    }

    // Determine which models will judge
    let judges: string[];
    if (judgingMode === 'committee') {
      // All responding models are judges (excluding their own response when judging)
      judges = responses.map(r => r.modelId);
    } else if (judgingMode === 'executive' && judgeModelIds && judgeModelIds.length > 0) {
      judges = judgeModelIds;
    } else {
      // Single judge mode
      if (!judgeModelId) {
        return NextResponse.json(
          { error: 'Judge model required' },
          { status: 400 }
        );
      }
      judges = [judgeModelId];
    }

    // Query all judges in parallel
    const votePromises = judges.map(async (judgeId) => {
      // For committee mode, exclude the judge's own response
      const responsesToJudge = judgingMode === 'committee'
        ? responses.filter(r => r.modelId !== judgeId)
        : responses;

      if (responsesToJudge.length < 2) {
        // Not enough responses for this judge to evaluate
        return null;
      }

      const judgePrompt = buildJudgePrompt(prompt, responsesToJudge, resolvedCriteria);

      try {
        const response = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
            'X-Title': 'Consensus Judge',
          },
          body: JSON.stringify({
            model: judgeId,
            messages: [{ role: 'user', content: judgePrompt }],
            response_format: { type: 'json_object' },
          }),
        });

        if (!response.ok) {
          console.error(`Judge ${judgeId} failed: ${response.status}`);
          return null;
        }

        const data = await response.json();
        const content = data.choices?.[0]?.message?.content;

        if (!content) return null;

        const verdict = parseJudgeResponse(content, responsesToJudge);
        const judgeName = judgeModelNames[judgeId] || judgeId.split('/').pop() || judgeId;

        return {
          judgeModelId: judgeId,
          judgeModelName: judgeName,
          winnerModelId: verdict.winnerModelId,
          reasoning: verdict.reasoning,
          scores: verdict.scores,
        } as JudgeVote;
      } catch (error) {
        console.error(`Judge ${judgeId} error:`, error);
        return null;
      }
    });

    const voteResults = await Promise.all(votePromises);
    const votes = voteResults.filter((v): v is JudgeVote => v !== null);

    if (votes.length === 0) {
      return NextResponse.json(
        { error: 'No judges were able to evaluate the responses' },
        { status: 500 }
      );
    }

    // Aggregate votes
    const voteCount: Record<string, number> = {};
    votes.forEach(vote => {
      voteCount[vote.winnerModelId] = (voteCount[vote.winnerModelId] || 0) + 1;
    });

    // Find winner (most votes)
    let winnerModelId = '';
    let maxVotes = 0;
    Object.entries(voteCount).forEach(([modelId, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        winnerModelId = modelId;
      }
    });

    const winnerModelName = responses.find(r => r.modelId === winnerModelId)?.modelName || winnerModelId;

    // Aggregate scores (average across judges)
    const scoreMap = new Map<string, { total: number; count: number; strengths: string[]; weaknesses: string[] }>();
    votes.forEach(vote => {
      vote.scores.forEach(score => {
        const existing = scoreMap.get(score.modelId) || { total: 0, count: 0, strengths: [], weaknesses: [] };
        existing.total += score.score;
        existing.count += 1;
        existing.strengths.push(...score.strengths);
        existing.weaknesses.push(...score.weaknesses);
        scoreMap.set(score.modelId, existing);
      });
    });

    const aggregatedScores = Array.from(scoreMap.entries()).map(([modelId, data]) => ({
      modelId,
      score: Math.round(data.total / data.count),
      strengths: Array.from(new Set(data.strengths)).slice(0, 3),
      weaknesses: Array.from(new Set(data.weaknesses)).slice(0, 3),
    }));

    // Build reasoning summary
    const reasoning = judges.length === 1
      ? votes[0].reasoning
      : `${winnerModelName} won with ${maxVotes}/${votes.length} votes. ` +
        votes.filter(v => v.winnerModelId === winnerModelId)
          .map(v => v.reasoning)
          .slice(0, 2)
          .join(' ');

    const result: MultiJudgeVerdict = {
      winnerModelId,
      winnerModelName,
      reasoning,
      scores: aggregatedScores,
      judgingMode,
      votes,
      voteCount,
    };

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildJudgePrompt(
  originalPrompt: string,
  responses: JudgeRequest['responses'],
  criteria: JudgingCriteria
): string {
  const responsesText = responses
    .map(
      (r, i) => `
### Response ${i + 1}: ${r.modelName} (${r.modelId})
${r.content}
`
    )
    .join('\n---\n');

  const criteriaText = formatCriteriaForPrompt(criteria);
  const criteriaNames = criteria.criteria.map((c) => c.name).join(', ');

  return `You are an expert judge evaluating AI model responses. Your task is to analyze the following responses to a user prompt and determine which is best.

## Original User Prompt
${originalPrompt}

## Responses to Evaluate
${responsesText}

## Evaluation Criteria: ${criteria.name}
${criteria.description}

Evaluate each response based on these criteria (higher weight = more important):
${criteriaText}

## Your Task
Score each response on the criteria above, then determine the overall winner. Weight your evaluation according to the importance scores.

Provide your evaluation as a JSON object with this exact structure:
{
  "winnerModelId": "the model ID of the best response",
  "winnerModelName": "the display name of the winner",
  "reasoning": "A 2-3 sentence explanation of why this response won, specifically referencing how it performed on ${criteriaNames}",
  "scores": [
    {
      "modelId": "model ID",
      "score": 85,
      "strengths": ["strength 1 relating to criteria", "strength 2"],
      "weaknesses": ["weakness 1 relating to criteria"]
    }
  ]
}

The score should be 0-100, weighted by the criteria importance. Be specific - reference actual content from the responses and how it relates to the evaluation criteria.`;
}

function parseJudgeResponse(
  content: string,
  responses: JudgeRequest['responses']
): SingleJudgeVerdict {
  try {
    // Try to parse as JSON directly
    const parsed = JSON.parse(content);
    
    // Validate the structure
    if (parsed.winnerModelId && parsed.reasoning && parsed.scores) {
      return {
        winnerModelId: parsed.winnerModelId,
        winnerModelName: parsed.winnerModelName || 
          responses.find(r => r.modelId === parsed.winnerModelId)?.modelName || 
          parsed.winnerModelId,
        reasoning: parsed.reasoning,
        scores: parsed.scores,
      };
    }
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return {
          winnerModelId: parsed.winnerModelId,
          winnerModelName: parsed.winnerModelName || 
            responses.find(r => r.modelId === parsed.winnerModelId)?.modelName || 
            parsed.winnerModelId,
          reasoning: parsed.reasoning,
          scores: parsed.scores || [],
        };
      } catch {
        // Fall through to default
      }
    }
  }

  // Default fallback - pick first response as winner with explanation
  return {
    winnerModelId: responses[0].modelId,
    winnerModelName: responses[0].modelName,
    reasoning: 'Unable to parse judge response. Defaulting to first response.',
    scores: responses.map((r) => ({
      modelId: r.modelId,
      score: 50,
      strengths: [],
      weaknesses: [],
    })),
  };
}

function buildConsensusPrompt(
  originalPrompt: string,
  responses: JudgeRequest['responses'],
  criteria: JudgingCriteria
): string {
  const responsesText = responses
    .map(
      (r, i) => `
### Response ${i + 1}: ${r.modelName} (${r.modelId})
${r.content}
`
    )
    .join('\n---\n');

  const criteriaText = formatCriteriaForPrompt(criteria);

  return `You are an expert synthesizer creating a unified response from multiple AI model answers. Your task is to combine the best elements from each response into a comprehensive, authoritative answer.

## Original User Prompt
${originalPrompt}

## Responses to Synthesize
${responsesText}

## Evaluation Criteria: ${criteria.name}
${criteria.description}

Use these criteria to evaluate which parts of each response are strongest:
${criteriaText}

## Your Task
Analyze each response and create a synthesized answer that combines the best insights from all models. Track which models contributed each key element.

Provide your synthesis as a JSON object with this exact structure:
{
  "synthesizedResponse": "A comprehensive answer that combines the strongest elements from all responses. This should be a complete, well-structured response to the original prompt.",
  "attributions": [
    {
      "modelId": "the model's ID",
      "modelName": "the model's display name",
      "contribution": "A brief description of what unique value this model added to the synthesis"
    }
  ],
  "keyPoints": [
    {
      "point": "A key insight or element included in the synthesis",
      "sourceModelIds": ["modelId1", "modelId2"]
    }
  ],
  "scores": [
    {
      "modelId": "model ID",
      "score": 85,
      "strengths": ["what this model did well"],
      "weaknesses": ["where this model could improve"]
    }
  ]
}

Guidelines:
- The synthesizedResponse should be a complete, polished answer that reads naturally
- Include attributions for ALL models, explaining what each uniquely contributed
- keyPoints should highlight the main insights with credit to source models
- Scores (0-100) reflect how much each model contributed to the final synthesis
- Be specific about what each model added - reference actual content from their responses`;
}

interface ParsedConsensusData {
  synthesizedResponse: string;
  attributions: ConsensusAttribution[];
  keyPoints: ConsensusKeyPoint[];
  scores: Array<{
    modelId: string;
    score: number;
    strengths: string[];
    weaknesses: string[];
  }>;
}

function parseConsensusResponse(
  content: string,
  responses: JudgeRequest['responses']
): ParsedConsensusData {
  try {
    const parsed = JSON.parse(content);

    if (parsed.synthesizedResponse) {
      return {
        synthesizedResponse: parsed.synthesizedResponse,
        attributions: parsed.attributions || responses.map(r => ({
          modelId: r.modelId,
          modelName: r.modelName,
          contribution: 'Contributed to the synthesis',
        })),
        keyPoints: parsed.keyPoints || [],
        scores: parsed.scores || responses.map(r => ({
          modelId: r.modelId,
          score: 70,
          strengths: [],
          weaknesses: [],
        })),
      };
    }
  } catch {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        return {
          synthesizedResponse: parsed.synthesizedResponse || '',
          attributions: parsed.attributions || [],
          keyPoints: parsed.keyPoints || [],
          scores: parsed.scores || [],
        };
      } catch {
        // Fall through to default
      }
    }
  }

  // Default fallback - combine responses as-is
  return {
    synthesizedResponse: 'Unable to synthesize responses. Please see individual model responses above.',
    attributions: responses.map(r => ({
      modelId: r.modelId,
      modelName: r.modelName,
      contribution: 'Response included in synthesis attempt',
    })),
    keyPoints: [],
    scores: responses.map(r => ({
      modelId: r.modelId,
      score: 50,
      strengths: [],
      weaknesses: [],
    })),
  };
}
