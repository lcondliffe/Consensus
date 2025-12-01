'use client';

import { useState, useEffect, useMemo } from 'react';
import { Gavel, Users, UserCheck, Check, Search } from 'lucide-react';
import { JudgingMode } from '@/lib/types';
import clsx from 'clsx';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
}

interface JudgingModeSelectorProps {
  mode: JudgingMode;
  onModeChange: (mode: JudgingMode) => void;
  // Single judge (for 'judge' mode)
  judgeModelId: string;
  onJudgeChange: (modelId: string) => void;
  // Executive judges (for 'executive' mode)
  executiveJudgeIds: string[];
  onExecutiveJudgesChange: (modelIds: string[]) => void;
  // Committee models (needed to exclude from executive selection)
  committeeModelIds: string[];
  // All available models
  availableModels: ModelInfo[];
  disabled?: boolean;
}

const MODE_INFO: Record<JudgingMode, { icon: typeof Gavel; label: string; description: string }> = {
  judge: {
    icon: Gavel,
    label: 'Single Judge',
    description: 'One model evaluates all responses',
  },
  committee: {
    icon: Users,
    label: 'Committee Vote',
    description: 'All responding models vote (excluding self)',
  },
  executive: {
    icon: UserCheck,
    label: 'Executive Panel',
    description: 'Select multiple judges to vote',
  },
};

export function JudgingModeSelector({
  mode,
  onModeChange,
  judgeModelId,
  onJudgeChange,
  executiveJudgeIds,
  onExecutiveJudgesChange,
  committeeModelIds,
  availableModels,
  disabled = false,
}: JudgingModeSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter models for executive selection (exclude committee members)
  const executiveEligibleModels = useMemo(() => {
    return availableModels.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.id.toLowerCase().includes(searchQuery.toLowerCase());
      // Can select models not in committee, OR already selected as executive
      const notInCommittee = !committeeModelIds.includes(m.id);
      const alreadySelected = executiveJudgeIds.includes(m.id);
      return matchesSearch && (notInCommittee || alreadySelected);
    });
  }, [availableModels, committeeModelIds, executiveJudgeIds, searchQuery]);

  // When mode changes, clear executive judges if switching away
  useEffect(() => {
    if (mode !== 'executive' && executiveJudgeIds.length > 0) {
      // Keep them but they won't be used
    }
  }, [mode, executiveJudgeIds]);

  const toggleExecutiveJudge = (modelId: string) => {
    if (disabled) return;
    if (executiveJudgeIds.includes(modelId)) {
      onExecutiveJudgesChange(executiveJudgeIds.filter((id) => id !== modelId));
    } else {
      onExecutiveJudgesChange([...executiveJudgeIds, modelId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Mode Selection */}
      <div>
        <h3 className="text-sm font-medium text-gray-300 mb-3">Judging Mode</h3>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(MODE_INFO) as [JudgingMode, typeof MODE_INFO[JudgingMode]][]).map(
            ([modeKey, info]) => {
              const Icon = info.icon;
              const isSelected = mode === modeKey;
              return (
                <button
                  key={modeKey}
                  onClick={() => onModeChange(modeKey)}
                  disabled={disabled}
                  className={clsx(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all text-center',
                    isSelected
                      ? 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300'
                      : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-gray-600',
                    disabled && 'cursor-not-allowed opacity-60'
                  )}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs font-medium">{info.label}</span>
                </button>
              );
            }
          )}
        </div>
        <p className="text-xs text-gray-500 mt-2">{MODE_INFO[mode].description}</p>
      </div>

      {/* Single Judge Selection (for 'judge' mode) */}
      {mode === 'judge' && (
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-2">
            Judge Model
          </label>
          <select
            value={judgeModelId}
            onChange={(e) => onJudgeChange(e.target.value)}
            disabled={disabled}
            className={clsx(
              'w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700',
              'text-sm text-gray-200',
              'focus:outline-none focus:border-yellow-500/50',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name} ({model.provider})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Executive Judges Selection (for 'executive' mode) */}
      {mode === 'executive' && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-medium text-gray-400">
              Executive Judges
            </label>
            <span className="text-xs text-gray-500">
              {executiveJudgeIds.length} selected (min 2)
            </span>
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search models..."
              disabled={disabled}
              className={clsx(
                'w-full pl-8 pr-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700',
                'text-xs text-gray-200 placeholder-gray-500',
                'focus:outline-none focus:border-yellow-500/50',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            />
          </div>

          {/* Model list */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {executiveEligibleModels.length === 0 ? (
              <p className="text-xs text-gray-500 py-2 text-center">
                No eligible models (all are in committee)
              </p>
            ) : (
              executiveEligibleModels.map((model) => {
                const isSelected = executiveJudgeIds.includes(model.id);
                const isInCommittee = committeeModelIds.includes(model.id);

                return (
                  <button
                    key={model.id}
                    onClick={() => toggleExecutiveJudge(model.id)}
                    disabled={disabled || isInCommittee}
                    className={clsx(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-xs transition-all',
                      isInCommittee && 'opacity-40 cursor-not-allowed',
                      isSelected && !isInCommittee && 'bg-yellow-600/20 border border-yellow-500/50',
                      !isSelected && !isInCommittee && 'bg-gray-800/50 border border-gray-700 hover:border-gray-600',
                      disabled && 'cursor-not-allowed'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-3 h-3 rounded border flex items-center justify-center flex-shrink-0',
                        isSelected ? 'bg-yellow-500 border-yellow-500' : 'border-gray-600'
                      )}
                    >
                      {isSelected && <Check className="w-2 h-2 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="truncate">{model.name}</span>
                      {isInCommittee && (
                        <span className="text-gray-500 ml-1">(in committee)</span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {executiveJudgeIds.length < 2 && (
            <p className="text-xs text-yellow-500/80 mt-2">
              Select at least 2 judges for executive mode
            </p>
          )}
        </div>
      )}

      {/* Committee mode info */}
      {mode === 'committee' && (
        <div className="p-3 rounded-lg bg-gray-800/30 border border-gray-700">
          <p className="text-xs text-gray-400">
            In committee mode, each responding model will evaluate the other responses
            and vote for the best one. Models cannot vote for their own response.
          </p>
        </div>
      )}
    </div>
  );
}
