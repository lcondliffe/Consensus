import { NextRequest, NextResponse } from 'next/server';
import { JudgingCriterion } from '@/lib/criteria';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface GenerateCriteriaRequest {
  description: string;
  modelId: string;
}

interface GeneratedCriteria {
  name: string;
  description: string;
  criteria: JudgingCriterion[];
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

    const body: GenerateCriteriaRequest = await request.json();
    const { description, modelId } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (description.length > 1000) {
      return NextResponse.json(
        { error: 'Description must be 1000 characters or fewer' },
        { status: 400 }
      );
    }

    if (!modelId || !modelId.trim()) {
      return NextResponse.json(
        { error: 'Model ID is required' },
        { status: 400 }
      );
    }

    const prompt = `You are an expert at designing evaluation criteria for comparing AI model responses.

The user wants to evaluate AI responses with the following focus:
"${description}"

Analyze this description and generate a set of 3-7 evaluation criteria. Each criterion should have:
- A short, clear name (e.g., "Accuracy", "Code Quality")
- A weight from 1-5 indicating importance (5 = most important)
- A brief description of what to evaluate

Also provide a short name and description for this criteria set as a whole.

Return your response as a JSON object with this exact structure:
{
  "name": "Short name for this criteria set",
  "description": "One-sentence description of what this criteria set evaluates",
  "criteria": [
    {
      "name": "Criterion Name",
      "weight": 4,
      "description": "What this criterion evaluates"
    }
  ]
}

Guidelines:
- Generate criteria that specifically address what the user described
- Assign higher weights to criteria that are most relevant to the user's description
- Keep criterion names concise (1-3 words)
- Keep criterion descriptions under 100 characters
- Ensure criteria are distinct and don't overlap significantly`;

    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
        'X-Title': 'Consensus Criteria Generator',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('OpenRouter error for generate-criteria:', {
        status: response.status,
        modelId,
        error: errorData,
      });
      const message = errorData.error?.message || `Model request failed: ${response.status}`;
      return NextResponse.json({ error: message }, { status: 502 });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return NextResponse.json(
        { error: 'No response from model' },
        { status: 502 }
      );
    }

    // Parse JSON response with fallback for markdown code blocks
    let parsed: GeneratedCriteria;
    try {
      parsed = JSON.parse(content);
    } catch {
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[1].trim());
        } catch {
          return NextResponse.json(
            { error: 'Failed to parse model response' },
            { status: 502 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Failed to parse model response' },
          { status: 502 }
        );
      }
    }

    // Validate structure
    if (
      typeof parsed.name !== 'string' ||
      typeof parsed.description !== 'string' ||
      !Array.isArray(parsed.criteria) ||
      parsed.criteria.length === 0
    ) {
      return NextResponse.json(
        { error: 'Invalid criteria structure from model' },
        { status: 502 }
      );
    }

    // Sanitize and validate criteria
    const validCriteria = parsed.criteria
      .filter(
        (c): c is JudgingCriterion =>
          typeof c.name === 'string' &&
          c.name.trim().length > 0 &&
          typeof c.weight === 'number' &&
          typeof c.description === 'string'
      )
      .map((c) => ({
        name: c.name.trim(),
        weight: Math.max(1, Math.min(5, Math.round(c.weight))),
        description: c.description.trim(),
      }));

    if (validCriteria.length === 0) {
      return NextResponse.json(
        { error: 'No valid criteria generated' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      name: parsed.name.trim() || 'AI-Generated Criteria',
      description: parsed.description.trim() || 'AI-generated evaluation criteria',
      criteria: validCriteria,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
