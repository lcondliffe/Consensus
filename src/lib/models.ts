import { CommitteeModel, JudgeModel } from './types';

// Available models from OpenRouter
export const AVAILABLE_MODELS: CommitteeModel[] = [
  {
    id: 'anthropic/claude-sonnet-4',
    displayName: 'Claude Sonnet 4',
    provider: 'Anthropic',
  },
  {
    id: 'openai/gpt-4o',
    displayName: 'GPT-4o',
    provider: 'OpenAI',
  },
  {
    id: 'google/gemini-2.0-flash-001',
    displayName: 'Gemini 2.0 Flash',
    provider: 'Google',
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    displayName: 'Claude 3.5 Haiku',
    provider: 'Anthropic',
  },
  {
    id: 'openai/gpt-4o-mini',
    displayName: 'GPT-4o Mini',
    provider: 'OpenAI',
  },
  {
    id: 'meta-llama/llama-3.3-70b-instruct',
    displayName: 'Llama 3.3 70B',
    provider: 'Meta',
  },
  {
    id: 'mistralai/mistral-large-2411',
    displayName: 'Mistral Large',
    provider: 'Mistral',
  },
  {
    id: 'deepseek/deepseek-chat',
    displayName: 'DeepSeek Chat',
    provider: 'DeepSeek',
  },
];

// Default committee models (DC-001)
export const DEFAULT_COMMITTEE_MODEL_IDS = [
  'anthropic/claude-sonnet-4',
  'openai/gpt-4o',
  'google/gemini-2.0-flash-001',
];

// Default judge model (DC-002)
export const DEFAULT_JUDGE_MODEL: JudgeModel = {
  id: 'anthropic/claude-sonnet-4',
  displayName: 'Claude Sonnet 4',
  provider: 'Anthropic',
};

export function getModelById(id: string): CommitteeModel | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

export function getModelDisplayName(id: string): string {
  return getModelById(id)?.displayName ?? id;
}
