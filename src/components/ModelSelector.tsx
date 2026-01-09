'use client';

import { Users, X } from 'lucide-react';
import { ModelPicker, ModelOption } from './ModelPicker';
import { ProviderLogo } from './ProviderLogo';

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

  const removeModel = (modelId: string) => {
    if (disabled || modelId === judgeModelId) return;
    onCommitteeChange(selectedCommittee.filter((id) => id !== modelId));
  };

  // Build selected model objects, creating fallback entries for models not in the API response
  const selectedModelObjects = selectedCommittee.map((id) => {
    const found = models.find((m) => m.id === id);
    if (found) return found;
    // Fallback: extract provider and name from the ID
    const [providerSlug, ...rest] = id.split('/');
    const modelName = rest.join('/') || id;
    return {
      id,
      name: modelName,
      provider: providerSlug || 'Unknown',
    };
  });

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

        {/* Selected Models Chips */}
        {selectedModelObjects.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3 p-3 bg-gray-900/30 rounded-lg border border-white/5">
            {selectedModelObjects.map((model) => {
              const isJudge = model.id === judgeModelId;
              return (
                <div
                  key={model.id}
                  className={`
                    flex items-center gap-1.5 px-2 py-1 rounded-md text-xs border transition-colors
                    ${isJudge 
                      ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-200' 
                      : 'bg-blue-500/10 border-blue-500/20 text-blue-200'
                    }
                  `}
                >
                  <ProviderLogo provider={model.provider} size={14} />
                  <span className="truncate max-w-[150px]">{model.name}</span>
                  {isJudge && <span className="text-[10px] opacity-70 border border-yellow-500/30 px-1 rounded">Judge</span>}
                  
                  {!isJudge && (
                    <button
                      onClick={() => removeModel(model.id)}
                      disabled={disabled}
                      className="hover:bg-white/10 rounded p-0.5 transition-colors focus:outline-none focus:ring-1 focus:ring-white/20"
                      title="Remove model"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
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
