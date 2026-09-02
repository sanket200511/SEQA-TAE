import React, { useState } from 'react';
import { Code2, Copy, Check } from 'lucide-react';

interface CodeHighlighterProps {
  snippet?: string;
  lineNumber?: number;
  filePath?: string;
}

export const CodeHighlighter: React.FC<CodeHighlighterProps> = ({ snippet, lineNumber, filePath }) => {
  const [copied, setCopied] = useState(false);

  if (!snippet) {
    return (
      <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
        <Code2 size={16} className="shrink-0" />
        <span>No raw code snippet captured for this finding.</span>
      </div>
    );
  }

  const lines = snippet.split('\n');
  const startLine = lineNumber ? Math.max(1, lineNumber - Math.floor(lines.length / 2)) : 1;

  const handleCopy = () => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs max-w-full">
      {filePath && (
        <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 gap-2">
          <span className="font-mono text-slate-300 break-all truncate max-w-[80%]">{filePath}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 transition-colors shrink-0 p-1 min-h-[32px]"
            title="Copy code snippet"
            aria-label="Copy code snippet"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}

      <div className="overflow-x-auto py-2.5 max-w-full">
        <table className="w-full border-collapse">
          <tbody>
            {lines.map((lineText, idx) => {
              const currentLineNum = startLine + idx;
              const isTargetLine = lineNumber === currentLineNum || lines.length === 1;

              return (
                <tr
                  key={idx}
                  className={isTargetLine ? 'bg-rose-950/40 border-l-4 border-rose-500' : 'hover:bg-slate-900/40'}
                >
                  <td className="w-10 select-none text-right pr-3 text-slate-600 text-[11px] py-0.5 shrink-0">
                    {currentLineNum}
                  </td>
                  <td className={`pl-2 pr-4 py-0.5 whitespace-pre font-mono text-xs ${isTargetLine ? 'text-rose-200 font-semibold' : 'text-slate-300'}`}>
                    {lineText}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
