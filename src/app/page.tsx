'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Settings, X, LayoutGrid, Rows3, RotateCcw, History } from 'lucide-react';
import { UserButton, useUser } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { ModelSelector } from '@/components/ModelSelector';
import { ModelOption } from '@/components/ModelPicker';
import { PromptInput } from '@/components/PromptInput';
import { ResponsePanel, ViewMode } from '@/components/ResponsePanel';
import { VerdictPanel } from '@/components/VerdictPanel';
import { CriteriaSelector } from '@/components/CriteriaSelector';
import { JudgingModeSelector } from '@/components/JudgingModeSelector';
import { CommitteeDisplay } from '@/components/CommitteeDisplay';
import { SessionHistory } from '@/components/SessionHistory';
import { ModelResponse, Verdict, StreamChunk, JudgingMode } from '@/lib/types';
import {
  DEFAULT_COMMITTEE_MODEL_IDS,
  DEFAULT_JUDGE_MODEL,
  getModelDisplayName,
} from '@/lib/models';
import { JudgingCriteria, JUDGING_PRESETS, DEFAULT_CRITERIA_ID } from '@/lib/criteria';
import clsx from 'clsx';

const MIN_COMMITTEE_MODELS = 2;

export default function Home() {
  // Auth state
  const { user } = useUser();
  const userId = user?.id ?? null;

  // Convex mutations
  const createSession = useMutation(api.sessions.create);
  const updateResponses = useMutation(api.sessions.updateResponses);
  const updateVerdict = useMutation(api.sessions.updateVerdict);

  // Session persistence state
  const [currentSessionId, setCurrentSessionId] = useState<Id<'sessions'> | null>(null);
  const [showHistory, setShowHistory] = useState(false);

  // Config state
  const [selectedCommittee, setSelectedCommittee] = useState<string[]>(
    DEFAULT_COMMITTEE_MODEL_IDS.filter((id) => id !== DEFAULT_JUDGE_MODEL.id)
  );

  // Model state
  const [models, setModels] = useState<ModelOption[]>([
    { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', contextLength: 200000 },
    { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', contextLength: 128000 },
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', contextLength: 1000000 },
    { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', contextLength: 200000 },
    { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', contextLength: 128000 },
  ]);
  const [isLoadingModels, setIsLoadingModels] = useState(true);
  const [modelError, setModelError] = useState<string | null>(null);

  const fetchModels = async () => {
    setIsLoadingModels(true);
    setModelError(null);
    try {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
      }
    } catch (err) {
      setModelError('Failed to load models');
      console.error('Error fetching models:', err);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const [judgeModelId, setJudgeModelId] = useState(DEFAULT_JUDGE_MODEL.id);
  const [judgingMode, setJudgingMode] = useState<JudgingMode>('judge');
  const [executiveJudgeIds, setExecutiveJudgeIds] = useState<string[]>([]);
  const [judgingCriteria, setJudgingCriteria] = useState<JudgingCriteria>(
    JUDGING_PRESETS.find((p) => p.id === DEFAULT_CRITERIA_ID)!
  );
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [maximizedModelId, setMaximizedModelId] = useState<string | null>(null);

  // Session state
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<Map<string, ModelResponse>>(new Map());
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const responsesRef = useRef<Map<string, ModelResponse>>(new Map());

  // FR-009: When judge changes, remove from committee if selected
  const handleJudgeChange = useCallback(
    (newJudgeId: string) => {
      setJudgeModelId(newJudgeId);
      if (selectedCommittee.includes(newJudgeId)) {
        setSelectedCommittee((prev) => prev.filter((id) => id !== newJudgeId));
      }
    },
    [selectedCommittee]
  );

  // Reset to start a new prompt
  const handleReset = useCallback(() => {
    // Abort any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setResponses(new Map());
    responsesRef.current = new Map();
    setVerdict(null);
    setPrompt('');
    setIsSubmitting(false);
    setMaximizedModelId(null);
    setCurrentSessionId(null);
  }, []);

  // Load a session from history
  const sessions = useQuery(
    api.sessions.listByUser,
    userId ? { limit: 30 } : 'skip'
  );

  const handleLoadSession = useCallback(
    (sessionId: Id<'sessions'>) => {
      const session = sessions?.find((s) => s._id === sessionId);
      if (!session) return;

      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }

      // Load session state
      setCurrentSessionId(sessionId);
      setPrompt(session.prompt);
      setSelectedCommittee(session.committeeModelIds);
      setJudgeModelId(session.judgeModelId);
      setJudgingMode(session.judgingMode as JudgingMode);
      setJudgingCriteria(session.judgingCriteria);

      // Reconstruct responses Map
      const loadedResponses = new Map<string, ModelResponse>();
      for (const r of session.responses) {
        loadedResponses.set(r.modelId, {
          modelId: r.modelId,
          modelName: r.modelName,
          content: r.content,
          isStreaming: false,
          isComplete: true,
          error: r.error,
          latencyMs: r.latencyMs,
          startTime: null,
        });
      }
      setResponses(loadedResponses);
      responsesRef.current = loadedResponses;

      // Load verdict if exists
      if (session.verdict) {
        setVerdict({
          winnerModelId: session.verdict.winnerModelId,
          winnerModelName: session.verdict.winnerModelName,
          reasoning: session.verdict.reasoning,
          scores: session.verdict.scores,
          isLoading: false,
          error: null,
          judgingMode: session.verdict.judgingMode as JudgingMode | undefined,
          votes: session.verdict.votes,
          voteCount: session.verdict.voteCount as Record<string, number> | undefined,
        });
      } else {
        setVerdict(null);
      }

      setIsSubmitting(false);
      setMaximizedModelId(null);
      setShowHistory(false);
    },
    [sessions]
  );

  // Submit prompt to committee
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || selectedCommittee.length < MIN_COMMITTEE_MODELS || isSubmitting) {
      return;
    }

    // Reset state
    setIsSubmitting(true);
    setVerdict(null);
    setCurrentSessionId(null);

    // Create session in Convex if user is authenticated
    let sessionId: Id<'sessions'> | null = null;
    if (userId) {
      try {
        sessionId = await createSession({
          prompt: prompt.trim(),
          committeeModelIds: selectedCommittee,
          judgeModelId,
          judgingMode,
          judgingCriteria,
        });
        setCurrentSessionId(sessionId);
      } catch (err) {
        console.error('Failed to create session:', err);
      }
    }

    // Initialize response state for each model
    const initialResponses = new Map<string, ModelResponse>();
    for (const modelId of selectedCommittee) {
      initialResponses.set(modelId, {
        modelId,
        modelName: getModelDisplayName(modelId),
        content: '',
        isStreaming: true,
        isComplete: false,
        error: null,
        latencyMs: null,
        startTime: Date.now(),
      });
    }
    setResponses(initialResponses);
    responsesRef.current = initialResponses;

    // Create abort controller
    abortControllerRef.current = new AbortController();

    try {
      // FR-001, FR-002: Query committee models in parallel via streaming API
      const response = await fetch('/api/committee', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          models: selectedCommittee,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      const completedModels = new Set<string>();

      // FR-003: Stream responses in real-time
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          try {
            const chunk: StreamChunk = JSON.parse(trimmed.slice(6));
            const { modelId, content, done: isDone, error } = chunk;

            // Update ref and state synchronously
            const currentMap = responsesRef.current;
            const existing = currentMap.get(modelId);

            if (!existing) continue;

            let updatedResponse = { ...existing };

            if (error) {
              // FR-011: Handle individual model failures gracefully
              updatedResponse = {
                ...updatedResponse,
                error,
                isStreaming: false,
                isComplete: true,
                latencyMs: Date.now() - (existing.startTime || Date.now()),
              };
              completedModels.add(modelId);
            } else if (isDone) {
              updatedResponse = {
                ...updatedResponse,
                isStreaming: false,
                isComplete: true,
                latencyMs: Date.now() - (existing.startTime || Date.now()),
              };
              completedModels.add(modelId);
            } else if (content) {
              updatedResponse = {
                ...updatedResponse,
                content: updatedResponse.content + content,
              };
            }

            const newMap = new Map(currentMap);
            newMap.set(modelId, updatedResponse);
            responsesRef.current = newMap;
            setResponses(newMap);

          } catch {
            // Skip malformed JSON
          }
        }
      }

      // Save responses to Convex
      if (sessionId) {
        const finalResponses = responsesRef.current;
        const responsesToSave = Array.from(finalResponses.values()).map((r) => ({
          modelId: r.modelId,
          modelName: r.modelName,
          content: r.content,
          error: r.error,
          latencyMs: r.latencyMs,
        }));
        updateResponses({ sessionId: sessionId!, responses: responsesToSave }).catch((err) =>
          console.error('Failed to save responses:', err)
        );
      }

      // FR-005: After streaming completes, send to judge
      await triggerJudgeEvaluation(sessionId, responsesRef.current);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled
        return;
      }
      console.error('Committee error:', error);
      // Mark all streaming responses as errored
      const currentMap = responsesRef.current;
      const newMap = new Map(currentMap);
      
      Array.from(newMap.entries()).forEach(([modelId, response]) => {
        if (response.isStreaming) {
          newMap.set(modelId, {
            ...response,
            error: (error as Error).message || 'Request failed',
            isStreaming: false,
            isComplete: true,
          });
        }
      });
      responsesRef.current = newMap;
      setResponses(newMap);
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, selectedCommittee, isSubmitting, userId, createSession, judgeModelId, judgingMode, judgingCriteria, updateResponses]);

  // FR-005, FR-006: Judge evaluation
  const triggerJudgeEvaluation = useCallback(async (sessionId: Id<'sessions'> | null, currentResponses: Map<string, ModelResponse>) => {
    // Build responses for judge
    const completedResponses = Array.from(currentResponses.values())
      .filter((r) => r.isComplete && !r.error && r.content.trim())
      .map((r) => ({
        modelId: r.modelId,
        modelName: r.modelName,
        content: r.content,
      }));

    if (completedResponses.length < 2) {
      setVerdict({
        winnerModelId: '',
        winnerModelName: '',
        reasoning: 'Not enough successful responses to evaluate.',
        scores: [],
        isLoading: false,
        error: 'Fewer than 2 models responded successfully.',
      });
      return;
    }

    // Build judge model IDs based on mode
    let judgeModelIds: string[] = [];
    let judgeModelNames: string[] = [];

    if (judgingMode === 'judge') {
      judgeModelIds = [judgeModelId];
      judgeModelNames = [getModelDisplayName(judgeModelId)];
    } else if (judgingMode === 'committee') {
      // All responding models vote
      judgeModelIds = completedResponses.map((r) => r.modelId);
      judgeModelNames = completedResponses.map((r) => r.modelName);
    } else if (judgingMode === 'executive') {
      judgeModelIds = executiveJudgeIds;
      judgeModelNames = executiveJudgeIds.map((id) => getModelDisplayName(id));
    }

    // Show loading state
    setVerdict({
      winnerModelId: '',
      winnerModelName: '',
      reasoning: '',
      scores: [],
      isLoading: true,
      error: null,
      judgingMode,
    });

    try {
      // Make the judge request
      const res = await fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          responses: completedResponses,
          judgeModelId,
          judgeModelIds,
          judgeModelNames,
          judgingMode,
          criteria: judgingCriteria,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const verdictData = {
        winnerModelId: data.winnerModelId,
        winnerModelName: data.winnerModelName,
        reasoning: data.reasoning,
        scores: data.scores || [],
        isLoading: false,
        error: null,
        judgingMode,
        votes: data.votes,
        voteCount: data.voteCount,
      };
      setVerdict(verdictData);

      // Save verdict to Convex
      if (sessionId) {
        updateVerdict({
          sessionId,
          verdict: {
            winnerModelId: data.winnerModelId,
            winnerModelName: data.winnerModelName,
            reasoning: data.reasoning,
            scores: data.scores || [],
            judgingMode,
            votes: data.votes,
            voteCount: data.voteCount,
          },
        }).catch((err) => console.error('Failed to save verdict:', err));
      }
    } catch (error) {
      // FR-006: Handle judge failure gracefully
      setVerdict({
        winnerModelId: '',
        winnerModelName: '',
        reasoning: '',
        scores: [],
        isLoading: false,
        error: (error as Error).message || 'Judge evaluation failed',
      });
    }
  }, [prompt, judgeModelId, judgingMode, executiveJudgeIds, judgingCriteria, updateVerdict]);

  // Get score for a model from verdict
  const getScore = (modelId: string): number | undefined => {
    return verdict?.scores.find((s) => s.modelId === modelId)?.score;
  };

  const responsesArray = Array.from(responses.values());
  const hasResponses = responsesArray.length > 0;
  const judgeModelName =
    models.find((m) => m.id === judgeModelId)?.name || judgeModelId;

  return (
    <main className="h-screen flex flex-col bg-background text-foreground overflow-hidden selection:bg-accent/20">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-surface-1/50 backdrop-blur z-20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={clsx(
              'p-2 rounded-lg transition-all duration-200',
              showHistory
                ? 'bg-surface-2 text-white shadow-sm'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-2/50'
            )}
            title="Session history"
          >
            <History className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
              <LayoutGrid className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">Consensus</h1>
              <p className="text-[10px] text-foreground-muted font-medium uppercase tracking-wider">
                Committee Evaluation
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={clsx(
              'p-2 rounded-lg transition-all duration-200',
              showSettings
                ? 'bg-surface-2 text-white shadow-sm'
                : 'text-foreground-muted hover:text-foreground hover:bg-surface-2/50'
            )}
          >
            {showSettings ? <X className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
          </button>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8',
              },
            }}
          />
        </div>
      </header>

      {/* Session History Sidebar */}
      <SessionHistory
        userId={userId}
        currentSessionId={currentSessionId}
        onLoadSession={handleLoadSession}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      {/* Top Settings Panel */}
      <div
        className={clsx(
          'border-b border-border bg-surface-1/30 backdrop-blur transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)] overflow-hidden',
          showSettings ? 'max-h-[80vh] opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-y-auto max-h-[80vh]">
          <div className="space-y-2">
            <ModelSelector
              models={models}
              isLoading={isLoadingModels}
              error={modelError}
              onRefresh={fetchModels}
              selectedCommittee={selectedCommittee}
              judgeModelId={judgeModelId}
              onCommitteeChange={setSelectedCommittee}
              disabled={isSubmitting}
            />
          </div>
          
          <div className="space-y-2">
            <JudgingModeSelector
              models={models}
              mode={judgingMode}
              onModeChange={setJudgingMode}
              judgeModelId={judgeModelId}
              onJudgeChange={handleJudgeChange}
              executiveJudgeIds={executiveJudgeIds}
              onExecutiveJudgesChange={setExecutiveJudgeIds}
              committeeModelIds={selectedCommittee}
              disabled={isSubmitting}
            />
          </div>

          <div className="space-y-2">
            <CriteriaSelector
              selectedCriteria={judgingCriteria}
              onCriteriaChange={setJudgingCriteria}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* Scrollable Area */}
          <div className="flex-1 overflow-y-auto scroll-smooth">
            <div className="max-w-5xl mx-auto p-4 md:p-6 pb-64 min-h-full flex flex-col">
              
              {/* Empty State */}
              {!hasResponses && (
                <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] animate-in fade-in duration-700 slide-in-from-bottom-4 py-8">
                  <div className="w-14 h-14 rounded-2xl bg-surface-2 flex items-center justify-center mb-4 shadow-glow">
                    <LayoutGrid className="w-7 h-7 text-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Consensus Committee</h2>
                  <p className="text-foreground-muted max-w-md text-center mb-8 leading-relaxed text-sm">
                    Submit a prompt to gather responses from your selected models, 
                    then let the judge evaluate the results.
                  </p>
                  
                  {/* Committee Display */}
                  <div className="w-full mb-8">
                    <CommitteeDisplay
                      models={models}
                      selectedCommittee={selectedCommittee}
                      judgingMode={judgingMode}
                      judgeModelId={judgeModelId}
                      executiveJudgeIds={executiveJudgeIds}
                    />
                  </div>
                  
                  {!showSettings && (
                    <button
                      onClick={() => setShowSettings(true)}
                      className="text-xs font-medium text-accent hover:text-accent-glow transition-colors uppercase tracking-wider"
                    >
                      Configure models
                    </button>
                  )}
                </div>
              )}

              {/* Responses Grid */}
              {hasResponses && (
                <div className="flex flex-col gap-6 animate-in fade-in duration-500">
                  {/* View Controls */}
                  {!maximizedModelId && (
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider">
                        Committee Responses
                      </h2>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleReset}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-surface-2/50 hover:bg-surface-2 border border-white/5 hover:border-white/10 transition-all"
                          title="New prompt"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          New
                        </button>
                        <div className="flex items-center gap-1 bg-surface-2/50 p-1 rounded-lg border border-white/5">
                          <button
                            onClick={() => setViewMode('grid')}
                            className={clsx(
                              'p-1.5 rounded-md transition-all',
                              viewMode === 'grid'
                                ? 'bg-surface-3 text-white shadow-sm'
                                : 'text-foreground-muted hover:text-foreground'
                            )}
                            title="Grid view"
                          >
                            <LayoutGrid className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setViewMode('stacked')}
                            className={clsx(
                              'p-1.5 rounded-md transition-all',
                              viewMode === 'stacked'
                                ? 'bg-surface-3 text-white shadow-sm'
                                : 'text-foreground-muted hover:text-foreground'
                            )}
                            title="Stacked view"
                          >
                            <Rows3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Response Panels */}
                  {maximizedModelId ? (
                    <div className="flex-1 min-h-[600px]">
                      {responses.get(maximizedModelId) && (
                        <ResponsePanel
                          response={responses.get(maximizedModelId)!}
                          isWinner={verdict?.winnerModelId === maximizedModelId}
                          score={getScore(maximizedModelId)}
                          viewMode={viewMode}
                          isMaximized={true}
                          onMinimize={() => setMaximizedModelId(null)}
                        />
                      )}
                    </div>
                  ) : (
                    <div
                      className={clsx(
                        'gap-4',
                        viewMode === 'grid' && [
                          'grid',
                          responsesArray.length <= 2 && 'grid-cols-1 md:grid-cols-2',
                          responsesArray.length === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
                          responsesArray.length >= 4 && 'grid-cols-1 md:grid-cols-2 xl:grid-cols-4',
                        ],
                        viewMode === 'stacked' && 'flex flex-col max-w-3xl mx-auto w-full'
                      )}
                    >
                      {responsesArray.map((response) => (
                        <ResponsePanel
                          key={response.modelId}
                          response={response}
                          isWinner={verdict?.winnerModelId === response.modelId}
                          score={getScore(response.modelId)}
                          viewMode={viewMode}
                          onMaximize={() => setMaximizedModelId(response.modelId)}
                        />
                      ))}
                    </div>
                  )}

                  {/* Verdict Section - Distinct from responses */}
                  {!maximizedModelId && (
                     <div className="mt-8 max-w-3xl mx-auto w-full mb-24">
                       <VerdictPanel verdict={verdict} judgeModelName={judgeModelName} />
                     </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Prompt Input Area - Fixed at bottom */}
          <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-background via-background/95 to-transparent pt-16 z-20">
            <div className="max-w-3xl mx-auto">
              <PromptInput
                value={prompt}
                onChange={setPrompt}
                onSubmit={handleSubmit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
                minModels={MIN_COMMITTEE_MODELS}
                selectedModelCount={selectedCommittee.length}
              />
            </div>
          </div>
          
        </div>
      </div>
    </main>
  );
}
