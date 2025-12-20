'use client';

import { Gavel, Users, UserCheck } from 'lucide-react';
import { JudgingMode } from '@/lib/types';
import clsx from 'clsx';
import { ModelPicker, ModelOption } from './ModelPicker';

interface JudgingModeSelectorProps {
  mode: JudgingMode;
  onModeChange: (mode: JudgingMode) => void;
  judgeModelId: string;
  onJudgeChange: (modelId: string) => void;
  executiveJudgeIds: string[];
  onExecutiveJudgesChange: (modelIds: string[]) => void;
  committeeModelIds: string[];
  models: ModelOption[];
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
  models,
  disabled = false,
}: JudgingModeSelectorProps) {

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
          <ModelPicker
            models={models}
            selectedIds={[judgeModelId]}
            onSelectionChange={(ids) => ids.length > 0 && onJudgeChange(ids[0])}
            multiSelect={false}
            disabled={disabled}
            searchPlaceholder="Search judge model..."
            renderExtraInfo={(model) => 
              committeeModelIds.includes(model.id) ? (
                <span className="text-xs text-blue-400/80 flex-shrink-0">In Committee (will be removed)</span>
              ) : null
            }
          />
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

          <ModelPicker
            models={models}
            selectedIds={executiveJudgeIds}
            onSelectionChange={onExecutiveJudgesChange}
            multiSelect={true}
            disabled={disabled}
            disabledIds={committeeModelIds}
            searchPlaceholder="Search executive judges..."
            emptyMessage="No eligible models (all are in committee)"
            renderExtraInfo={(model) => 
              committeeModelIds.includes(model.id) ? (
                <span className="text-xs text-blue-400/80 flex-shrink-0">In Committee</span>
              ) : null
            }
          />

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
