'use client';

import { Users, Gavel, UserCheck, Sparkles } from 'lucide-react';
import { ProviderLogo, getProviderColor } from './ProviderLogo';
import { ModelOption } from './ModelPicker';
import { JudgingMode } from '@/lib/types';
import clsx from 'clsx';

interface CommitteeDisplayProps {
  models: ModelOption[];
  selectedCommittee: string[];
  judgingMode: JudgingMode;
  judgeModelId: string;
  executiveJudgeIds: string[];
}

interface ModelTileProps {
  model: ModelOption;
  role: 'committee' | 'judge' | 'executive' | 'synthesizer';
  index: number;
}

/**
 * Renders a styled tile representing a model for a given role in the committee UI.
 *
 * The tile includes a role badge with an icon, a provider logo with a colored glow,
 * the model's display name, and the provider name.
 *
 * @param role - One of 'committee', 'judge', 'executive', or 'synthesizer' determining the badge label, icon, and color scheme.
 * @param index - Zero-based position used to stagger the tile's entrance animation (higher values delay the animation).
 * @returns A JSX element containing the styled model tile with badge, logo, name, and provider label.
 */
function ModelTile({ model, role, index }: ModelTileProps) {
  const color = getProviderColor(model.provider);
  
  const roleConfig = {
    committee: {
      label: 'Committee',
      icon: Users,
      borderColor: 'border-blue-500/30',
      bgColor: 'bg-blue-500/5',
      labelColor: 'text-blue-400',
      glowColor: 'shadow-blue-500/10',
    },
    judge: {
      label: 'Judge',
      icon: Gavel,
      borderColor: 'border-yellow-500/30',
      bgColor: 'bg-yellow-500/5',
      labelColor: 'text-yellow-400',
      glowColor: 'shadow-yellow-500/10',
    },
    executive: {
      label: 'Executive',
      icon: UserCheck,
      borderColor: 'border-purple-500/30',
      bgColor: 'bg-purple-500/5',
      labelColor: 'text-purple-400',
      glowColor: 'shadow-purple-500/10',
    },
    synthesizer: {
      label: 'Synthesizer',
      icon: Sparkles,
      borderColor: 'border-amber-500/30',
      bgColor: 'bg-amber-500/5',
      labelColor: 'text-amber-400',
      glowColor: 'shadow-amber-500/10',
    },
  };

  const config = roleConfig[role];
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'relative group flex flex-col items-center p-4 rounded-2xl border transition-all duration-300',
        'bg-surface-2/40 backdrop-blur-sm hover:bg-surface-2/60',
        config.borderColor,
        'hover:shadow-lg',
        config.glowColor,
        'animate-in fade-in slide-in-from-bottom-2'
      )}
      style={{
        animationDelay: `${index * 50}ms`,
        animationFillMode: 'backwards',
      }}
    >
      {/* Role Badge */}
      <div
        className={clsx(
          'absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider',
          config.bgColor,
          config.labelColor,
          'border',
          config.borderColor
        )}
      >
        <span className="flex items-center gap-1">
          <Icon className="w-2.5 h-2.5" />
          {config.label}
        </span>
      </div>

      {/* Logo */}
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center mt-2 mb-3 transition-transform duration-300 group-hover:scale-110"
        style={{
          background: `linear-gradient(135deg, ${color.glow} 0%, transparent 100%)`,
          boxShadow: `0 4px 20px -4px ${color.glow}`,
        }}
      >
        <ProviderLogo provider={model.provider} size={28} />
      </div>

      {/* Model Name */}
      <h4 className="font-medium text-sm text-white text-center leading-tight mb-1 line-clamp-2">
        {model.name}
      </h4>

      {/* Provider */}
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">
        {model.provider}
      </p>
    </div>
  );
}

/**
 * Render a visual display of committee members and any configured judges or synthesizers.
 *
 * Renders a grid of committee ModelTiles and, depending on `judgingMode`, one or more judge groups
 * (judge, executive panel, or synthesizer) with connectors and contextual info banners.
 *
 * @param models - Available model options to resolve selected IDs into ModelOption objects
 * @param selectedCommittee - Ordered list of model IDs included in the committee
 * @param judgingMode - Current judging mode which determines judge group behavior ('committee' | 'judge' | 'executive' | 'consensus')
 * @param judgeModelId - Model ID used for single-judge or synthesizer modes
 * @param executiveJudgeIds - Model IDs used when the executive panel mode is active
 * @returns The rendered committee and judges UI element, or `null` if no committee members are selected.
 */
