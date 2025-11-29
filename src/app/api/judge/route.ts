import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface JudgeRequest {
  prompt: string;
  responses: Array<{
    modelId: string;
    modelName: string;
    content: string;
  }>;
  judgeModelId: string;
}

interface JudgeVerdict {
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
    const { prompt, responses, judgeModelId } = body;

    if (!prompt || !responses || responses.length < 2 || !judgeModelId) {
      return NextResponse.json(
        { error: 'Prompt, at least 2 responses, and judge model required' },
        { status: 400 }
      );
    }

    // Build the judge prompt
    const judgePrompt = buildJudgePrompt(prompt, responses);

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'LLM Committee Judge',
      },
      body: JSON.stringify({
        model: judgeModelId,
        messages: [{ role: 'user', content: judgePrompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Judge API error: ${response.status} - ${errorText}` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from judge model' },
        { status: 500 }
      );
    }

    // Parse the JSON verdict
    const verdict = parseJudgeResponse(content, responses);
    return NextResponse.json(verdict);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildJudgePrompt(
  originalPrompt: string,
  responses: JudgeRequest['responses']
): string {
  const responsesText = responses
    .map(
      (r, i) => `
### Response ${i + 1}: ${r.modelName} (${r.modelId})
${r.content}
`
    )
    .join('\n---\n');

  return `You are an expert judge evaluating AI model responses. Your task is to analyze the following responses to a user prompt and determine which is best.

## Original User Prompt
${originalPrompt}

## Responses to Evaluate
${responsesText}

## Your Task
Evaluate each response based on:
1. Accuracy and correctness
2. Completeness and thoroughness
3. Clarity and presentation
4. Relevance to the prompt
5. Overall helpfulness

Provide your evaluation as a JSON object with this exact structure:
{
  "winnerModelId": "the model ID of the best response",
  "winnerModelName": "the display name of the winner",
  "reasoning": "A 2-3 sentence explanation of why this response won, referencing specific strengths and comparing to other responses",
  "scores": [
    {
      "modelId": "model ID",
      "score": 85,
      "strengths": ["strength 1", "strength 2"],
      "weaknesses": ["weakness 1"]
    }
  ]
}

The score should be 0-100. Be specific in your reasoning - reference actual content from the responses.`;
}

function parseJudgeResponse(
  content: string,
  responses: JudgeRequest['responses']
): JudgeVerdict {
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
