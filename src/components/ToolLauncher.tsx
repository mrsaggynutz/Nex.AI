import React, { useState } from 'react';
import { Play, Copy, Check, X, ChevronRight, Download, AlertTriangle, ShieldCheck, Terminal, Lock, ChevronLeft, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { HackTool, ToolCategory, CATEGORIES, getToolsByCategory, searchTools } from '../tools-database';

interface ToolLauncherProps {
  onExecuteCommand: (command: string) => void;
  onRunInTerminal: (command: string) => void;
  onSendMessage: (msg: string) => Promise<void>;
}

export const ToolLauncher: React.FC<ToolLauncherProps> = ({ onExecuteCommand, onRunInTerminal, onSendMessage }) => {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<HackTool | null>(null);
  const [argValues, setArgValues] = useState<Record<string, string>>({});
  const [toolOutput, setToolOutput] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);

  const filteredTools = searchQuery
    ? searchTools(searchQuery)
    : activeCategory === 'all'
      ? CATEGORIES.flatMap(cat => getToolsByCategory(cat.id)).slice(0, 40)
      : getToolsByCategory(activeCategory);

  const buildCommand = (tool: HackTool): string => {
    let cmd = tool.command;
    if (tool.args) {
      tool.args.forEach(arg => {
        const val = argValues[`${tool.id}-${arg.name}`];
        if (val && val.trim()) {
          if (arg.flag) cmd += ` ${arg.flag}`;
          cmd += ` ${val}`;
        }
      });
    }
    return cmd;
  };

  const handleRun = async () => {
    if (!selectedTool) return;
    const cmd = buildCommand(selectedTool);
    setIsRunning(true);
    setToolOutput(null);
    try {
      const res = await fetch('/api/terminal/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      });
      const data = await res.json();
      setToolOutput(data.stdout || data.stderr || data.error || 'Command completed.');
    } catch {
      setToolOutput('Error: Could not execute command.');
    }
    setIsRunning(false);
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAskAI = () => {
    if (!selectedTool) return;
    const msg = `How do I use ${selectedTool.name} for ethical hacking? Give me practical examples and explain the output. The install command is: ${selectedTool.installCmd}`;
    onSendMessage(msg);
  };

  const dangerColors: Record<string, string> = {
    info: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20',
    low: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
    medium: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    high: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
    critical: 'text-red-500 bg-red-500/10 border-red-500/20',
  };

  const sourceIcons: Record<string, React.ReactNode> = {
    kali: <span className="text-blue-400 text-[8px] font-black bg-blue-400/10 px-1.5 py-0.5 border border-blue-400/20">KALI</span>,
    termux: <span className="text-green-400 text-[8px] font-black bg-green-400/10 px-1.5 py-0.5 border border-green-400/20">TERMUX</span>,
    nix: <span className="text-purple-400 text-[8px] font-black bg-purple-400/10 px-1.5 py-0.5 border border-purple-400/20">NIX</span>,
    custom: <span className="text-neon-green text-[8px] font-black bg-neon-green/10 px-1.5 py-0.5 border border-neon-green/20">AETHER</span>,
  };

  // ═══ TOOL DETAIL VIEW (mobile: replaces list) ═══
  if (selectedTool) {
    return (
      <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
        {/* Detail Header */}
        <div className="px-4 py-3 border-b border-zinc-900 shrink-0 flex items-center gap-3 safe-top">
          <button onClick={() => { setSelectedTool(null); setToolOutput(null); setArgValues({}); }}
            className="p-1.5 hover:bg-zinc-800 text-zinc-400 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-black text-white uppercase tracking-tight truncate">{selectedTool.name}</h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {sourceIcons[selectedTool.source]}
              <span className={cn("text-[7px] font-black px-1.5 py-0.5 border uppercase", dangerColors[selectedTool.dangerLevel])}>
                {selectedTool.dangerLevel}
              </span>
            </div>
          </div>
          <button onClick={() => handleCopyCommand(buildCommand(selectedTool))}
            className="p-2 hover:bg-zinc-800 text-zinc-500 transition-colors">
            {copied ? <Check size={16} className="text-neon-green" /> : <Copy size={16} />}
          </button>
        </div>

        {/* Detail Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Description */}
          <div className="p-4 border-b border-zinc-900">
            <p className="text-[11px] text-zinc-400 uppercase leading-relaxed">{selectedTool.description}</p>
          </div>

          {/* Install Command */}
          <div className="p-4 border-b border-zinc-900">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <Download size={12} /> INSTALL
            </p>
            <div className="bg-black border border-zinc-800 p-3 relative">
              <pre className="text-[10px] text-neon-green font-mono whitespace-pre-wrap break-all pr-8">{selectedTool.installCmd}</pre>
              <button onClick={() => handleCopyCommand(selectedTool.installCmd)}
                className="absolute top-2 right-2 p-1.5 hover:bg-zinc-800 text-zinc-500 hover:text-white">
                <Copy size={12} />
              </button>
            </div>
          </div>

          {/* Arguments */}
          {selectedTool.args && selectedTool.args.length > 0 && (
            <div className="p-4 border-b border-zinc-900">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">PARAMETERS</p>
              <div className="space-y-3">
                {selectedTool.args.map((arg, i) => (
                  <div key={i}>
                    <label className="text-[10px] font-black text-zinc-300 uppercase tracking-widest block mb-1.5">
                      {arg.flag && <span className="text-accent mr-1">{arg.flag}</span>}
                      {arg.name}
                      {arg.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {arg.type === 'select' && arg.options ? (
                      <select
                        onChange={(e) => setArgValues(prev => ({ ...prev, [`${selectedTool.id}-${arg.name}`]: e.target.value }))}
                        className="w-full bg-black border border-zinc-800 text-[12px] text-white font-bold uppercase px-3 py-2.5 focus:outline-none focus:border-accent rounded-sm">
                        <option value="">Select...</option>
                        {arg.options.map((opt, oi) => (
                          <option key={oi} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder={arg.example}
                        onChange={(e) => setArgValues(prev => ({ ...prev, [`${selectedTool.id}-${arg.name}`]: e.target.value }))}
                        className="w-full bg-black border border-zinc-800 text-[12px] text-white font-bold uppercase px-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-zinc-800 rounded-sm" />
                    )}
                    <p className="text-[9px] text-zinc-600 mt-1">{arg.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Command Preview */}
          <div className="p-4 border-b border-zinc-900">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">COMMAND</p>
            <div className="bg-black border border-zinc-800 p-3">
              <pre className="text-[11px] text-white font-mono whitespace-pre-wrap break-all">{buildCommand(selectedTool)}</pre>
            </div>
          </div>

          {/* Action Buttons - BIG touch targets for mobile */}
          <div className="p-4 border-b border-zinc-900 space-y-2">
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="w-full py-3.5 bg-accent text-black font-black uppercase tracking-widest text-sm hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2 rounded-sm">
              <Play size={16} />
              {isRunning ? 'RUNNING...' : 'EXECUTE'}
            </button>
            <div className="flex gap-2">
              <button onClick={() => onRunInTerminal(buildCommand(selectedTool))}
                className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-1.5 rounded-sm">
                <Terminal size={14} /> PTY
              </button>
              <button onClick={handleAskAI}
                className="flex-1 py-3 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-1.5 rounded-sm">
                <Zap size={14} /> ASK AI
              </button>
            </div>
          </div>

          {/* Output */}
          {(toolOutput || isRunning) && (
            <div className="p-4 border-b border-zinc-900">
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">OUTPUT</p>
              <div className="bg-black border border-zinc-800 p-3 max-h-48 overflow-y-auto custom-scrollbar">
                {isRunning ? (
                  <div className="flex items-center gap-2 text-accent text-[11px] font-black uppercase animate-pulse">
                    <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                    Executing...
                  </div>
                ) : (
                  <pre className="text-[11px] text-neon-green font-mono whitespace-pre-wrap break-all">{toolOutput}</pre>
                )}
              </div>
            </div>
          )}

          {/* Examples */}
          <div className="p-4 pb-8">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">EXAMPLES</p>
            <div className="space-y-1.5">
              {selectedTool.examples.map((ex, i) => (
                <div key={i} onClick={() => handleCopyCommand(ex)}
                  className="bg-black/50 border border-zinc-900 p-3 cursor-pointer hover:border-zinc-700 transition-colors group flex items-start gap-2 rounded-sm active:bg-zinc-900">
                  <span className="text-accent text-[10px] mt-0.5 shrink-0">$</span>
                  <pre className="text-[10px] text-zinc-400 font-mono whitespace-pre-wrap break-all flex-1 group-hover:text-white">{ex}</pre>
                  <Copy size={11} className="text-zinc-700 group-hover:text-zinc-400 shrink-0 mt-0.5" />
                </div>
              ))}
            </div>
            {selectedTool.notes && (
              <div className="mt-3 p-3 bg-amber-600/5 border border-amber-600/20 rounded-sm">
                <p className="text-[9px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1 mb-1">
                  <AlertTriangle size={11} /> NOTE
                </p>
                <p className="text-[10px] text-zinc-500 leading-relaxed">{selectedTool.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ═══ TOOL LIST VIEW ═══
  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      {/* Search */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 148 tools... (nmap, sqlmap, wifi...)"
            className="w-full bg-black border border-zinc-800 text-white text-[13px] font-bold px-4 py-3 focus:outline-none focus:border-accent placeholder:text-zinc-700 rounded-sm"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Categories */}
      {!searchQuery && (
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 pb-3 shrink-0">
          <button
            onClick={() => setActiveCategory('all')}
            className={cn(
              "text-[10px] font-black px-3 py-1.5 border whitespace-nowrap transition-all uppercase tracking-tighter shrink-0 rounded-sm",
              activeCategory === 'all' ? "bg-accent text-black border-accent" : "text-zinc-500 border-zinc-800 hover:border-zinc-700"
            )}
          >
            ALL
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "text-[10px] font-black px-3 py-1.5 border whitespace-nowrap transition-all uppercase tracking-tighter shrink-0 rounded-sm",
                activeCategory === cat.id ? "bg-accent text-black border-accent" : "text-zinc-500 border-zinc-800 hover:border-zinc-700"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      )}

      {/* Tool count */}
      <div className="px-4 pb-2 shrink-0">
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
          {filteredTools.length} tools {searchQuery && `for "${searchQuery}"`}
        </span>
      </div>

      {/* Tool List - Cards with good touch targets */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-16 space-y-2">
        {filteredTools.map(tool => (
          <div
            key={tool.id}
            onClick={() => { setSelectedTool(tool); setArgValues({}); setToolOutput(null); }}
            className="p-4 border border-zinc-900 bg-surface cursor-pointer transition-all active:bg-zinc-900 active:border-zinc-700 rounded-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5">
                  <p className="text-[12px] font-black text-white tracking-widest uppercase truncate">{tool.name}</p>
                  {sourceIcons[tool.source]}
                </div>
                <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{tool.description}</p>
                <div className="flex items-center gap-1.5 mt-2">
                  <span className={cn("text-[8px] font-black px-1.5 py-0.5 border uppercase", dangerColors[tool.dangerLevel])}>
                    {tool.dangerLevel}
                  </span>
                  {tool.offline && (
                    <span className="text-[8px] font-black px-1.5 py-0.5 border border-zinc-700 text-zinc-400 uppercase">OFFLINE</span>
                  )}
                  <span className="text-[8px] text-zinc-700 font-mono ml-auto">{tool.command}</span>
                </div>
              </div>
              <ChevronRight size={18} className="text-zinc-700 shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
