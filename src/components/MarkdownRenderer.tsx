'use client';

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useState, useCallback } from 'react';
import clsx from 'clsx';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

// Map common language aliases to what Prism recognizes
const LANGUAGE_ALIASES: Record<string, string> = {
  'terraform': 'hcl',
  'tf': 'hcl',
  'shell': 'bash',
  'sh': 'bash',
  'zsh': 'bash',
  'console': 'bash',
  'js': 'javascript',
  'ts': 'typescript',
  'py': 'python',
  'rb': 'ruby',
  'yml': 'yaml',
  'dockerfile': 'docker',
  'md': 'markdown',
  'jsonc': 'json',
  'objective-c': 'objectivec',
  'objc': 'objectivec',
};

function normalizeLanguage(lang: string): string {
  const lower = lang.toLowerCase();
  return LANGUAGE_ALIASES[lower] || lower;
}

export function MarkdownRenderer({ content, isStreaming = false }: MarkdownRendererProps) {
  return (
    <div className={clsx('markdown-content', isStreaming && 'streaming-cursor')}>
      <ReactMarkdown
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const codeString = String(children).replace(/\n$/, '');
            
            // Inline code (no language specified and short)
            if (!match && !codeString.includes('\n')) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-gray-800 text-blue-300 text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            // Code block with syntax highlighting
            const language = match ? normalizeLanguage(match[1]) : 'text';
            return (
              <CodeBlock
                language={language}
                code={codeString}
              />
            );
          },
          // Customize other elements
          p({ children }) {
            return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
          },
          h1({ children }) {
            return <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-gray-100">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-lg font-semibold mb-2 mt-3 first:mt-0 text-gray-100">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold mb-2 mt-3 first:mt-0 text-gray-200">{children}</h3>;
          },
          ul({ children }) {
            return <ul className="list-disc list-inside mb-3 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside mb-3 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-gray-300">{children}</li>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-gray-600 pl-4 my-3 text-gray-400 italic">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {children}
              </a>
            );
          },
          strong({ children }) {
            return <strong className="font-semibold text-gray-100">{children}</strong>;
          },
          em({ children }) {
            return <em className="italic text-gray-300">{children}</em>;
          },
          hr() {
            return <hr className="border-gray-700 my-4" />;
          },
          pre({ children }) {
            // The code component handles the actual rendering
            return <>{children}</>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

interface CodeBlockProps {
  language: string;
  code: string;
}

function CodeBlock({ language, code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div className="relative group my-3 rounded-lg overflow-hidden">
      {/* Header with language and copy button */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <span className="text-xs text-gray-500 font-mono uppercase">{language}</span>
        <button
          onClick={handleCopy}
          className={clsx(
            'flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors',
            copied
              ? 'text-green-400 bg-green-900/30'
              : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800'
          )}
        >
          {copied ? (
            <>
              <Check className="w-3 h-3" />
              Copied
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              Copy
            </>
          )}
        </button>
      </div>
      
      {/* Code content */}
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{
          margin: 0,
          padding: '1rem',
          background: 'rgb(30, 30, 30)',
          fontSize: '0.875rem',
          lineHeight: '1.5',
        }}
        showLineNumbers={code.split('\n').length > 5}
        lineNumberStyle={{
          minWidth: '2.5em',
          paddingRight: '1em',
          color: 'rgb(100, 100, 100)',
          userSelect: 'none',
        }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
