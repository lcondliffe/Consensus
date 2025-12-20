'use client';

import { useState, useMemo } from 'react';
import { Search, Check, RefreshCw, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export interface ModelOption {
  id: string;
  name: string;
  provider: string;
  contextLength?: number;
}

interface ModelPickerProps {
  models: ModelOption[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  multiSelect?: boolean;
  disabled?: boolean;
  disabledIds?: string[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  searchPlaceholder?: string;
  emptyMessage?: string;
  renderExtraInfo?: (model: ModelOption) => React.ReactNode;
}

export function ModelPicker({
  models,
  selectedIds,
  onSelectionChange,
  multiSelect = false,
  disabled = false,
  disabledIds = [],
  isLoading = false,
  error = null,
  onRefresh,
  searchPlaceholder = 'Search models...',
  emptyMessage = 'No models match your search',
  renderExtraInfo,
}: ModelPickerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Get unique providers
  const providers = useMemo(() => {
    const providerSet = new Set(models.map((m) => m.provider));
    return Array.from(providerSet).sort();
  }, [models]);

  // Filter models
  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const matchesSearch =
        searchQuery === '' ||
        model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesProvider =
        selectedProvider === 'all' || model.provider === selectedProvider;

      return matchesSearch && matchesProvider;
    });
  }, [models, searchQuery, selectedProvider]);

  const toggleModel = (modelId: string) => {
    if (disabled) return;
    
    // Check if explicitly disabled
    if (disabledIds.includes(modelId)) return;

    if (multiSelect) {
      if (selectedIds.includes(modelId)) {
        onSelectionChange(selectedIds.filter((id) => id !== modelId));
      } else {
        onSelectionChange([...selectedIds, modelId]);
      }
    } else {
      // Single select - always replace
      onSelectionChange([modelId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={searchPlaceholder}
            disabled={disabled}
            className={clsx(
              'w-full pl-9 pr-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700',
              'text-sm text-gray-200 placeholder-gray-500',
              'focus:outline-none focus:border-blue-500/50',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          />
        </div>
        <div className="flex gap-2">
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            disabled={disabled}
            className={clsx(
              'flex-1 px-3 py-1.5 rounded-lg bg-gray-800/50 border border-gray-700',
              'text-xs text-gray-300',
              'focus:outline-none focus:border-blue-500/50',
              disabled && 'cursor-not-allowed opacity-60'
            )}
          >
            <option value="all">All Providers</option>
            {providers.map((provider) => (
              <option key={provider} value={provider}>
                {provider}
              </option>
            ))}
          </select>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={disabled || isLoading}
              className={clsx(
                'p-1.5 rounded-lg bg-gray-800/50 border border-gray-700',
                'text-gray-400 hover:text-gray-200 hover:border-gray-600',
                (disabled || isLoading) && 'cursor-not-allowed opacity-60'
              )}
              title="Refresh models"
            >
              <RefreshCw className={clsx('w-4 h-4', isLoading && 'animate-spin')} />
            </button>
          )}
        </div>
      </div>

      {/* Models List */}
      <div>
        {error && (
          <p className="text-xs text-yellow-500 mb-2">{error}</p>
        )}

        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading models...</span>
            </div>
          ) : filteredModels.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">{emptyMessage}</p>
          ) : (
            filteredModels.map((model) => {
              const isSelected = selectedIds.includes(model.id);
              const isDisabled = disabledIds.includes(model.id);

              return (
                <button
                  key={model.id}
                  onClick={() => toggleModel(model.id)}
                  disabled={disabled || isDisabled}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all',
                    isDisabled && 'opacity-40 cursor-not-allowed bg-gray-800/30',
                    !isDisabled && isSelected && 'bg-blue-600/20 border border-blue-500/50',
                    !isDisabled && !isSelected && 'bg-gray-800/50 border border-gray-700 hover:border-gray-600',
                    disabled && 'cursor-not-allowed'
                  )}
                >
                  <div
                    className={clsx(
                      'w-4 h-4 rounded border flex items-center justify-center flex-shrink-0',
                      isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-600'
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{model.name}</div>
                    <div className="text-xs text-gray-500 truncate">
                      {model.provider}
                      {model.contextLength && ` • ${(model.contextLength / 1000).toFixed(0)}k ctx`}
                    </div>
                  </div>
                  {renderExtraInfo && renderExtraInfo(model)}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
