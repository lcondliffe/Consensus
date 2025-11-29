'use client';

import { Send } from 'lucide-react';
import clsx from 'clsx';

interface PromptInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  minModels: number;
  selectedModelCount: number;
}

export function PromptInput({
  value,
  onChange,
  onSubmit,
  disabled = false,
  isLoading = false,
  minModels,
  selectedModelCount,
}: PromptInputProps) {
  const canSubmit = value.trim().length > 0 && selectedModelCount >= minModels && !disabled;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Enter your prompt for the committee..."
        disabled={disabled}
        rows={4}
        className={clsx(
          'w-full px-4 py-3 pr-14 rounded-xl',
          'bg-gray-800/50 border border-gray-700',
          'text-gray-100 placeholder-gray-500',
          'resize-none',
          'focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30',
          disabled && 'cursor-not-allowed opacity-60'
        )}
      />
      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className={clsx(
          'absolute right-3 bottom-3',
          'p-2 rounded-lg transition-all',
          canSubmit
            ? 'bg-blue-600 hover:bg-blue-500 text-white'
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        )}
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <Send className="w-5 h-5" />
        )}
      </button>
      {selectedModelCount < minModels && (
        <p className="absolute -bottom-6 left-0 text-xs text-red-400">
          Select at least {minModels} committee models
        </p>
      )}
    </div>
  );
}
