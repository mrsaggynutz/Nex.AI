import React from 'react';
import { motion } from 'motion/react';
import { PanelMode } from '../App';
import {
  Crosshair, FolderOpen, FileCode, GitBranch, Globe, Shield, Zap, Terminal,
  Brain, Code2, Lock, Cpu, Smartphone
} from 'lucide-react';
import { cn } from '../lib/utils';

interface MasterArsenalProps {
  onNavigate: (panel: PanelMode) => void;
  onRunInTerminal?: (cmd: string) => void;
  onExecuteCommand?: (cmd: string) => () => Promise<string | null>;
}

const ARSENAL_FEATURES: { mode: PanelMode; name: string; desc: string; icon: React.ReactNode; color: string; badge?: string }[] = [
  { mode: 'ai-runner', name: 'AI Code Assistant', desc: 'AI writes, runs, and debugs code autonomously. Agentic execution loop with auto-fix.', icon: <Code2 size={22} />, color: 'from-green-500 to-emerald-600', badge: 'EXCLUSIVE' },
  { mode: 'exploit-engine', name: 'AI Exploit Engine', desc: 'AI-powered exploit generation and privilege escalation for Moto G Stylus 5G 2024.', icon: <Zap size={22} />, color: 'from-red-500 to-orange-600', badge: 'EXCLUSIVE' },
  { mode: 'force-root', name: 'Force Root Scripts', desc: 'Moto G Stylus exclusive: proot, ADB, Termux:API, bootloader, SELinux, device hacks.', icon: <Smartphone size={22} />, color: 'from-amber-500 to-red-500', badge: 'EXCLUSIVE' },
  { mode: 'core-ai', name: 'CORE AI Engine', desc: 'Multi-mode AI: Pentest, Code, OSINT, Wireless, Exploit, Forensics. 7 specialized modes.', icon: <Cpu size={22} />, color: 'from-cyan-500 to-blue-600', badge: 'AI' },
  { mode: 'file-browser', name: 'File Browser', desc: 'Navigate dirs, view/edit/rename/delete files, breadcrumbs, search, hidden file toggle.', icon: <FolderOpen size={22} />, color: 'from-amber-500 to-yellow-600' },
  { mode: 'code-editor', name: 'Code Editor', desc: 'Syntax highlighting for 15+ languages, line numbers, auto-indent, run code button.', icon: <FileCode size={22} />, color: 'from-green-500 to-emerald-600' },
  { mode: 'git-panel', name: 'Git Panel', desc: 'Full git workflow: status, log, stage/unstage, commit, branch, diff viewer, push/pull.', icon: <GitBranch size={22} />, color: 'from-orange-500 to-red-600' },
  { mode: 'live-preview', name: 'Live Preview', desc: 'HTML/CSS/JS editor with instant iframe preview, auto-refresh, import/export.', icon: <Globe size={22} />, color: 'from-cyan-500 to-blue-600' },
];

export const MasterArsenal: React.FC<MasterArsenalProps> = ({ onNavigate }) => {
  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      <div className="px-4 py-4 border-b border-zinc-900 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/20 border border-accent/30 flex items-center justify-center">
            <Crosshair size={20} className="text-accent" />
          </div>
          <div>
            <h2 className="text-base font-black text-white uppercase tracking-tighter">Arsenal</h2>
            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.15em]">8 Exclusive Features</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 pb-16">
        {ARSENAL_FEATURES.map((feat, i) => (
          <motion.button
            key={feat.mode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            onClick={() => onNavigate(feat.mode)}
            className="w-full flex items-center gap-3.5 p-4 bg-surface border border-zinc-900 hover:border-zinc-700 active:bg-zinc-900 transition-all text-left rounded-sm group"
          >
            <div className={cn("w-11 h-11 shrink-0 flex items-center justify-center rounded-sm bg-gradient-to-br text-white", feat.color)}>
              {feat.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-[13px] font-black text-white uppercase tracking-tight">{feat.name}</h3>
                {feat.badge && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 bg-accent text-black uppercase rounded-sm">{feat.badge}</span>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed mt-0.5 truncate">{feat.desc}</p>
            </div>
            <div className="text-zinc-700 group-hover:text-zinc-400 group-active:text-accent transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 18l6-6-6-6" /></svg>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
