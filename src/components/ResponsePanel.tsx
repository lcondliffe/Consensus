'use client';

import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { ModelResponse } from '@/lib/types';
import clsx from 'clsx';

interface ResponsePanelProps {
  response: ModelResponse;
  isWinner?: boolean;
  score?: number;
}

export function ResponsePanel({ response, isWinner, score }: ResponsePanelProps) {
  const { modelName, content, isStreaming, isComplete, error, latencyMs } = response;

  return (
    <div
      className={clsx(
        'flex flex-col h-full rounded-xl border overflow-hidden transition-all',
        isWinner ? 'winner-card border-green-500/50 ring-1 ring-green-500/30' : 'border-gray-700',
        error && 'border-red-500/50'
      )}
    >
      {/* Header */}
      <div
        className={clsx(
          'flex items-center justify-between px-4 py-3 border-b',
          isWinner ? 'bg-green-900/20 border-green-800/30' : 'bg-gray-800/50 border-gray-700'
        )}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-100">{modelName}</h3>
          {isWinner && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Winner
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
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
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-auto bg-gray-900/30">
        {error ? (
          <div className="flex items-start gap-2 text-red-400">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Error</p>
              <p className="text-sm text-red-400/80">{error}</p>
            </div>
          </div>
        ) : content ? (
          <div
            className={clsx(
              'prose prose-invert prose-sm max-w-none',
              'prose-p:text-gray-300 prose-headings:text-gray-200',
              'prose-code:text-blue-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:rounded',
              isStreaming && 'streaming-cursor'
            )}
          >
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-300">
              {content}
            </pre>
          </div>
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
