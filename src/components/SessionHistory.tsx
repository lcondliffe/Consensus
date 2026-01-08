'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import { History, Trash2, Trophy, Clock, MessageSquare } from 'lucide-react';
import clsx from 'clsx';

interface SessionHistoryProps {
  userId: string | null;
  currentSessionId: Id<'sessions'> | null;
  onLoadSession: (sessionId: Id<'sessions'>) => void;
  isOpen: boolean;
  onClose: () => void;
}

export function SessionHistory({
  userId,
  currentSessionId,
  onLoadSession,
  isOpen,
  onClose,
}: SessionHistoryProps) {
  const sessions = useQuery(
    api.sessions.listByUser,
    userId ? { userId, limit: 30 } : 'skip'
  );
  const removeSession = useMutation(api.sessions.remove);

  const handleDelete = async (e: React.MouseEvent, sessionId: Id<'sessions'>) => {
    e.stopPropagation();
    if (confirm('Delete this session?')) {
      try {
        await removeSession({ sessionId });
      } catch (error) {
        alert(
          `Failed to delete session: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`
        );
      }
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    if (diffHours < 1) {
      const mins = Math.floor(diffMs / (1000 * 60));
      return `${mins}m ago`;
    } else if (diffHours < 24) {
      return `${Math.floor(diffHours)}h ago`;
    } else if (diffDays < 7) {
      return `${Math.floor(diffDays)}d ago`;
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const truncatePrompt = (prompt: string, maxLength: number = 60) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.slice(0, maxLength).trim() + '...';
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-30 lg:hidden"
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={clsx(
          'fixed top-14 left-0 bottom-0 w-80 bg-surface-1 border-r border-border z-40',
          'transform transition-transform duration-300 ease-out',
          'flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-accent" />
            <h2 className="text-sm font-semibold text-white">Session History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-foreground-muted hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!sessions ? (
            <div className="p-4 text-center text-foreground-muted text-sm">
              Loading...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-8 h-8 text-foreground-muted/50 mx-auto mb-3" />
              <p className="text-foreground-muted text-sm">No sessions yet</p>
              <p className="text-foreground-muted/70 text-xs mt-1">
                Your committee conversations will appear here
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {sessions.map((session) => (
                <button
                  key={session._id}
                  onClick={() => onLoadSession(session._id)}
                  className={clsx(
                    'w-full p-3 rounded-lg text-left transition-all duration-150',
                    'hover:bg-surface-2/80 group',
                    currentSessionId === session._id
                      ? 'bg-accent/10 border border-accent/30'
                      : 'border border-transparent'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-white font-medium line-clamp-2 flex-1">
                      {truncatePrompt(session.prompt)}
                    </p>
                    <button
                      onClick={(e) => handleDelete(e, session._id)}
                      className="p-1 opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-foreground-muted">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(session.createdAt)}
                    </span>
                    {session.isComplete && session.verdict?.winnerModelName && (
                      <span className="flex items-center gap-1 text-amber-400/80">
                        <Trophy className="w-3 h-3" />
                        {session.verdict.winnerModelName.split(' ')[0]}
                      </span>
                    )}
                    {!session.isComplete && (
                      <span className="text-foreground-muted/60 italic">
                        In progress
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 mt-2">
                    {session.committeeModelIds.slice(0, 4).map((_, i) => (
                      <div
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-foreground-muted/40"
                      />
                    ))}
                    {session.committeeModelIds.length > 4 && (
                      <span className="text-[10px] text-foreground-muted/60">
                        +{session.committeeModelIds.length - 4}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
