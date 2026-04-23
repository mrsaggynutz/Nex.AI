import React, { useState, useEffect } from 'react';
import { AxiomTerminal } from './components/AxiomTerminal';
import { AxiomChat } from './components/AxiomChat';
import { ToolLauncher } from './components/ToolLauncher';
import { SystemMonitor } from './components/SystemMonitor';
import { PasswordGenerator } from './components/PasswordGenerator';
import { HashGenerator } from './components/HashGenerator';
import { DNSLookup } from './components/DNSLookup';
import { ToolStatusDashboard } from './components/ToolStatusDashboard';
import { BootSequence } from './components/BootSequence';
import { MasterArsenal } from './components/MasterArsenal';
import { AxiomCoreAI } from './components/AxiomCoreAI';
import { OpenClawAgent } from './components/OpenClawAgent';
import { AISettings } from './components/AISettings';
import { ForceRootScripts } from './components/ForceRootScripts';
import { AIExploitEngine } from './components/AIExploitEngine';
import { AICodeRunner } from './components/AICodeRunner';
import { FileBrowser } from './components/FileBrowser';
import { CodeEditor } from './components/CodeEditor';
import { GitPanel } from './components/GitPanel';
import { LivePreview } from './components/LivePreview';
import { ChatMessage, ExecuteFn } from './types';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import {
  Terminal, Wrench, Bot, Activity, MoreHorizontal,
  KeyRound, Hash, Globe, ShieldCheck, ChevronLeft,
  Crosshair, Cpu, Settings, Download, X, Sparkles, Zap,
  Siren
} from 'lucide-react';

export type PanelMode = 'terminal' | 'tools' | 'chat' | 'arsenal' | 'core-ai' | 'open-claw' | 'ai-settings'
  | 'sysmon' | 'password' | 'hash' | 'dns' | 'toolstatus'
  | 'force-root' | 'exploit-engine' | 'ai-runner'
  | 'file-browser' | 'code-editor' | 'git-panel' | 'live-preview';

const MAIN_TABS: { mode: PanelMode; label: string; icon: React.ReactNode }[] = [
  { mode: 'terminal', label: 'Terminal', icon: <Terminal size={20} /> },
  { mode: 'tools', label: 'Tools', icon: <Wrench size={20} /> },
  { mode: 'open-claw', label: 'CLAW', icon: <Siren size={20} /> },
  { mode: 'arsenal', label: 'Arsenal', icon: <Crosshair size={20} /> },
  { mode: 'core-ai', label: 'CORE AI', icon: <Cpu size={20} /> },
  { mode: 'chat', label: 'AI', icon: <Bot size={20} /> },
];

const MORE_TABS: { mode: PanelMode; label: string; icon: React.ReactNode; color: string }[] = [
  { mode: 'ai-settings', label: 'AI Settings', icon: <Settings size={18} />, color: 'text-accent' },
  { mode: 'toolstatus', label: 'Tool Status', icon: <ShieldCheck size={18} />, color: 'text-emerald-400' },
  { mode: 'sysmon', label: 'System', icon: <Activity size={18} />, color: 'text-cyan-400' },
  { mode: 'password', label: 'Passwords', icon: <KeyRound size={18} />, color: 'text-amber-400' },
  { mode: 'hash', label: 'Hash', icon: <Hash size={18} />, color: 'text-purple-400' },
  { mode: 'dns', label: 'DNS', icon: <Globe size={18} />, color: 'text-blue-400' },
];

const ARSENAL_SUBPANELS: PanelMode[] = [
  'force-root', 'exploit-engine', 'ai-runner',
  'file-browser', 'code-editor', 'git-panel', 'live-preview'
];

const FEATURE_COUNT = 36;

