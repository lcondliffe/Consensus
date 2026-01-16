'use client';

import { useState } from 'react';
import { AlertCircle, Award, Loader2, ChevronDown, ChevronUp, Users, Gavel, UserCheck, Star, Sparkles } from 'lucide-react';
import { Verdict, JudgingMode } from '@/lib/types';
import { getModelById } from '@/lib/models';
import { ProviderLogo } from './ProviderLogo';
import { MarkdownRenderer } from './MarkdownRenderer';
import clsx from 'clsx';

interface VerdictPanelProps {
  verdict: Verdict | null;
  judgeModelName: string;
}

const MODE_LABELS: Record<JudgingMode, { icon: typeof Gavel; label: string }> = {
  judge: { icon: Gavel, label: 'Single Judge' },
  committee: { icon: Users, label: 'Committee Vote' },
  executive: { icon: UserCheck, label: 'Executive Panel' },
  consensus: { icon: Sparkles, label: 'Consensus Synthesis' },
};

/**
 * Render a verdict panel displaying judging results or a consensus synthesis.
 *
 * The component renders different UIs based on `verdict` state:
 * - If `verdict` is null, renders nothing.
 * - While `verdict.isLoading` is true, shows a loading state (text varies for consensus mode).
 * - If `verdict.error` is present, shows an error panel with the message.
 * - If `judgingMode === 'consensus'` and `verdict.consensusResult` is provided, renders a synthesized response,
 *   model contributions, and key points.
 * - Otherwise, renders the winner announcement, reasoning (or summary when multiple judges exist),
 *   an optional collapsible vote breakdown for multi-judge verdicts, and a scorecard when `scores` are present.
 *
 * @param verdict - The verdict data to display; may be `null`. When present, relevant fields include:
 *   `winnerModelId`, `winnerModelName`, `reasoning`, `scores`, `isLoading`, `error`, `judgingMode`,
 *   `votes`, `voteCount`, and `consensusResult` (used only for consensus mode).
 * @param judgeModelName - Human-readable name of the judge model (used in header and consensus attribution).
 * @returns The rendered JSX element for the panel, or `null` if `verdict` is `null`.
 */
