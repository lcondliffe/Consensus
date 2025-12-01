'use client';

import { useState } from 'react';
import { AlertCircle, Award, Loader2, ChevronDown, ChevronUp, Users, Gavel, UserCheck } from 'lucide-react';
import { Verdict, JudgingMode } from '@/lib/types';
import clsx from 'clsx';

interface VerdictPanelProps {
  verdict: Verdict | null;
  judgeModelName: string;
}

const MODE_LABELS: Record<JudgingMode, { icon: typeof Gavel; label: string }> = {
  judge: { icon: Gavel, label: 'Single Judge' },
  committee: { icon: Users, label: 'Committee Vote' },
  executive: { icon: UserCheck, label: 'Executive Panel' },
};

export function VerdictPanel({ verdict, judgeModelName }: VerdictPanelProps) {
  const [showVotes, setShowVotes] = useState(false);

  if (!verdict) return null;

  const { winnerModelName, reasoning, scores, isLoading, error, judgingMode, votes, voteCount } = verdict;
  const hasMultipleJudges = votes && votes.length > 1;
  const modeInfo = judgingMode ? MODE_LABELS[judgingMode] : MODE_LABELS.judge;
  const ModeIcon = modeInfo.icon;

  // Build judge description
  const judgeDescription = hasMultipleJudges
    ? `${votes.length} judges (${modeInfo.label})`
    : `Judged by ${judgeModelName}`;

  return (
    <div
      className={clsx(
        'rounded-xl border overflow-hidden',
        error ? 'border-red-500/50 bg-red-900/10' : 'border-yellow-500/30 bg-yellow-900/10'
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-yellow-800/30 bg-yellow-900/20">
        <Award className="w-5 h-5 text-yellow-400" />
        <h3 className="font-semibold text-yellow-300">Committee Verdict</h3>
        <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
          <ModeIcon className="w-3 h-3" />
          <span>{judgeDescription}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center gap-3 text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Judge is evaluating responses...</span>
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Judging Failed</p>
              <p className="text-sm text-red-400/80">{error}</p>
              <p className="text-sm text-gray-500 mt-1">
                Individual responses are still visible above.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Winner announcement with vote count */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-400">Winner:</span>
              <span className="font-semibold text-green-400 text-lg">
                {winnerModelName}
              </span>
              {hasMultipleJudges && voteCount && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                  {voteCount[verdict.winnerModelId] || 0}/{votes.length} votes
                </span>
              )}
            </div>

            {/* Vote breakdown for multi-judge */}
            {hasMultipleJudges && voteCount && (
              <div>
                <button
                  onClick={() => setShowVotes(!showVotes)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300"
                >
                  {showVotes ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  <span>Vote breakdown</span>
                </button>
                
                {showVotes && (
                  <div className="mt-2 space-y-2">
                    {/* Vote counts */}
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(voteCount)
                        .sort(([, a], [, b]) => b - a)
                        .map(([modelId, count]) => {
                          const modelName = modelId.split('/').pop() || modelId;
                          const isWinner = modelId === verdict.winnerModelId;
                          return (
                            <div
                              key={modelId}
                              className={clsx(
                                'px-2 py-1 rounded text-xs',
                                isWinner
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-gray-800/50 text-gray-400'
                              )}
                            >
                              {modelName}: {count} vote{count !== 1 ? 's' : ''}
                            </div>
                          );
                        })}
                    </div>

                    {/* Individual judge votes */}
                    <div className="mt-3 space-y-2">
                      <h5 className="text-xs font-medium text-gray-500">Individual Votes</h5>
                      {votes.map((vote, i) => {
                        const votedFor = vote.winnerModelId.split('/').pop() || vote.winnerModelId;
                        return (
                          <div
                            key={i}
                            className="p-2 rounded bg-gray-800/30 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-gray-400">{vote.judgeModelName}</span>
                              <span className="text-yellow-400">→ {votedFor}</span>
                            </div>
                            <p className="text-gray-500 text-xs line-clamp-2">{vote.reasoning}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                {hasMultipleJudges ? 'Summary' : 'Reasoning'}
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed">{reasoning}</p>
            </div>

            {/* Scores breakdown */}
            {scores && scores.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-2">Scores</h4>
                <div className="grid gap-3">
                  {scores
                    .sort((a, b) => b.score - a.score)
                    .map((score) => (
                      <div
                        key={score.modelId}
                        className="flex items-center gap-3 p-2 rounded-lg bg-gray-800/30"
                      >
                        <div className="w-12 text-center">
                          <span
                            className={clsx(
                              'font-bold text-lg',
                              score.score >= 80
                                ? 'text-green-400'
                                : score.score >= 60
                                ? 'text-yellow-400'
                                : 'text-gray-400'
                            )}
                          >
                            {score.score}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-300">
                            {score.modelId.split('/').pop()}
                          </div>
                          {score.strengths.length > 0 && (
                            <div className="text-xs text-green-400/80 mt-1">
                              + {score.strengths.slice(0, 2).join(', ')}
                            </div>
                          )}
                          {score.weaknesses.length > 0 && (
                            <div className="text-xs text-red-400/80">
                              − {score.weaknesses.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
