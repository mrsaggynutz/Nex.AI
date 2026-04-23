import React, { useState } from 'react';
import { Globe, Search, Copy, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface DNSRecords {
  A: string[];
  MX: string[];
  NS: string[];
  TXT: string[];
}

export const DNSLookup: React.FC = () => {
  const [domain, setDomain] = useState('');
  const [records, setRecords] = useState<DNSRecords | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<string[]>([]);

  const lookup = async (target?: string) => {
    const d = (target || domain).trim();
    if (!d) return;
    setLoading(true);
    setError('');
    setRecords(null);
    setDomain(d);

    try {
      const res = await fetch(`/api/tools/dns?domain=${encodeURIComponent(d)}`);
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { setRecords(data.records); setHistory(prev => [d, ...prev.filter(h => h !== d).slice(0, 9)]); }
    } catch { setError('Failed to connect to backend'); }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Globe size={14} className="text-accent" />
          DNS LOOKUP
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Search */}
        <div className="bg-black border border-zinc-900 p-4">
          <div className="flex gap-2">
            <input
              value={domain}
              onChange={e => setDomain(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && lookup()}
              placeholder="example.com"
              className="flex-1 bg-zinc-900/50 border border-zinc-800 text-white text-[11px] font-mono px-3 py-2 focus:outline-none focus:border-accent placeholder:text-zinc-800"
            />
            <button onClick={() => lookup()} disabled={loading || !domain.trim()}
              className="px-4 py-2 bg-accent text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-colors disabled:opacity-30">
              {loading ? '...' : 'GO'}
            </button>
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {history.map(h => (
              <button key={h} onClick={() => lookup(h)}
                className="text-[8px] font-mono px-2 py-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-accent transition-all">
                {h}
              </button>
            ))}
          </div>
        )}

        {error && (
          <div className="bg-red-500/5 border border-red-500/20 p-4">
            <p className="text-[9px] text-red-400 font-mono">{error}</p>
          </div>
        )}

        {/* Results */}
        {records && (
          <div className="space-y-3">
            {(['A', 'MX', 'NS', 'TXT'] as const).map(type => (
              <div key={type} className="bg-black border border-zinc-900 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-black text-accent uppercase tracking-widest">{type} Records</span>
                  <span className="text-[8px] text-zinc-600 font-mono">({records[type].length})</span>
                </div>
                {records[type].length > 0 ? (
                  <div className="space-y-1">
                    {records[type].map((r, i) => (
                      <pre key={i} className="text-[9px] text-zinc-400 font-mono whitespace-pre-wrap">{r}</pre>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-zinc-700 font-mono">No records found</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
