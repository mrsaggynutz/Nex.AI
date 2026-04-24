import React, { useState } from 'react';
import { Hash, Copy, Check, FileText } from 'lucide-react';
import { cn } from '../lib/utils';

const ALGORITHMS = ['md5', 'sha1', 'sha256', 'sha384', 'sha512'];

export const HashGenerator: React.FC = () => {
  const [input, setInput] = useState('');
  const [algorithm, setAlgorithm] = useState('sha256');
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [allHashes, setAllHashes] = useState<Record<string, string>>({});
  const [showAll, setShowAll] = useState(false);

  const generateHash = async () => {
    if (!input.trim()) return;
    try {
      const res = await fetch('/api/tools/hash', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input, algorithm }),
      });
      const data = await res.json();
      setResult(data.hash);
    } catch {
      setResult('Error generating hash');
    }
  };

  const generateAllHashes = async () => {
    if (!input.trim()) return;
    const hashes: Record<string, string> = {};
    for (const algo of ALGORITHMS) {
      try {
        const res = await fetch('/api/tools/hash', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input, algorithm: algo }),
        });
        const data = await res.json();
        hashes[algo] = data.hash;
      } catch { hashes[algo] = 'Error'; }
    }
    setAllHashes(hashes);
    setShowAll(true);
    setResult(hashes[algorithm]);
  };

  const copyHash = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch { /* ignore */ }
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Hash size={14} className="text-accent" />
          HASH GENERATOR
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Input */}
        <div className="bg-black border border-zinc-900 p-4">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Input Text</p>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Enter text to hash..."
            className="w-full bg-zinc-900/50 border border-zinc-800 text-white text-[11px] font-mono p-3 h-20 resize-none focus:outline-none focus:border-accent placeholder:text-zinc-800"
          />
          <div className="mt-3 flex gap-2">
            <button onClick={generateHash} disabled={!input.trim()}
              className="flex-1 py-2.5 bg-accent text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-colors disabled:opacity-30">
              Generate {algorithm.toUpperCase()}
            </button>
            <button onClick={generateAllHashes} disabled={!input.trim()}
              className="py-2.5 px-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[10px] transition-all disabled:opacity-30">
              ALL
            </button>
          </div>
        </div>

        {/* Algorithm selector */}
        <div className="bg-black border border-zinc-900 p-4">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Algorithm</p>
          <div className="flex flex-wrap gap-1">
            {ALGORITHMS.map(algo => (
              <button key={algo} onClick={() => { setAlgorithm(algo); if (input) { setResult(allHashes[algo] || null); } }}
                className={cn("px-2 py-1 border text-[9px] font-mono font-black uppercase transition-all",
                  algorithm === algo ? "bg-accent text-black border-accent" : "text-zinc-500 border-zinc-800 hover:border-zinc-700"
                )}>
                {algo}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-black border border-zinc-900 p-4">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">{algorithm.toUpperCase()} Hash</p>
            <div className="bg-zinc-900/50 border border-zinc-800 p-3 relative">
              <pre className="text-[10px] text-neon-green font-mono whitespace-pre-wrap break-all pr-10">{result}</pre>
              <button onClick={() => copyHash(result)} className="absolute top-2 right-2 p-1 hover:bg-zinc-800 text-zinc-500 hover:text-white">
                {copied ? <Check size={12} className="text-neon-green" /> : <Copy size={12} />}
              </button>
            </div>
          </div>
        )}

        {/* All hashes */}
        {showAll && (
          <div className="bg-black border border-zinc-900 p-4 space-y-2">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">All Hashes</p>
            {ALGORITHMS.map(algo => (
              <div key={algo} className="flex items-start gap-2">
                <span className="text-[8px] font-mono text-accent uppercase w-12 shrink-0 pt-0.5">{algo}</span>
                <pre className="text-[9px] text-zinc-400 font-mono whitespace-pre-wrap break-all">{allHashes[algo]}</pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