export function CommitteeDisplay({
  models,
  selectedCommittee,
  judgingMode,
  judgeModelId,
  executiveJudgeIds,
}: CommitteeDisplayProps) {
  // Get committee models
  const committeeModels = selectedCommittee
    .map((id) => models.find((m) => m.id === id))
    .filter((m): m is ModelOption => m !== undefined);

  // Get judge models based on mode
  const getJudgeModels = (): { models: ModelOption[]; role: 'judge' | 'executive' | 'synthesizer' }[] => {
    if (judgingMode === 'judge') {
      const judge = models.find((m) => m.id === judgeModelId);
      return judge ? [{ models: [judge], role: 'judge' }] : [];
    }
    if (judgingMode === 'executive') {
      const executives = executiveJudgeIds
        .map((id) => models.find((m) => m.id === id))
        .filter((m): m is ModelOption => m !== undefined);
      return executives.length > 0 ? [{ models: executives, role: 'executive' }] : [];
    }
    if (judgingMode === 'consensus') {
      const synthesizer = models.find((m) => m.id === judgeModelId);
      return synthesizer ? [{ models: [synthesizer], role: 'synthesizer' }] : [];
    }
    // Committee mode - the committee members vote
    return [];
  };

  const judgeGroups = getJudgeModels();
  const hasJudges = judgeGroups.length > 0 && judgeGroups[0].models.length > 0;

  if (committeeModels.length === 0) {
    return null;
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-4">
      {/* Committee Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-center gap-2 text-sm">
          <Users className="w-4 h-4 text-blue-400" />
          <span className="text-gray-400 font-medium">Committee Members</span>
          <span className="text-gray-600">({committeeModels.length})</span>
        </div>
        
        <div
          className={clsx(
            'grid gap-4 justify-center',
            committeeModels.length === 1 && 'grid-cols-1 max-w-[180px] mx-auto',
            committeeModels.length === 2 && 'grid-cols-2 max-w-[380px] mx-auto',
            committeeModels.length === 3 && 'grid-cols-3 max-w-[560px] mx-auto',
            committeeModels.length >= 4 && 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          )}
        >
          {committeeModels.map((model, index) => (
            <ModelTile key={model.id} model={model} role="committee" index={index} />
          ))}
        </div>
      </div>

      {/* Connector */}
      {hasJudges && (
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-px h-3 bg-gradient-to-b from-blue-500/30 to-yellow-500/30" />
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-500/50 animate-pulse" />
          <div className="w-px h-3 bg-gradient-to-b from-yellow-500/30 to-transparent" />
        </div>
      )}

      {/* Judges Section */}
      {hasJudges && judgeGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            {group.role === 'judge' && (
              <Gavel className="w-4 h-4 text-yellow-400" />
            )}
            {group.role === 'executive' && (
              <UserCheck className="w-4 h-4 text-purple-400" />
            )}
            {group.role === 'synthesizer' && (
              <Sparkles className="w-4 h-4 text-amber-400" />
            )}
            <span className="text-gray-400 font-medium">
              {group.role === 'judge' ? 'Judge' : group.role === 'synthesizer' ? 'Synthesizer' : 'Executive Panel'}
            </span>
            {group.models.length > 1 && (
              <span className="text-gray-600">({group.models.length})</span>
            )}
          </div>
          
          <div
            className={clsx(
              'grid gap-4 justify-center',
              group.models.length === 1 && 'grid-cols-1 max-w-[180px] mx-auto',
              group.models.length === 2 && 'grid-cols-2 max-w-[380px] mx-auto',
              group.models.length === 3 && 'grid-cols-3 max-w-[560px] mx-auto',
              group.models.length >= 4 && 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
            )}
          >
            {group.models.map((model, index) => (
              <ModelTile
                key={model.id}
                model={model}
                role={group.role}
                index={committeeModels.length + index}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Committee mode info */}
      {judgingMode === 'committee' && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Users className="w-3.5 h-3.5" />
          <span>Committee members will vote on each other&apos;s responses</span>
        </div>
      )}

      {/* Consensus mode info */}
      {judgingMode === 'consensus' && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Responses will be synthesized into a unified answer with attribution</span>
        </div>
      )}
    </div>
  );
}