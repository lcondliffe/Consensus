'use client';

import { useState, useEffect, useMemo } from 'react';
import { Check, Gavel, Users, Search, Loader2, RefreshCw } from 'lucide-react';
import clsx from 'clsx';

interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
}

interface ModelSelectorProps {
  selectedCommittee: string[];
  judgeModelId: string;
  onCommitteeChange: (models: string[]) => void;
  onJudgeChange: (modelId: string) => void;
  disabled?: boolean;
}

// Fallback models if API fails
const FALLBACK_MODELS: ModelInfo[] = [
  { id: 'anthropic/claude-sonnet-4', name: 'Claude Sonnet 4', provider: 'Anthropic', contextLength: 200000 },
  { id: 'openai/gpt-4o', name: 'GPT-4o', provider: 'OpenAI', contextLength: 128000 },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', provider: 'Google', contextLength: 1000000 },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', provider: 'Anthropic', contextLength: 200000 },
  { id: 'openai/gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', contextLength: 128000 },
];

export function ModelSelector({
  selectedCommittee,
  judgeModelId,
  onCommitteeChange,
  onJudgeChange,
  disabled = false,
}: ModelSelectorProps) {
  const [models, setModels] = useState<ModelInfo[]>(FALLBACK_MODELS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<string>('all');

  // Fetch models from OpenRouter
  const fetchModels = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/models');
      if (!response.ok) throw new Error('Failed to fetch models');
      const data = await response.json();
      if (data.models && data.models.length > 0) {
        setModels(data.models);
      }
    } catch (err) {
      setError('Failed to load models');
      console.error('Error fetching models:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  // Get unique providers
  const providers = useMemo(() => {
    const providerSet = new Set(models.map((m) => m.provider));
    return Array.from(providerSet).sort();
  }, [models]);

  // Filter models by search and provider
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

  const getModelName = (modelId: string): string => {
    return models.find((m) => m.id === modelId)?.name || modelId.split('/').pop() || modelId;
  };

  return (
    <div className="space-y-6">
      {/* Search and Filter */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search models..."
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
          <button
            onClick={fetchModels}
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
        </div>
      </div>

      {/* Committee Selection */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Users className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-medium text-gray-300">Committee Models</h3>
          <span className="text-xs text-gray-500">
            ({selectedCommittee.length} selected, min 2)
          </span>
        </div>
        
        {error && (
          <p className="text-xs text-yellow-500 mb-2">{error} - using fallback models</p>
        )}

        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-8 text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading models...</span>
            </div>
          ) : filteredModels.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">No models match your search</p>
          ) : (
            filteredModels.map((model) => {
              const isSelected = selectedCommittee.includes(model.id);
              const isJudge = model.id === judgeModelId;

              return (
                <button
                  key={model.id}
                  onClick={() => toggleCommitteeModel(model.id)}
                  disabled={disabled || isJudge}
                  className={clsx(
                    'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-all',
                    isJudge && 'opacity-40 cursor-not-allowed bg-gray-800/30',
                    !isJudge && isSelected && 'bg-blue-600/20 border border-blue-500/50',
                    !isJudge && !isSelected && 'bg-gray-800/50 border border-gray-700 hover:border-gray-600',
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
                      {model.provider} • {(model.contextLength / 1000).toFixed(0)}k ctx
                    </div>
                  </div>
                  {isJudge && (
                    <span className="text-xs text-yellow-500/80 flex-shrink-0">Judge</span>
                  )}
                </button>
              );
            })
          )}
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
          {models.map((model) => (
            <option key={model.id} value={model.id}>
              {model.name} ({model.provider})
            </option>
          ))}
        </select>
        <p className="text-xs text-gray-500 mt-1">
          Judge: {getModelName(judgeModelId)}
        </p>
      </div>
    </div>
  );
}
