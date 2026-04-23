import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, MemoryStick, Activity, RefreshCw } from 'lucide-react';
import { cn } from '../lib/utils';

interface SystemInfo {
  uptime: string;
  whoami: string;
  uname: string;
  memInfo: string;
  dfInfo: string;
  cpuInfo: string;
  pidInfo: string;
  hostname: string;
  error?: string;
}

export const SystemMonitor: React.FC = () => {
  const [info, setInfo] = useState<SystemInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchInfo = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/monitor');
      const data = await res.json();
      setInfo(data);
    } catch {
      setInfo({ uptime: '?', whoami: '?', uname: '?', memInfo: '?', dfInfo: '?', cpuInfo: '?', pidInfo: '?', hostname: '?', error: 'Failed to fetch' });
    }
    setLoading(false);
  };

  useEffect(() => { fetchInfo(); }, []);

  const parseMemory = (memInfo: string) => {
    const lines = memInfo.split('\n');
    const mem = lines.find(l => l.startsWith('Mem:') || l.includes('Mem:'));
    const swap = lines.find(l => l.startsWith('Swap:') || l.includes('Swap:'));
    return { mem: mem || memInfo, swap: swap || '' };
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0 flex items-center justify-between">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-accent" />
          SYSTEM MONITOR
        </h2>
        <button onClick={fetchInfo} disabled={loading} className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {loading && !info && (
          <div className="flex items-center justify-center h-32 text-zinc-600 text-[10px] font-black uppercase animate-pulse">Loading system info...</div>
        )}

        {info && (
          <>
            {/* Host Info */}
            <div className="bg-black border border-zinc-900 p-4">
              <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-3">Host Information</p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase">Hostname</span>
                  <span className="text-[9px] text-white font-mono">{info.hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase">User</span>
                  <span className="text-[9px] text-white font-mono">{info.whoami}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase">Uptime</span>
                  <span className="text-[9px] text-white font-mono">{info.uptime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase">CPU Cores</span>
                  <span className="text-[9px] text-neon-green font-mono">{info.cpuInfo}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] text-zinc-500 uppercase">Processes</span>
                  <span className="text-[9px] text-white font-mono">{info.pidInfo}</span>
                </div>
              </div>
            </div>

            {/* Kernel */}
            <div className="bg-black border border-zinc-900 p-4">
              <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-3">Kernel</p>
              <pre className="text-[9px] text-zinc-400 font-mono whitespace-pre-wrap break-all">{info.uname}</pre>
            </div>

            {/* Memory */}
            <div className="bg-black border border-zinc-900 p-4">
              <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                <MemoryStick size={12} /> Memory
              </p>
              <pre className="text-[9px] text-zinc-400 font-mono whitespace-pre-wrap">{info.memInfo}</pre>
            </div>

            {/* Disk */}
            <div className="bg-black border border-zinc-900 p-4">
              <p className="text-[9px] font-black text-accent uppercase tracking-widest mb-3 flex items-center gap-2">
                <HardDrive size={12} /> Disk Usage
              </p>
              <pre className="text-[9px] text-zinc-400 font-mono whitespace-pre-wrap">{info.dfInfo}</pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
