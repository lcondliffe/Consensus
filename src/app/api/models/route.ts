import { NextResponse } from 'next/server';

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length: number;
  pricing: {
    prompt: string;
    completion: string;
  };
  top_provider?: {
    is_moderated: boolean;
  };
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
  description?: string;
}

// Cache models for 5 minutes to avoid excessive API calls
let cachedModels: ModelInfo[] | null = null;
let cacheTimestamp = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Return cached models if still valid
    if (cachedModels && Date.now() - cacheTimestamp < CACHE_TTL) {
      return NextResponse.json({ models: cachedModels });
    }

    const response = await fetch('https://openrouter.ai/api/v1/models', {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const models: ModelInfo[] = (data.data || [])
      .map((model: OpenRouterModel) => {
        // Extract provider from model ID (e.g., "anthropic/claude-3" -> "Anthropic")
        const [providerSlug] = model.id.split('/');
        const provider = formatProviderName(providerSlug);

        return {
          id: model.id,
          name: model.name || model.id.split('/').pop() || model.id,
          provider,
          contextLength: model.context_length,
          description: model.description,
        };
      })
      .sort((a: ModelInfo, b: ModelInfo) => {
        // Sort by provider, then by name
        if (a.provider !== b.provider) {
          return a.provider.localeCompare(b.provider);
        }
        return a.name.localeCompare(b.name);
      });

    // Update cache
    cachedModels = models;
    cacheTimestamp = Date.now();

    return NextResponse.json({ models });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch models';
    console.error('Error fetching models:', message);
    
    // Return cached models even if stale, if available
    if (cachedModels) {
      return NextResponse.json({ models: cachedModels, stale: true });
    }
    
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function formatProviderName(slug: string): string {
  const providerMap: Record<string, string> = {
    'anthropic': 'Anthropic',
    'openai': 'OpenAI',
    'google': 'Google',
    'meta-llama': 'Meta',
    'mistralai': 'Mistral',
    'cohere': 'Cohere',
    'deepseek': 'DeepSeek',
    'qwen': 'Qwen',
    'nvidia': 'NVIDIA',
    'perplexity': 'Perplexity',
    'fireworks': 'Fireworks',
    'together': 'Together',
    'groq': 'Groq',
    'amazon': 'Amazon',
    'ai21': 'AI21',
    'x-ai': 'xAI',
  };
  
  return providerMap[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
}