export function VerdictPanel({ verdict, judgeModelName }: VerdictPanelProps) {
  const [showVotes, setShowVotes] = useState(false);

  if (!verdict) return null;

  const { winnerModelName, reasoning, scores, isLoading, error, judgingMode, votes, voteCount, consensusResult } = verdict;
  const hasMultipleJudges = votes && votes.length > 1;
  const modeInfo = judgingMode ? MODE_LABELS[judgingMode] : MODE_LABELS.judge;
  const ModeIcon = modeInfo.icon;
  const isConsensusMode = judgingMode === 'consensus';

  const judgeDescription = isConsensusMode
    ? `Synthesized by ${judgeModelName}`
    : hasMultipleJudges
    ? `${votes.length} judges (${modeInfo.label})`
    : `Judged by ${judgeModelName}`;

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-white/5 bg-surface-2/30 p-8 flex flex-col items-center justify-center text-center animate-pulse">
         <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-4">
           <Loader2 className="w-6 h-6 animate-spin text-accent" />
         </div>
         <h3 className="text-lg font-medium text-white mb-2">
           {isConsensusMode ? 'Synthesizing Responses' : 'Evaluating Responses'}
         </h3>
         <p className="text-sm text-gray-500 max-w-sm">
           {isConsensusMode
             ? 'Creating a unified response that combines the best insights from all models.'
             : 'The judge is analyzing each response against the criteria to determine the winner.'}
         </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-900/10 p-6 flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 text-red-400">
           <AlertCircle className="w-5 h-5" />
        </div>
        <div>
           <h3 className="text-lg font-medium text-red-400 mb-1">Judging Failed</h3>
           <p className="text-sm text-red-300/80 mb-2">{error}</p>
           <p className="text-xs text-red-400/50">You can try submitting again or change the judge model.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-900/10 to-transparent overflow-hidden shadow-2xl shadow-amber-900/5">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b border-amber-500/10 bg-amber-500/5">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shadow-inner shadow-amber-500/20">
           {isConsensusMode ? (
             <Sparkles className="w-6 h-6 text-amber-400 drop-shadow-md" />
           ) : (
             <Award className="w-6 h-6 text-amber-400 drop-shadow-md" />
           )}
        </div>
        <div>
          <h3 className="font-bold text-amber-100 text-lg">
            {isConsensusMode ? 'Consensus Synthesis' : 'Committee Verdict'}
          </h3>
          <div className="flex items-center gap-1.5 text-xs text-amber-200/60 font-medium uppercase tracking-wide">
            <ModeIcon className="w-3.5 h-3.5" />
            <span>{judgeDescription}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-6">
            {/* Consensus mode: Show synthesized response */}
            {isConsensusMode && consensusResult ? (
              <>
                {/* Synthesized Response */}
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Unified Response
                  </h4>
                  <div className="bg-surface-2/30 p-4 rounded-xl border border-white/5 prose prose-invert prose-sm max-w-none">
                    <MarkdownRenderer content={consensusResult.synthesizedResponse} />
                  </div>
                </div>

                {/* Model Contributions */}
                {consensusResult.attributions && consensusResult.attributions.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Model Contributions</h4>
                    <div className="space-y-2">
                      {consensusResult.attributions.map((attr, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 p-3 rounded-lg bg-surface-2/30 border border-white/5"
                        >
                          <div className="w-8 h-8 rounded-lg bg-surface-1 flex items-center justify-center flex-shrink-0 border border-white/5">
                            <ProviderLogo provider={getModelById(attr.modelId)?.provider || attr.modelId} size={16} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-200 mb-0.5">
                              {attr.modelName || attr.modelId.split('/').pop()}
                            </div>
                            <p className="text-xs text-gray-400">{attr.contribution}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Key Points */}
                {consensusResult.keyPoints && consensusResult.keyPoints.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-400 mb-3">Key Points</h4>
                    <div className="space-y-2">
                      {consensusResult.keyPoints.map((kp, i) => (
                        <div
                          key={i}
                          className="p-3 rounded-lg bg-surface-2/30 border border-white/5"
                        >
                          <p className="text-sm text-gray-300 mb-2">{kp.point}</p>
                          <div className="flex flex-wrap gap-1">
                            {kp.sourceModelIds.map((modelId, j) => (
                              <span
                                key={j}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-3 text-xs text-gray-400 border border-white/5"
                              >
                                <ProviderLogo provider={getModelById(modelId)?.provider || modelId} size={10} />
                                {modelId.split('/').pop()}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Winner announcement (non-consensus modes) */}
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 pb-6 border-b border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-surface-1 border border-white/10 flex items-center justify-center shadow-lg">
                      <ProviderLogo provider={getModelById(verdict.winnerModelId)?.provider || verdict.winnerModelId} size={32} />
                    </div>
                    <div>
                       <span className="text-xs text-amber-200/50 uppercase tracking-widest font-bold mb-1 block">Winner</span>
                       <span className="font-bold text-2xl md:text-3xl text-white tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-amber-200">
                         {winnerModelName}
                       </span>
                    </div>
                  </div>

                  {hasMultipleJudges && voteCount && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                       <div className="flex -space-x-1">
                         {[...Array(3)].map((_, i) => (
                           <div key={i} className="w-4 h-4 rounded-full bg-amber-500/20 ring-1 ring-background" />
                         ))}
                       </div>
                       <span className="text-sm font-medium text-amber-200">
                          {voteCount[verdict.winnerModelId] || 0} / {votes.length} votes
                       </span>
                    </div>
                  )}
                </div>

                {/* Reasoning */}
                <div className="prose prose-invert prose-sm max-w-none">
                  <h4 className="text-sm font-medium text-gray-400 mb-2 flex items-center gap-2">
                     <Star className="w-4 h-4 text-amber-400" />
                     {hasMultipleJudges ? 'Summary' : 'Reasoning'}
                  </h4>
                  <p className="text-gray-300 leading-relaxed bg-surface-2/30 p-4 rounded-xl border border-white/5">
                    {reasoning}
                  </p>
                </div>
              </>
            )}

            {/* Vote breakdown for multi-judge (non-consensus only) */}
            {!isConsensusMode && hasMultipleJudges && voteCount && (
              <div className="rounded-xl border border-white/5 bg-surface-2/20 overflow-hidden">
                <button
                  onClick={() => setShowVotes(!showVotes)}
                  className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm font-medium text-gray-300">Vote Breakdown</span>
                  {showVotes ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </button>
                
                {showVotes && (
                  <div className="p-4 pt-0 border-t border-white/5 mt-4">
                    <div className="flex flex-wrap gap-2 mb-4">
                      {Object.entries(voteCount)
                        .sort(([, a], [, b]) => b - a)
                        .map(([modelId, count]) => {
                          const modelName = modelId.split('/').pop() || modelId;
                          const isWinner = modelId === verdict.winnerModelId;
                          return (
                            <div
                              key={modelId}
                              className={clsx(
                                'px-2 py-1 rounded text-xs font-medium',
                                isWinner
                                  ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                  : 'bg-surface-3 text-gray-400 border border-white/5'
                              )}
                            >
                              {modelName}: {count}
                            </div>
                          );
                        })}
                    </div>

                    <div className="space-y-2">
                      {votes.map((vote, i) => {
                        const votedFor = vote.winnerModelId.split('/').pop() || vote.winnerModelId;
                        return (
                          <div
                            key={i}
                            className="p-3 rounded-lg bg-surface-1/50 border border-white/5 text-xs"
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded bg-surface-2 flex items-center justify-center">
                                   <ProviderLogo provider={getModelById(vote.judgeModelId)?.provider || vote.judgeModelId} size={12} />
                                </div>
                                <span className="font-medium text-gray-300">{vote.judgeModelName}</span>
                              </div>
                              <span className="text-amber-400 bg-amber-900/20 px-1.5 py-0.5 rounded">→ {votedFor}</span>
                            </div>
                            <p className="text-gray-500 line-clamp-2 italic">{vote.reasoning}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Scores breakdown */}
            {scores && scores.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-400 mb-3">Scorecard</h4>
                <div className="grid sm:grid-cols-2 gap-3">
                  {scores
                    .sort((a, b) => b.score - a.score)
                    .map((score) => (
                      <div
                        key={score.modelId}
                        className="flex items-center gap-4 p-3 rounded-xl bg-surface-2/40 border border-white/5 hover:border-white/10 transition-colors"
                      >
                        <div className="w-12 h-12 rounded-lg bg-surface-1 flex items-center justify-center border border-white/5">
                          <ProviderLogo provider={getModelById(score.modelId)?.provider || score.modelId} size={24} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="text-sm font-medium text-gray-200 truncate">
                              {score.modelId.split('/').pop()}
                            </div>
                            <span
                              className={clsx(
                                'font-bold text-sm',
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
                          
                          <div className="flex flex-wrap gap-1">
                             {score.strengths.slice(0, 1).map((s, i) => (
                               <span key={i} className="text-[10px] text-green-400/80 bg-green-900/10 px-1.5 py-0.5 rounded truncate max-w-full">
                                 + {s}
                               </span>
                             ))}
                             {score.weaknesses.slice(0, 1).map((w, i) => (
                               <span key={i} className="text-[10px] text-red-400/80 bg-red-900/10 px-1.5 py-0.5 rounded truncate max-w-full">
                                 - {w}
                               </span>
                             ))}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}