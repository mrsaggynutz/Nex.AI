import React, { useState, useEffect } from 'react';
import { ShieldCheck, Download, Check, X, Loader2, Terminal } from 'lucide-react';
import { cn } from '../lib/utils';

interface ToolStatus {
  tools: Record<string, boolean>;
  installed: number;
  total: number;
  system: { arch: string; kernel: string; os: string; hostname: string };
  isArm: boolean;
}

const TERMUX_PACKAGES: Record<string, string> = {
  'nmap': 'pkg install -y nmap',
  'masscan': 'pkg install -y masscan',
  'nikto': 'pkg install -y nikto',
  'sqlmap': 'pip install sqlmap',
  'john': 'pkg install -y john',
  'hashcat': 'pkg install -y hashcat',
  'hydra': 'pkg install -y hydra',
  'gobuster': 'pkg install -y gobuster',
  'ffuf': 'pkg install -y ffuf',
  'feroxbuster': 'pkg install -y feroxbuster',
  'python3': 'pkg install -y python',
  'node': 'pkg install -y nodejs',
  'git': 'pkg install -y git',
  'curl': 'pkg install -y curl',
  'wget': 'pkg install -y wget',
  'nc': 'pkg install -y nmap-ncat',
  'netcat': 'pkg install -y nmap-ncat',
  'socat': 'pkg install -y socat',
  'ssh': 'pkg install -y openssh',
  'openssl': 'pkg install -y openssl-tool',
  'whois': 'pkg install -y whois',
  'dig': 'pkg install -y dnsutils',
  'binwalk': 'pip install binwalk',
  'gdb': 'pkg install -y gdb',
  'radare2': 'pkg install -y radare2',
  'macchanger': 'pkg install -y macchanger',
  'bettercap': 'pkg install -y bettercap',
  'nuclei': 'pkg install -y nuclei',
  'httpx': 'pkg install -y httpx-toolkit',
  'rustscan': 'cargo install rustscan',
  'sherlock': 'pip install sherlock-project',
  'tmux': 'pkg install -y tmux',
  'dirb': 'pkg install -y dirb',
  'wpscan': 'gem install wpscan',
  'subfinder': 'pkg install -y subfinder',
  'strings': 'pkg install -y binutils',
};

export const ToolStatusDashboard: React.FC<{ onRunInTerminal: (cmd: string) => void }> = ({ onRunInTerminal }) => {
  const [status, setStatus] = useState<ToolStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installResult, setInstallResult] = useState<string | null>(null);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tools/status');
      const data = await res.json();
      setStatus(data);
    } catch { }
    setLoading(false);
  };

  useEffect(() => { fetchStatus(); }, []);

  const quickInstall = async (tool: string) => {
    setInstalling(tool);
    setInstallResult(null);
    try {
      const res = await fetch('/api/tools/install', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool }),
      });
      const data = await res.json();
      setInstallResult(data.success ? `OK: ${tool} installed` : `FAIL: ${data.output?.slice(0, 100)}`);
      if (data.success) fetchStatus();
    } catch { setInstallResult('Error: connection failed'); }
    setInstalling(null);
  };

  const installedCount = status?.installed || 0;
  const totalCount = status?.total || 0;
  const pct = totalCount > 0 ? Math.round((installedCount / totalCount) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0 flex items-center justify-between">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <ShieldCheck size={14} className="text-accent" />
          TOOL STATUS
          <span className="text-zinc-600 font-mono text-[10px]">{installedCount}/{totalCount}</span>
        </h2>
        <button onClick={fetchStatus} disabled={loading} className="p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
          <Loader2 size={12} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Progress bar */}
        <div className="bg-black border border-zinc-900 p-4">
          <div className="flex justify-between mb-2">
            <span className="text-[9px] text-zinc-500 uppercase">Tools Installed</span>
            <span className="text-[9px] text-neon-green font-mono">{pct}%</span>
          </div>
          <div className="h-2 bg-zinc-900 border border-zinc-800 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent to-neon-green transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          {status?.system && (
            <div className="mt-3 space-y-1">
              <div className="flex justify-between"><span className="text-[8px] text-zinc-600 uppercase">OS</span><span className="text-[8px] text-zinc-400 font-mono truncate ml-4">{status.system.os}</span></div>
              <div className="flex justify-between"><span className="text-[8px] text-zinc-600 uppercase">Arch</span><span className="text-[8px] text-zinc-400 font-mono">{status.system.arch}</span></div>
              <div className="flex justify-between"><span className="text-[8px] text-zinc-600 uppercase">Kernel</span><span className="text-[8px] text-zinc-400 font-mono">{status.system.kernel}</span></div>
            </div>
          )}
        </div>

        {/* Install result */}
        {installResult && (
          <div className={cn("p-3 border text-[9px] font-mono", installResult.startsWith('OK') ? "bg-neon-green/5 border-neon-green/20 text-neon-green" : "bg-red-500/5 border-red-500/20 text-red-400")}>
            {installResult}
          </div>
        )}

        {/* Tool list */}
        {status && (
          <div className="space-y-1">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Tools</p>
            {Object.entries(status.tools).map(([tool, installed]) => (
              <div key={tool} className="flex items-center justify-between p-2 bg-black border border-zinc-900 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-2">
                  <div className={cn("w-2 h-2", installed ? "bg-neon-green" : "bg-zinc-700")} />
                  <span className={cn("text-[9px] font-mono", installed ? "text-white" : "text-zinc-500")}>{tool}</span>
                </div>
                <div className="flex items-center gap-1">
                  {installed ? (
                    <span className="text-[7px] font-black text-neon-green uppercase px-1.5 py-0.5 border border-neon-green/20 bg-neon-green/5">OK</span>
                  ) : TERMUX_PACKAGES[tool] ? (
                    <button onClick={() => quickInstall(tool)} disabled={installing === tool}
                      className="flex items-center gap-1 text-[7px] font-black text-accent uppercase px-1.5 py-0.5 border border-accent/20 hover:bg-accent hover:text-black transition-all disabled:opacity-50">
                      {installing === tool ? <Loader2 size={8} className="animate-spin" /> : <Download size={8} />}
                      {installing === tool ? '...' : 'INSTALL'}
                    </button>
                  ) : (
                    <span className="text-[7px] font-black text-zinc-700 uppercase px-1.5 py-0.5">MANUAL</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
