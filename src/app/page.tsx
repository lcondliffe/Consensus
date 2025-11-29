'use client';

import { useState, useCallback, useRef } from 'react';
import { Settings, X, LayoutGrid, Rows3 } from 'lucide-react';
import { ModelSelector } from '@/components/ModelSelector';
import { PromptInput } from '@/components/PromptInput';
import { ResponsePanel, ViewMode } from '@/components/ResponsePanel';
import { VerdictPanel } from '@/components/VerdictPanel';
import { CriteriaSelector } from '@/components/CriteriaSelector';
import { ModelResponse, Verdict, StreamChunk } from '@/lib/types';
import {
  DEFAULT_COMMITTEE_MODEL_IDS,
  DEFAULT_JUDGE_MODEL,
  getModelDisplayName,
  AVAILABLE_MODELS,
} from '@/lib/models';
import { JudgingCriteria, JUDGING_PRESETS, DEFAULT_CRITERIA_ID } from '@/lib/criteria';
import clsx from 'clsx';

const MIN_COMMITTEE_MODELS = 2;

export default function Home() {
  // Config state
  const [selectedCommittee, setSelectedCommittee] = useState<string[]>(
    DEFAULT_COMMITTEE_MODEL_IDS.filter((id) => id !== DEFAULT_JUDGE_MODEL.id)
  );
  const [judgeModelId, setJudgeModelId] = useState(DEFAULT_JUDGE_MODEL.id);
  const [judgingCriteria, setJudgingCriteria] = useState<JudgingCriteria>(
    JUDGING_PRESETS.find((p) => p.id === DEFAULT_CRITERIA_ID)!
  );
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Session state
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState<Map<string, ModelResponse>>(new Map());
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);

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

  // Submit prompt to committee
  const handleSubmit = useCallback(async () => {
    if (!prompt.trim() || selectedCommittee.length < MIN_COMMITTEE_MODELS || isSubmitting) {
      return;
    }

    // Reset state
    setIsSubmitting(true);
    setVerdict(null);

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

            setResponses((prev) => {
              const updated = new Map(prev);
              const existing = updated.get(modelId);
              if (!existing) return prev;

              if (error) {
                // FR-011: Handle individual model failures gracefully
                updated.set(modelId, {
                  ...existing,
                  error,
                  isStreaming: false,
                  isComplete: true,
                  latencyMs: Date.now() - (existing.startTime || Date.now()),
                });
                completedModels.add(modelId);
              } else if (isDone) {
                updated.set(modelId, {
                  ...existing,
                  isStreaming: false,
                  isComplete: true,
                  latencyMs: Date.now() - (existing.startTime || Date.now()),
                });
                completedModels.add(modelId);
              } else if (content) {
                updated.set(modelId, {
                  ...existing,
                  content: existing.content + content,
                });
              }

              return updated;
            });
          } catch {
            // Skip malformed JSON
          }
        }
      }

      // FR-005: After streaming completes, send to judge
      await triggerJudgeEvaluation();
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        // User cancelled
        return;
      }
      console.error('Committee error:', error);
      // Mark all streaming responses as errored
      setResponses((prev) => {
        const updated = new Map(prev);
        Array.from(updated.entries()).forEach(([modelId, response]) => {
          if (response.isStreaming) {
            updated.set(modelId, {
              ...response,
              error: (error as Error).message || 'Request failed',
              isStreaming: false,
              isComplete: true,
            });
          }
        });
        return updated;
      });
    } finally {
      setIsSubmitting(false);
      abortControllerRef.current = null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prompt, selectedCommittee, isSubmitting]);

  // FR-005, FR-006: Judge evaluation
  const triggerJudgeEvaluation = useCallback(async () => {
    // Get current responses from state via ref callback
    setResponses((currentResponses) => {
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
        return currentResponses;
      }

      // Show loading state
      setVerdict({
        winnerModelId: '',
        winnerModelName: '',
        reasoning: '',
        scores: [],
        isLoading: true,
        error: null,
      });

      // Make the judge request
      fetch('/api/judge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt.trim(),
          responses: completedResponses,
          judgeModelId,
          criteria: judgingCriteria,
        }),
      })
        .then(async (res) => {
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.error || `HTTP ${res.status}`);
          }
          return res.json();
        })
        .then((data) => {
          setVerdict({
            winnerModelId: data.winnerModelId,
            winnerModelName: data.winnerModelName,
            reasoning: data.reasoning,
            scores: data.scores || [],
            isLoading: false,
            error: null,
          });
        })
        .catch((error) => {
          // FR-006: Handle judge failure gracefully
          setVerdict({
            winnerModelId: '',
            winnerModelName: '',
            reasoning: '',
            scores: [],
            isLoading: false,
            error: (error as Error).message || 'Judge evaluation failed',
          });
        });

      return currentResponses;
    });
  }, [prompt, judgeModelId, judgingCriteria]);

  // Get score for a model from verdict
  const getScore = (modelId: string): number | undefined => {
    return verdict?.scores.find((s) => s.modelId === modelId)?.score;
  };

  const responsesArray = Array.from(responses.values());
  const hasResponses = responsesArray.length > 0;
  const judgeModelName =
    AVAILABLE_MODELS.find((m) => m.id === judgeModelId)?.displayName || judgeModelId;

  return (
    <main className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-bold text-gray-100">LLM Committee</h1>
          <p className="text-sm text-gray-500">
            Compare AI responses and let a judge decide
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            showSettings
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          )}
        >
          {showSettings ? <X className="w-5 h-5" /> : <Settings className="w-5 h-5" />}
        </button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Settings Panel (collapsible) */}
        <aside
          className={clsx(
            'border-r border-gray-800 bg-gray-900/50 transition-all duration-300 overflow-hidden',
            showSettings ? 'w-80 p-4' : 'w-0 p-0'
          )}
        >
        {showSettings && (
            <div className="space-y-6">
              <ModelSelector
                selectedCommittee={selectedCommittee}
                judgeModelId={judgeModelId}
                onCommitteeChange={setSelectedCommittee}
                onJudgeChange={handleJudgeChange}
                disabled={isSubmitting}
              />
              <CriteriaSelector
                selectedCriteria={judgingCriteria}
                onCriteriaChange={setJudgingCriteria}
                disabled={isSubmitting}
              />
            </div>
          )}
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col p-6 overflow-hidden">
          {/* Prompt Input */}
          <div className="mb-6">
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

          {/* Responses Grid */}
          {hasResponses && (
            <div className="flex-1 flex flex-col gap-4 overflow-hidden">
              {/* View toggle */}
              <div className="flex items-center justify-end gap-1">
                <span className="text-xs text-gray-500 mr-2">View:</span>
                <button
                  onClick={() => setViewMode('grid')}
                  className={clsx(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'grid'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  )}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('stacked')}
                  className={clsx(
                    'p-1.5 rounded transition-colors',
                    viewMode === 'stacked'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:text-gray-200'
                  )}
                  title="Stacked view"
                >
                  <Rows3 className="w-4 h-4" />
                </button>
              </div>

              {/* Response panels */}
              <div
                className={clsx(
                  'flex-1 gap-4 overflow-y-auto',
                  viewMode === 'grid' && [
                    'grid',
                    responsesArray.length <= 2 && 'grid-cols-2',
                    responsesArray.length === 3 && 'grid-cols-3',
                    responsesArray.length >= 4 && 'grid-cols-2 lg:grid-cols-4',
                  ],
                  viewMode === 'stacked' && 'flex flex-col'
                )}
              >
                {responsesArray.map((response) => (
                  <ResponsePanel
                    key={response.modelId}
                    response={response}
                    isWinner={verdict?.winnerModelId === response.modelId}
                    score={getScore(response.modelId)}
                    viewMode={viewMode}
                  />
                ))}
              </div>

              {/* Verdict Panel */}
              <VerdictPanel verdict={verdict} judgeModelName={judgeModelName} />
            </div>
          )}

          {/* Empty State */}
          {!hasResponses && (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-500 max-w-md">
                <p className="text-lg mb-2">Submit a prompt to the committee</p>
                <p className="text-sm">
                  Your prompt will be sent to {selectedCommittee.length} models
                  simultaneously, and {judgeModelName} will evaluate the responses.
                </p>
                {!showSettings && (
                  <button
                    onClick={() => setShowSettings(true)}
                    className="mt-4 text-blue-400 hover:text-blue-300 text-sm"
                  >
                    Configure models →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
