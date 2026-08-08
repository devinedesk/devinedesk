import React from 'react';
import { Terminal as TermIcon, Copy, Check } from 'lucide-react';
import clsx from 'clsx';

export function Terminal({ logs = [], title = 'Terminal', className }) {
  const [copied, setCopied] = React.useState(false);

  const copyToClipboard = () => {
    const text = logs.map((l) => (typeof l === 'string' ? l : l.message)).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={clsx(
        'rounded-xl overflow-hidden border border-neutral-border-glass bg-[#0d1117] font-mono text-sm',
        className
      )}
    >
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-neutral-border-glass">
        <div className="flex items-center gap-2 text-neutral-400">
          <TermIcon size={14} />
          <span className="text-xs">{title}</span>
        </div>
        <button
          onClick={copyToClipboard}
          className="text-neutral-400 hover:text-white transition-colors"
        >
          {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
        </button>
      </div>
      <div className="p-4 h-64 overflow-y-auto space-y-1">
        {logs.length === 0 ? (
          <p className="text-neutral-500 italic">No output</p>
        ) : (
          logs.map((log, i) => (
            <div key={i} className="flex gap-4">
              <span className="text-neutral-600 select-none">{String(i + 1).padStart(2, '0')}</span>
              <span
                className={clsx(
                  log.type === 'error'
                    ? 'text-red-400'
                    : log.type === 'warn'
                      ? 'text-yellow-400'
                      : 'text-green-400'
                )}
              >
                {typeof log === 'string' ? log : log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
