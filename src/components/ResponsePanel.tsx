'use client';

import { AlertCircle, CheckCircle2, Loader2, Maximize2, Minimize2 } from 'lucide-react';
import { ModelResponse } from '@/lib/types';
import { MarkdownRenderer } from './MarkdownRenderer';
import clsx from 'clsx';

export type ViewMode = 'grid' | 'stacked';

interface ResponsePanelProps {
  response: ModelResponse;
  isWinner?: boolean;
  score?: number;
  viewMode?: ViewMode;
  isMaximized?: boolean;
  onMaximize?: () => void;
  onMinimize?: () => void;
}

export function ResponsePanel({ 
  response, 
  isWinner, 
  score,
  viewMode = 'grid',
  isMaximized = false,
  onMaximize,
  onMinimize,
}: ResponsePanelProps) {
  const { modelName, content, isStreaming, isComplete, error, latencyMs } = response;

  return (
    <div
      className={clsx(
        'flex flex-col rounded-xl border overflow-hidden transition-all',
        // Maximized mode takes full height
        isMaximized && 'h-full',
        // In grid mode, use fixed height; in stacked mode, use min-height
        !isMaximized && viewMode === 'grid' && 'h-[400px]',
        !isMaximized && viewMode === 'stacked' && 'min-h-[200px] max-h-[600px]',
        isWinner ? 'winner-card border-green-500/50 ring-1 ring-green-500/30' : 'border-gray-700',
        error && 'border-red-500/50'
      )}
    >
      {/* Header */}
      <div
        className={clsx(
          'flex items-center justify-between px-4 py-3 border-b flex-shrink-0',
          isWinner ? 'bg-green-900/20 border-green-800/30' : 'bg-gray-800/50 border-gray-700'
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h3 className="font-medium text-gray-100 truncate">{modelName}</h3>
          {isWinner && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium flex-shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              Winner
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
          {score !== undefined && (
            <span className="px-2 py-0.5 rounded bg-gray-700 text-gray-300">
              {score}/100
            </span>
          )}
          {isStreaming && (
            <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
          )}
          {isComplete && latencyMs && (
            <span>{(latencyMs / 1000).toFixed(1)}s</span>
          )}
          {/* Maximize/Minimize button */}
          {isMaximized ? (
            onMinimize && (
              <button
                onClick={onMinimize}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            )
          ) : (
            onMaximize && (
              <button
                onClick={onMaximize}
                className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-gray-200 transition-colors"
                title="Maximize"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-900/30 text-sm text-gray-300">
        {error ? (
          <div className="flex items-start gap-2 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        ) : content ? (
          <MarkdownRenderer content={content} isStreaming={isStreaming} />
        ) : isStreaming ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Waiting for response...</span>
          </div>
        ) : (
          <span className="text-gray-500">No response yet</span>
        )}
      </div>
    </div>
  );
}
