'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2, Scale } from 'lucide-react';
import {
  JudgingCriteria,
  JudgingCriterion,
  JUDGING_PRESETS,
  DEFAULT_CRITERIA_ID,
} from '@/lib/criteria';
import clsx from 'clsx';

interface CriteriaSelectorProps {
  selectedCriteria: JudgingCriteria;
  onCriteriaChange: (criteria: JudgingCriteria) => void;
  disabled?: boolean;
}

export function CriteriaSelector({
  selectedCriteria,
  onCriteriaChange,
  disabled = false,
}: CriteriaSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCustomMode, setIsCustomMode] = useState(selectedCriteria.isCustom ?? false);
  const [customCriteria, setCustomCriteria] = useState<JudgingCriterion[]>(
    selectedCriteria.isCustom ? selectedCriteria.criteria : []
  );
  const [customName, setCustomName] = useState(
    selectedCriteria.isCustom ? selectedCriteria.name : ''
  );

  const handlePresetChange = (presetId: string) => {
    if (presetId === 'custom') {
      setIsCustomMode(true);
      if (customCriteria.length === 0) {
        // Start with a default criterion
        setCustomCriteria([
          { name: '', weight: 3, description: '' },
        ]);
      }
    } else {
      setIsCustomMode(false);
      const preset = JUDGING_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        onCriteriaChange(preset);
      }
    }
  };

  const handleCustomCriterionChange = (
    index: number,
    field: keyof JudgingCriterion,
    value: string | number
  ) => {
    const updated = [...customCriteria];
    updated[index] = { ...updated[index], [field]: value };
    setCustomCriteria(updated);
    updateCustomCriteria(updated, customName);
  };

  const addCriterion = () => {
    const updated = [...customCriteria, { name: '', weight: 3, description: '' }];
    setCustomCriteria(updated);
  };

  const removeCriterion = (index: number) => {
    const updated = customCriteria.filter((_, i) => i !== index);
    setCustomCriteria(updated);
    updateCustomCriteria(updated, customName);
  };

  const updateCustomCriteria = (criteria: JudgingCriterion[], name: string) => {
    const validCriteria = criteria.filter((c) => c.name.trim());
    if (validCriteria.length > 0) {
      onCriteriaChange({
        id: 'custom',
        name: name || 'Custom Criteria',
        description: 'User-defined evaluation criteria',
        criteria: validCriteria,
        isCustom: true,
      });
    }
  };

  const handleCustomNameChange = (name: string) => {
    setCustomName(name);
    updateCustomCriteria(customCriteria, name);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        disabled={disabled}
        className={clsx(
          'w-full flex items-center justify-between p-3 rounded-lg',
          'bg-gray-800/50 border border-gray-700',
          'hover:border-gray-600 transition-colors',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      >
        <div className="flex items-center gap-2">
          <Scale className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-gray-300">Judging Criteria</span>
          <span className="text-xs text-gray-500">({selectedCriteria.name})</span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-4 p-3 rounded-lg bg-gray-800/30 border border-gray-700">
          {/* Preset selector */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Evaluation Preset
            </label>
            <select
              value={isCustomMode ? 'custom' : selectedCriteria.id}
              onChange={(e) => handlePresetChange(e.target.value)}
              disabled={disabled}
              className={clsx(
                'w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700',
                'text-sm text-gray-200',
                'focus:outline-none focus:border-purple-500/50',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              {JUDGING_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
              <option value="custom">✏️ Custom Criteria</option>
            </select>
          </div>

          {/* Show preset description or custom editor */}
          {!isCustomMode ? (
            <div className="space-y-2">
              <p className="text-xs text-gray-500">{selectedCriteria.description}</p>
              <div className="space-y-1">
                {selectedCriteria.criteria.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 text-xs text-gray-400"
                  >
                    <div className="flex gap-0.5">
                      {Array.from({ length: 5 }).map((_, wi) => (
                        <div
                          key={wi}
                          className={clsx(
                            'w-1.5 h-1.5 rounded-full',
                            wi < c.weight ? 'bg-purple-400' : 'bg-gray-700'
                          )}
                        />
                      ))}
                    </div>
                    <span className="font-medium text-gray-300">{c.name}</span>
                    <span className="text-gray-500">— {c.description}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Custom name */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">
                  Criteria Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => handleCustomNameChange(e.target.value)}
                  placeholder="e.g., Technical Review"
                  disabled={disabled}
                  className={clsx(
                    'w-full px-3 py-2 rounded-lg bg-gray-800/50 border border-gray-700',
                    'text-sm text-gray-200 placeholder-gray-500',
                    'focus:outline-none focus:border-purple-500/50'
                  )}
                />
              </div>

              {/* Custom criteria list */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-400">
                  Evaluation Criteria
                </label>
                {customCriteria.map((criterion, index) => (
                  <div
                    key={index}
                    className="flex gap-2 p-2 rounded-lg bg-gray-900/50"
                  >
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={criterion.name}
                        onChange={(e) =>
                          handleCustomCriterionChange(index, 'name', e.target.value)
                        }
                        placeholder="Criterion name"
                        disabled={disabled}
                        className={clsx(
                          'w-full px-2 py-1 rounded bg-gray-800 border border-gray-700',
                          'text-sm text-gray-200 placeholder-gray-500',
                          'focus:outline-none focus:border-purple-500/50'
                        )}
                      />
                      <input
                        type="text"
                        value={criterion.description}
                        onChange={(e) =>
                          handleCustomCriterionChange(index, 'description', e.target.value)
                        }
                        placeholder="Description of what to evaluate"
                        disabled={disabled}
                        className={clsx(
                          'w-full px-2 py-1 rounded bg-gray-800 border border-gray-700',
                          'text-xs text-gray-300 placeholder-gray-500',
                          'focus:outline-none focus:border-purple-500/50'
                        )}
                      />
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <label className="text-xs text-gray-500">Weight</label>
                      <select
                        value={criterion.weight}
                        onChange={(e) =>
                          handleCustomCriterionChange(index, 'weight', parseInt(e.target.value))
                        }
                        disabled={disabled}
                        className="px-2 py-1 rounded bg-gray-800 border border-gray-700 text-xs text-gray-200"
                      >
                        {[1, 2, 3, 4, 5].map((w) => (
                          <option key={w} value={w}>
                            {w}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeCriterion(index)}
                        disabled={disabled || customCriteria.length <= 1}
                        className={clsx(
                          'p-1 rounded text-red-400 hover:bg-red-900/30',
                          (disabled || customCriteria.length <= 1) && 'opacity-30 cursor-not-allowed'
                        )}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={addCriterion}
                  disabled={disabled}
                  className={clsx(
                    'flex items-center gap-1 px-2 py-1 rounded text-xs',
                    'text-purple-400 hover:bg-purple-900/30',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Plus className="w-3 h-3" />
                  Add Criterion
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
