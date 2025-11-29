'use client';

import { AlertCircle, Award, Loader2 } from 'lucide-react';
import { Verdict } from '@/lib/types';
import clsx from 'clsx';

interface VerdictPanelProps {
  verdict: Verdict | null;
  judgeModelName: string;
}

export function VerdictPanel({ verdict, judgeModelName }: VerdictPanelProps) {
  if (!verdict) return null;

  const { winnerModelName, reasoning, scores, isLoading, error } = verdict;

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
        <span className="text-xs text-gray-500 ml-auto">
          Judged by {judgeModelName}
        </span>
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
            {/* Winner announcement */}
            <div className="flex items-center gap-2">
              <span className="text-gray-400">Winner:</span>
              <span className="font-semibold text-green-400 text-lg">
                {winnerModelName}
              </span>
            </div>

            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-medium text-gray-400 mb-2">Reasoning</h4>
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
