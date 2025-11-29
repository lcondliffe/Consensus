'use client';

import { Check, Gavel, Users } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/models';
import clsx from 'clsx';

interface ModelSelectorProps {
  selectedCommittee: string[];
  judgeModelId: string;
  onCommitteeChange: (models: string[]) => void;
  onJudgeChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({
  selectedCommittee,
  judgeModelId,
  onCommitteeChange,
  onJudgeChange,
  disabled = false,
}: ModelSelectorProps) {
  const toggleCommitteeModel = (modelId: string) => {
    if (disabled) return;
    // FR-009: Prevent judge from being selected as committee member
    if (modelId === judgeModelId) return;

    if (selectedCommittee.includes(modelId)) {
      onCommitteeChange(selectedCommittee.filter((id) => id !== modelId));
    } else {
      onCommitteeChange([...selectedCommittee, modelId]);
    }
  };

  const handleJudgeChange = (modelId: string) => {
    if (disabled) return;
    onJudgeChange(modelId);
    // FR-009: Remove from committee if selected as judge
    if (selectedCommittee.includes(modelId)) {
      onCommitteeChange(selectedCommittee.filter((id) => id !== modelId));
    }
  };

  return (
    <div className="space-y-6">
      {/* Committee Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-300">Committee Models</h3>
          <span className="text-xs text-gray-500">
            ({selectedCommittee.length} selected, min 2)
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {AVAILABLE_MODELS.map((model) => {
            const isSelected = selectedCommittee.includes(model.id);
            const isJudge = model.id === judgeModelId;

            return (
              <button
                key={model.id}
                onClick={() => toggleCommitteeModel(model.id)}
                disabled={disabled || isJudge}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all',
                  isJudge && 'opacity-40 cursor-not-allowed bg-gray-800/30',
                  !isJudge && isSelected && 'bg-blue-600/20 border border-blue-500/50',
                  !isJudge && !isSelected && 'bg-gray-800/50 border border-gray-700 hover:border-gray-600',
                  disabled && 'cursor-not-allowed'
                )}
              >
                <div
                  className={clsx(
                    'w-4 h-4 rounded border flex items-center justify-center',
                    isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{model.displayName}</div>
                  <div className="text-xs text-gray-500">{model.provider}</div>
                </div>
                {isJudge && (
                  <span className="text-xs text-yellow-500/80">Judge</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Judge Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Gavel className="w-4 h-4 text-yellow-400" />
          <h3 className="text-sm font-medium text-gray-300">Judge Model</h3>
        </div>
        <select
          value={judgeModelId}
          onChange={(e) => handleJudgeChange(e.target.value)}
          disabled={disabled}
          className={clsx(
            'w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700',
            'text-sm text-gray-200',
            'focus:outline-none focus:border-yellow-500/50',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          {AVAILABLE_MODELS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.displayName} ({model.provider})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          The judge evaluates all responses and declares a winner
        </p>
      </div>
    </div>
  );
}
