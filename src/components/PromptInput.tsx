'use client';

import { Send, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { useRef, useEffect } from 'react';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && canSubmit) {
      e.preventDefault();
      onSubmit();
    }
  };

  // Auto-resize
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  return (
    <div className="relative group">
      <div className={clsx(
        "absolute inset-0 bg-accent/20 rounded-2xl blur-xl transition-opacity duration-500",
        isLoading || value.length > 0 ? "opacity-100" : "opacity-0"
      )} />
      
      <div className="relative bg-surface-2 border border-white/10 rounded-2xl shadow-xl overflow-hidden ring-1 ring-white/5 focus-within:ring-accent/50 focus-within:border-accent/50 transition-all duration-300">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask the committee..."
          disabled={disabled}
          rows={1}
          className={clsx(
            'w-full px-5 py-4 pr-14 max-h-[200px]',
            'bg-transparent',
            'text-base text-gray-100 placeholder-gray-500',
            'resize-none',
            'focus:outline-none',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        />
        
        <div className="absolute right-2 bottom-2 flex items-center gap-2">
          {selectedModelCount < minModels && (
             <span className="text-xs text-red-400 bg-red-900/20 px-2 py-1 rounded-md border border-red-500/20 mr-2">
               Select {minModels}+ models
             </span>
          )}
          
          <button
            onClick={onSubmit}
            disabled={!canSubmit}
            className={clsx(
              'p-2.5 rounded-xl transition-all duration-200 flex items-center justify-center',
              canSubmit
                ? 'bg-accent hover:bg-accent-glow text-white shadow-lg shadow-accent/20 hover:scale-105 active:scale-95'
                : 'bg-surface-3 text-gray-500 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      <div className="absolute -top-6 left-0 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 delay-100">
         <span className="text-[10px] text-gray-500 flex items-center gap-1">
           <Sparkles className="w-3 h-3 text-accent" />
           <span>Press <kbd className="font-sans px-1 py-0.5 rounded bg-surface-2 border border-white/10 text-gray-400">Enter</kbd> to submit</span>
         </span>
      </div>
    </div>
  );
}
