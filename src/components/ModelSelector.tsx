'use client';

import { Users } from 'lucide-react';
import { ModelPicker, ModelOption } from './ModelPicker';

interface ModelSelectorProps {
  models: ModelOption[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  selectedCommittee: string[];
  judgeModelId: string;
  onCommitteeChange: (models: string[]) => void;
  disabled?: boolean;
}

export function ModelSelector({
  models,
  isLoading,
  error,
  onRefresh,
  selectedCommittee,
  judgeModelId,
  onCommitteeChange,
  disabled = false,
}: ModelSelectorProps) {

  return (
    <div className="space-y-4">
      {/* Committee Selection Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-300">Committee Models</h3>
          <span className="text-xs text-gray-500">
            ({selectedCommittee.length} selected, min 2)
          </span>
        </div>
        
        <ModelPicker
          models={models}
          selectedIds={selectedCommittee}
          onSelectionChange={onCommitteeChange}
          multiSelect={true}
          disabled={disabled}
          disabledIds={[judgeModelId]}
          isLoading={isLoading}
          error={error}
          onRefresh={onRefresh}
          searchPlaceholder="Search committee models..."
          renderExtraInfo={(model) => 
            model.id === judgeModelId ? (
              <span className="text-xs text-yellow-500/80 flex-shrink-0">Judge</span>
            ) : null
          }
        />
      </div>
    </div>
  );
}
