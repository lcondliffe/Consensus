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

// Judging modes
export type JudgingMode = 'judge' | 'committee' | 'executive' | 'consensus';

// Consensus mode types
export interface ConsensusAttribution {
  modelId: string;
  modelName: string;
  contribution: string;
}

export interface ConsensusKeyPoint {
  point: string;
  sourceModelIds: string[];
}

export interface ConsensusResult {
  synthesizedResponse: string;
  attributions: ConsensusAttribution[];
  keyPoints: ConsensusKeyPoint[];
}

export interface JudgeVote {
  judgeModelId: string;
  judgeModelName: string;
  winnerModelId: string;
  reasoning: string;
  scores: ModelScore[];
}

export interface Verdict {
  winnerModelId: string;
  winnerModelName: string;
  reasoning: string;
  scores: ModelScore[];
  isLoading: boolean;
  error: string | null;
  // Multi-judge fields
  judgingMode?: JudgingMode;
  votes?: JudgeVote[];
  voteCount?: Record<string, number>; // modelId -> vote count
  // Consensus mode fields
  consensusResult?: ConsensusResult;
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
