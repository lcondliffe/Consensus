'use client';

import { AlertCircle, CheckCircle2, Loader2, Maximize2, Minimize2, Copy } from 'lucide-react';
import { ModelResponse } from '@/lib/types';
import { getModelById } from '@/lib/models';
import { MarkdownRenderer } from './MarkdownRenderer';
import { ProviderLogo } from './ProviderLogo';
import clsx from 'clsx';
import { useState } from 'react';

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
  const { modelName, content, isStreaming, isComplete, error, latencyMs, modelId } = response;
  const [copied, setCopied] = useState(false);
  const provider = getModelById(modelId)?.provider || 'Unknown';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={clsx(
        'group flex flex-col rounded-2xl overflow-hidden transition-all duration-300',
        'bg-surface-2/40 backdrop-blur-sm border border-white/5',
        // Maximized mode takes full height
        isMaximized && 'h-full shadow-2xl ring-1 ring-white/10',
        // In grid mode, use fixed height; in stacked mode, use min-height
        !isMaximized && viewMode === 'grid' && 'h-[400px] hover:shadow-lg hover:bg-surface-2/60 hover:border-white/10',
        !isMaximized && viewMode === 'stacked' && 'min-h-[200px] max-h-[600px] hover:shadow-lg hover:bg-surface-2/60',
        isWinner && 'winner-card ring-1 ring-green-500/50 shadow-green-900/20 shadow-lg',
        error && 'ring-1 ring-red-500/50 bg-red-900/5'
      )}
    >
      {/* Header */}
      <div
        className={clsx(
          'flex items-center justify-between px-4 py-3 border-b flex-shrink-0 transition-colors',
          isWinner ? 'bg-green-500/5 border-green-500/20' : 'bg-white/2 border-white/5'
        )}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="relative">
             <div className="w-8 h-8 rounded-lg bg-surface-1 flex items-center justify-center border border-white/10">
               <ProviderLogo provider={provider} size={20} />
             </div>
             {isStreaming && (
               <div className="absolute -bottom-1 -right-1 w-3 h-3 rounded-full bg-surface-2 flex items-center justify-center">
                 <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
               </div>
             )}
          </div>

          <div className="min-w-0">
            <h3 className={clsx(
              "font-medium truncate text-sm flex items-center gap-2",
              isWinner ? "text-green-400" : "text-gray-200"
            )}>
              {modelName}
              {isWinner && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase tracking-wider flex-shrink-0 border border-green-500/20">
                  <CheckCircle2 className="w-3 h-3" />
                  Winner
                </span>
              )}
            </h3>
            <p className="text-[10px] text-gray-500 truncate">{provider}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 flex-shrink-0">
          {score !== undefined && (
            <div className="flex items-center gap-1">
              <span className={clsx(
                "font-mono font-medium",
                score >= 80 ? "text-green-400" : score >= 60 ? "text-yellow-400" : "text-gray-400"
              )}>
                {score}
              </span>
              <span className="text-gray-600">/100</span>
            </div>
          )}
          
          {isStreaming && (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-accent" />
          )}
          
          {isComplete && latencyMs && (
            <span className="font-mono text-[10px] text-gray-600">
              {(latencyMs / 1000).toFixed(1)}s
            </span>
          )}

          {/* Actions */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={copyToClipboard}
              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
              title="Copy response"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            
            {isMaximized ? (
              onMinimize && (
                <button
                  onClick={onMinimize}
                  className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Minimize"
                >
                  <Minimize2 className="w-3.5 h-3.5" />
                </button>
              )
            ) : (
              onMaximize && (
                <button
                  onClick={onMaximize}
                  className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
                  title="Maximize"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={clsx(
        "flex-1 p-4 overflow-y-auto text-sm leading-relaxed custom-scrollbar",
        isWinner ? "bg-gradient-to-b from-green-500/5 to-transparent" : "bg-transparent"
      )}>
        {error ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center mb-3 text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <p className="font-medium text-red-400">Generation Failed</p>
            <p className="text-xs text-red-400/60 mt-1 max-w-[200px] break-words">{error}</p>
          </div>
        ) : content ? (
          <div className="prose prose-invert prose-sm max-w-none">
            <MarkdownRenderer content={content} isStreaming={isStreaming} />
          </div>
        ) : isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-ping" />
            <span className="text-xs font-medium animate-pulse">Thinking...</span>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-600 text-xs italic">
            Waiting for response...
          </div>
        )}
      </div>
    </div>
  );
}
