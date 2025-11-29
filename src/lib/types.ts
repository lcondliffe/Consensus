// Key entities from spec

export interface CommitteeModel {
  id: string;
  displayName: string;
  provider: string;
}

export interface JudgeModel {
  id: string;
  displayName: string;
  provider: string;
}

export interface ModelResponse {
  modelId: string;
  modelName: string;
  content: string;
  isStreaming: boolean;
  isComplete: boolean;
  error: string | null;
  latencyMs: number | null;
  startTime: number | null;
}

export interface ModelScore {
  modelId: string;
  score: number;
  strengths: string[];
  weaknesses: string[];
}

export interface Verdict {
  winnerModelId: string;
  winnerModelName: string;
  reasoning: string;
  scores: ModelScore[];
  isLoading: boolean;
  error: string | null;
}

export interface Session {
  id: string;
  prompt: string;
  responses: ModelResponse[];
  verdict: Verdict | null;
  createdAt: Date;
}

export interface CommitteeConfig {
  committeeModels: CommitteeModel[];
  judgeModel: JudgeModel;
}

// API request/response types

export interface SubmitPromptRequest {
  prompt: string;
  models: string[];
}

export interface JudgeRequest {
  prompt: string;
  responses: Array<{
    modelId: string;
    modelName: string;
    content: string;
  }>;
  judgeModelId: string;
}

export interface StreamChunk {
  modelId: string;
  content: string;
  done: boolean;
  error?: string;
}
