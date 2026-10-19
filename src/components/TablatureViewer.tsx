import React, { useState } from 'react';
import { Copy, Check, ZoomIn, ZoomOut, Sparkles } from 'lucide-react';

interface TablatureViewerProps {
  tabContent: string;
  title?: string;
  onPlayNote?: (freq: number) => void;
}

export const TablatureViewer: React.FC<TablatureViewerProps> = ({
  tabContent,
  title,
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const [fontSize, setFontSize] = useState<'sm' | 'base' | 'lg'>('base');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(tabContent);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  // Render a single tablature line with smart syntax highlighting
  const renderTabLine = (line: string, lineIdx: number) => {
    // Check if line is a 6-string staff line: e|, B|, G|, D|, A|, E|
    const match = line.match(/^([eBGDAE]\s*\|)(.*)$/);
    if (!match) {
      // Ordinary text or section header inside tab block
      if (line.startsWith('[') || line.startsWith('//') || line.toLowerCase().includes('verse') || line.toLowerCase().includes('intro')) {
        return (
          <div key={lineIdx} className="text-xs font-bold text-emerald-400 font-mono tracking-wider pt-3 pb-1 uppercase border-b border-white/[0.06]">
            {line}
          </div>
        );
      }
      return (
        <div key={lineIdx} className="text-slate-400 font-mono text-xs whitespace-pre py-0.5">
          {line}
        </div>
      );
    }

    const header = match[1]; // e| or B|
    const body = match[2];

    const tokens: React.ReactNode[] = [];
    const regex = /(\d+|[-~hps\/\\b|]|\s+|[^\d\-~hps\/\\b|\s]+)/g;
    let m;
    let key = 0;
    while ((m = regex.exec(body)) !== null) {
      const val = m[1];
      if (/^\d+$/.test(val)) {
        tokens.push(
          <span 
            key={key++} 
            className="font-extrabold text-emerald-300 bg-emerald-500/25 px-0.5 rounded shadow-[0_0_8px_rgba(16,185,129,0.4)]"
          >
            {val}
          </span>
        );
      } else if (val === '|') {
        tokens.push(
          <span key={key++} className="text-cyan-500 font-bold">
            |
          </span>
        );
      } else if (/[hps\/\\b~]/.test(val)) {
        tokens.push(
          <span key={key++} className="text-amber-400 font-bold">
            {val}
          </span>
        );
      } else if (val.includes('-')) {
        tokens.push(
          <span key={key++} className="text-slate-600 select-none">
            {val}
          </span>
        );
      } else {
        tokens.push(<span key={key++}>{val}</span>);
      }
    }

    return (
      <div 
        key={lineIdx} 
        className={`font-mono whitespace-pre leading-none py-0.5 ${
          fontSize === 'sm' ? 'text-[11px]' : fontSize === 'lg' ? 'text-sm sm:text-base' : 'text-xs sm:text-sm'
        }`}
      >
        <span className="text-cyan-400 font-extrabold tracking-wider select-none pr-0.5">
          {header}
        </span>
        {tokens}
      </div>
    );
  };

  const lines = tabContent.split('\n');

  return (
    <div className="w-full rounded-2xl bg-[#07090E] border border-white/10 shadow-2xl overflow-hidden flex flex-col my-4">
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06] text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="font-mono font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            {title || '6-STRING STUDIO TABLATURE'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-white/[0.04] rounded-lg p-0.5 border border-white/[0.06]">
            <button
              onClick={() => setFontSize((prev) => prev === 'lg' ? 'base' : 'sm')}
              className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
              title="Smaller font"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono text-slate-400 px-1 uppercase">
              {fontSize}
            </span>
            <button
              onClick={() => setFontSize((prev) => prev === 'sm' ? 'base' : 'lg')}
              className="p-1 rounded text-slate-400 hover:text-white transition cursor-pointer"
              title="Larger font"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Copy Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 font-mono text-[11px] transition cursor-pointer"
            title="Copy tablature text"
          >
            {isCopied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tab Staff Display Area with smooth horizontal scroll */}
      <div className="p-4 sm:p-5 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        <div className="inline-block min-w-full font-mono">
          {lines.map((line, idx) => renderTabLine(line, idx))}
        </div>
      </div>
    </div>
  );
};