/* PWA Install Prompt */
let deferredPrompt: any = null;

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [activePanel, setActivePanel] = useState<PanelMode>('terminal');
  const [terminalInput, setTerminalInput] = useState<string | null>(null);
  const [editorFilePath, setEditorFilePath] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(false);
  const [zoom, setZoom] = useState(() => {
    const saved = localStorage.getItem('nexai-zoom');
    return saved ? parseFloat(saved) : 1;
  });

  // PWA install prompt listener
  useEffect(() => {
    const dismissed = localStorage.getItem('nexai-install-dismissed');
    const installed = localStorage.getItem('nexai-installed');
    if (dismissed || installed) { setInstallDismissed(true); return; }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e;
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Check if already installed
    window.addEventListener('appinstalled', () => {
      localStorage.setItem('nexai-installed', 'true');
      setShowInstallBanner(false);
      setInstallDismissed(true);
      deferredPrompt = null;
    });

    // Show after 3 seconds if not installed
    const timer = setTimeout(() => {
      if (!deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
        setShowInstallBanner(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      clearTimeout(timer);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        localStorage.setItem('nexai-installed', 'true');
      }
      deferredPrompt = null;
    }
    setShowInstallBanner(false);
  };

  const dismissInstall = () => {
    setShowInstallBanner(false);
    setInstallDismissed(true);
    localStorage.setItem('nexai-install-dismissed', 'true');
  };

  // Deep link panel from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const panel = params.get('panel') as PanelMode | null;
    if (panel) setActivePanel(panel);
  }, []);

  useEffect(() => {
    const clamped = Math.max(0.7, Math.min(2.0, zoom));
    document.documentElement.style.zoom = String(clamped);
    document.documentElement.style.height = (100 / clamped) + 'vh';
    localStorage.setItem('nexai-zoom', String(clamped));
  }, [zoom]);

  const executeCommand: ExecuteFn = async (command, timeoutMs) => {
    try {
      const body: Record<string, unknown> = { command };
      if (timeoutMs) body.timeout = timeoutMs;
      const res = await fetch('/api/terminal/exec', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.timedOut) return 'TIMEOUT: Command took too long.';
      if (data.error && !data.stdout && !data.stderr) return `ERROR: ${data.error}`;
      const output = data.stdout || data.stderr || 'Done.';
      if (data.wasPreprocessed) return `[AUTO -y] ${data.processedCommand}\n${output}`;
      return output;
    } catch { return "ERROR: Cannot reach backend."; }
  };

  const handleSendMessage = async (input: string) => {
    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setIsThinking(true);
    try {
      const allMessages = [...messages, userMessage];
      const res = await fetch('/api/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: allMessages.map(m => ({ role: m.role, content: m.content })) }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      const assistantMessage: ChatMessage = {
        role: 'assistant', content: data.content || "No response generated.",
        reasoningSteps: data.reasoningSteps, toolsUsed: data.toolsUsed,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `SYSTEM ERROR: ${error.message || "Connection failed."}` }]);
    } finally { setIsThinking(false); }
  };

  const handleRunInTerminal = (command: string) => {
    setTerminalInput(command);
    setActivePanel('terminal');
  };

  const navigateToPanel = (panel: PanelMode) => {
    setActivePanel(panel);
    setShowMoreMenu(false);
  };

  useEffect(() => {
    if (terminalInput) {
      const timer = setTimeout(() => setTerminalInput(null), 500);
      return () => clearTimeout(timer);
    }
  }, [terminalInput]);

  if (booting) {
    return <BootSequence onComplete={() => setBooting(false)} />;
  }

  const isMainTab = ['terminal', 'tools', 'arsenal', 'core-ai', 'open-claw', 'chat'].includes(activePanel);
  const isArsenalSub = ARSENAL_SUBPANELS.includes(activePanel);

  const renderPanel = () => {
    switch (activePanel) {
      case 'terminal': return <AxiomTerminal onExecute={executeCommand} onRunInTerminal={handleRunInTerminal} injectedCommand={terminalInput} autoConnect />;
      case 'tools': return <ToolLauncher onExecuteCommand={executeCommand} onRunInTerminal={handleRunInTerminal} onSendMessage={handleSendMessage} />;
      case 'chat': return <AxiomChat messages={messages} onSendMessage={handleSendMessage} isThinking={isThinking} onClear={() => setMessages([])} />;
      case 'arsenal': return <MasterArsenal onNavigate={navigateToPanel} onRunInTerminal={handleRunInTerminal} onExecuteCommand={(cmd: string) => () => executeCommand(cmd)} />;
      case 'core-ai': return <AxiomCoreAI onSendMessage={handleSendMessage} onExecuteCommand={executeCommand} onRunInTerminal={handleRunInTerminal} />;
      case 'open-claw': return <OpenClawAgent onExecuteCommand={executeCommand} onRunInTerminal={handleRunInTerminal} />;
      case 'ai-settings': return <AISettings />;
      case 'toolstatus': return <ToolStatusDashboard onRunInTerminal={handleRunInTerminal} />;
      case 'sysmon': return <SystemMonitor />;
      case 'password': return <PasswordGenerator />;
      case 'hash': return <HashGenerator />;
      case 'dns': return <DNSLookup />;
      case 'force-root': return <ForceRootScripts onExecute={executeCommand} onRunInTerminal={handleRunInTerminal} />;
      case 'exploit-engine': return <AIExploitEngine onExecute={executeCommand} onRunInTerminal={handleRunInTerminal} />;
      case 'ai-runner': return <AICodeRunner onExecute={executeCommand} onRunInTerminal={handleRunInTerminal} />;
      case 'file-browser': return <FileBrowser onExecute={executeCommand} onOpenInEditor={(p) => { setEditorFilePath(p); navigateToPanel('code-editor'); }} onRunInTerminal={handleRunInTerminal} />;
      case 'code-editor': return <CodeEditor filePath={editorFilePath || undefined} onExecute={executeCommand} onRunInTerminal={handleRunInTerminal} />;
      case 'git-panel': return <GitPanel onExecute={executeCommand} onRunInTerminal={handleRunInTerminal} />;
      case 'live-preview': return <LivePreview onExecute={executeCommand} onRunInTerminal={handleRunInTerminal} />;
      default: return <AxiomTerminal onExecute={executeCommand} autoConnect />;
    }
  };

  return (
    <div className="h-screen w-screen bg-bg text-white flex flex-col overflow-hidden selection:bg-accent/30 font-display">
      {/* Top Bar */}
      <div className="bg-surface/80 backdrop-blur-xl border-b border-zinc-900/50 flex items-center justify-between px-3 md:px-5 shrink-0 safe-top">
        <div className="flex items-center gap-2 md:gap-3">
          {(isArsenalSub || !isMainTab) && (
            <button onClick={() => navigateToPanel(isArsenalSub ? 'arsenal' : 'tools')} className="p-1.5 -ml-1 hover:bg-zinc-800/50 text-zinc-400 transition-colors rounded-sm">
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="text-sm md:text-lg font-black tracking-tighter uppercase">
            NEX<span className="text-accent glow-green">.AI</span>
          </div>
          <div className="flex items-center gap-1.5 border-l border-zinc-800/50 pl-2 md:pl-3">
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-glow"></div>
            <span className="hidden sm:inline text-[9px] font-black uppercase tracking-widest text-accent/60">ONLINE</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden lg:flex items-center gap-3 text-[9px] font-extrabold text-zinc-600 uppercase ml-2">
            <span className="flex items-center gap-1"><Sparkles size={10} className="text-accent/40" />v2.1.0</span>
            <span>{FEATURE_COUNT} FEATURES</span>
            <span className="text-accent">OPEN CLAW</span>
          </div>
          <div className="flex items-center gap-0.5 bg-black/50 border border-zinc-800/50 rounded-sm">
            <button onClick={() => setZoom(prev => Math.min(2.0, Math.round((prev - 0.1) * 10) / 10))} className="px-2 py-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors text-[10px] font-black">−</button>
            <button onClick={() => setZoom(1)} className="px-1.5 py-1 text-zinc-500 hover:text-accent hover:bg-zinc-800 transition-colors text-[9px] font-black tabular-nums">{Math.round(zoom * 100)}%</button>
            <button onClick={() => setZoom(prev => Math.min(2.0, Math.round((prev + 0.1) * 10) / 10))} className="px-2 py-1 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors text-[10px] font-black">+</button>
          </div>
          <span className="md:hidden text-[9px] font-black uppercase tracking-wider text-zinc-500 truncate">
            {activePanel === 'core-ai' ? 'CORE AI' : activePanel === 'open-claw' ? 'OPEN CLAW' : activePanel === 'arsenal' ? 'ARSENAL' : activePanel === 'terminal' ? 'PTY' : activePanel === 'tools' ? 'TOOLS' : activePanel === 'chat' ? 'AI' : activePanel.replace(/-/g, ' ').toUpperCase().slice(0, 12)}
          </span>
        </div>
      </div>

      {/* Install Banner */}
      <AnimatePresence>
        {showInstallBanner && !installDismissed && !window.matchMedia('(display-mode: standalone)').matches && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden shrink-0"
          >
            <div className="bg-accent/5 border-b border-accent/20 px-4 py-2.5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 bg-accent/10 border border-accent/30 rounded-sm flex items-center justify-center shrink-0">
                  <Download size={14} className="text-accent" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-black text-white uppercase tracking-tight">Install Nex.AI</p>
                  <p className="text-[8px] text-zinc-500 truncate">Add to home screen for the full app experience</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={handleInstall} className="btn-primary text-[9px] px-3 py-1.5">
                  Install
                </button>
                <button onClick={dismissInstall} className="p-1 text-zinc-600 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden relative">
        <div className={cn("absolute inset-0", activePanel !== 'terminal' && "hidden")}>
          <AxiomTerminal onExecute={executeCommand} injectedCommand={terminalInput} autoConnect />
        </div>
        <div className={cn("absolute inset-0", activePanel === 'terminal' && "invisible")}>
          <div className="h-full panel-enter">{renderPanel()}</div>
        </div>
      </div>

      {/* More Menu */}
      {showMoreMenu && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowMoreMenu(false)} />
          <motion.div
            initial={{ y: 300, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute bottom-20 left-3 right-3 bg-surface/95 backdrop-blur-xl border border-zinc-800/50 rounded-lg overflow-hidden shadow-2xl glow-border"
          >
            <div className="p-3 border-b border-zinc-800/50">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Utilities</p>
            </div>
            <div className="p-2">
              {MORE_TABS.map(tab => (
                <button key={tab.mode} onClick={() => navigateToPanel(tab.mode)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-900/50 transition-colors text-left">
                  <div className={cn("shrink-0", tab.color)}>{tab.icon}</div>
                  <p className="text-sm font-black text-white uppercase tracking-tight">{tab.label}</p>
                  <ChevronLeft size={14} className="text-zinc-700 -rotate-180 ml-auto" />
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}

      {/* Bottom Tab Bar */}
      <div className="bg-surface/80 backdrop-blur-xl border-t border-zinc-900/50 shrink-0 safe-bottom lg:hidden">
        <div className="flex items-stretch">
          {MAIN_TABS.map(tab => {
            const isActive = activePanel === tab.mode || (tab.mode === 'arsenal' && isArsenalSub);
            return (
              <button key={tab.mode} onClick={() => navigateToPanel(tab.mode)}
                className={cn("flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all min-h-[56px] relative",
                  isActive ? "text-accent" : "text-zinc-500")}>
                <div className={cn("transition-all", isActive && "drop-shadow-[0_0_8px_rgba(0,255,65,0.6)]")}>
                  {tab.icon}
                </div>
                <span className={cn("text-[9px] font-black uppercase tracking-widest", isActive ? "text-accent glow-green" : "text-zinc-600")}>
                  {tab.label}
                </span>
                {isActive && <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-accent rounded-full"></div>}
              </button>
            );
          })}
          <button onClick={() => setShowMoreMenu(true)}
            className={cn("flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-all min-h-[56px]",
              showMoreMenu ? "text-accent" : !isMainTab ? "text-accent" : "text-zinc-500")}>
            <MoreHorizontal size={20} />
            <span className={cn("text-[9px] font-black uppercase tracking-widest",
              showMoreMenu ? "text-accent" : !isMainTab ? "text-accent" : "text-zinc-600")}>
              {!isMainTab ? 'Active' : 'More'}
            </span>
          </button>
        </div>
      </div>

      {/* Desktop Bottom Bar */}
      <div className="hidden lg:flex h-7 bg-surface/80 backdrop-blur-xl border-t border-zinc-900/50 items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4 text-[8px] font-black text-zinc-600 uppercase tracking-widest">
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full bg-accent"></div>
            <span>Ethical Hacking Only</span>
          </div>
          <span>Auto -y Active</span>
          <span className="text-accent">{FEATURE_COUNT} Features</span>
          <span className="flex items-center gap-1"><Zap size={8} className="text-accent/40" />PWA Ready</span>
        </div>
        <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-widest">
          <span className="text-zinc-700">{messages.length} msgs</span>
          <span className="text-accent">v2.1.0</span>
        </div>
      </div>
    </div>
  );
}
