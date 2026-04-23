import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Terminal as TerminalIcon, Loader2, Bot, Sparkles, Cpu, Star, Plus, X, Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';
import { TerminalLine, ExecuteFn } from '../types';

interface TerminalProps {
  onExecute?: ExecuteFn;
  onRunInTerminal?: (cmd: string) => void;
  injectedCommand?: string | null;
  autoConnect?: boolean;
  onInjectedDone?: () => void;
}

type AIMode = 'off' | 'auto' | 'agent';

const TERMINAL_SYSTEM_PROMPT = `You are NEX.AI Agent embedded in a terminal. You write bash commands that execute immediately.
Running on Termux (Android ARM64, Moto G Stylus 5G 2024). Use pkg install not apt/sudo. python3 and node available.
Keep responses SHORT. Write commands in \`\`\`bash code blocks. They execute automatically.
On errors, provide fixes. Be concise - this is a terminal.`;

const AGENT_SYSTEM_PROMPT = TERMINAL_SYSTEM_PROMPT + `
AGENT MODE: After seeing [EXEC RESULT], analyze it. If errors, write fixed code with # [FIX].
Never stop on failure. Chain steps. Max 2 code blocks per response to save tokens.`;

const BUILTIN_COMMANDS = ['help','clear','neofetch','tools','sysmon','ai','ai:auto','ai:agent','ai:off','session new','ls','pwd','whoami','pkg','cd','cat','mkdir','rm','cp','mv','grep','find','git','python3','node','npm','curl','wget','ssh','chmod','echo','export','env','uname','date','uptime','free','df','ps','kill','ping','dig','netstat','ip','tar','zip','unzip','which','history'];

interface Session {
  id: string;
  name: string;
  history: TerminalLine[];
  commandHistory: string[];
  input: string;
  historyIndex: number;
}

function extractBashBlocks(content: string): string[] {
  const blocks: string[] = [];
  const regex = /```(?:bash|sh|shell)\n?([\s\S]*?)```/g;
  let match;
  while ((match = regex.exec(content)) !== null) blocks.push(match[1].trim());
  return blocks;
}

function stripCodeBlocks(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '').replace(/\[EXEC RESULT\]/g, '').replace(/\[FIX\]/g, '').trim();
}

function colorizeOutput(line: string): React.ReactNode {
  if (/^error:/i.test(line) || /^fatal:/i.test(line) || /^permission denied/i.test(line) || /^no such file/i.test(line) || /not found/i.test(line) || /failed/i.test(line))
    return <span className="text-red-400">{line}</span>;
  if (/^warning:/i.test(line) || /^warn:/i.test(line)) return <span className="text-yellow-400">{line}</span>;
  if (/^ok$/i.test(line) || /^success/i.test(line) || /setting up/i.test(line) || /installed/i.test(line))
    return <span className="text-accent">{line}</span>;
  if (/^\/[\w/.\-_~]+/.test(line) && line.length < 120) return <span className="text-cyan-400">{line}</span>;
  if (/^https?:\/\//.test(line)) return <span className="text-blue-400 underline">{line}</span>;
  if (/^[a-f0-9]{7,40}$/.test(line)) return <span className="text-amber-400 font-mono">{line}</span>;
  return <>{line}</>;
}

export const AxiomTerminal: React.FC<TerminalProps> = ({ onExecute, injectedCommand, autoConnect = true, onInjectedDone }) => {
  const [sessions, setSessions] = useState<Session[]>([
    { id: 'default', name: 'Main', history: [
      { type: 'system', content: 'Nex.AI v1.0 [Terminal AI Agent + Arsenal + CORE AI]' },
      { type: 'system', content: 'TYPE "help" FOR COMMANDS  |  "ai:" TO ENABLE AI MODE' },
    ], commandHistory: [], input: '', historyIndex: -1 }
  ]);
  const [activeSessionId, setActiveSessionId] = useState('default');
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    try { const s = localStorage.getItem('nexai-terminal-bookmarks'); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedMode, setConnectedMode] = useState<'virtual' | 'live'>('virtual');
  const [host, setHost] = useState('host');
  const [isExecuting, setIsExecuting] = useState(false);
  const [aiMode, setAiMode] = useState<AIMode>('off');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiSession, setAiSession] = useState<Array<{role: string; content: string}>>([]);
  const [aiExecCount, setAiExecCount] = useState(0);
  const [tabCompletions, setTabCompletions] = useState<string[]>([]);

  const terminalRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const updateSession = useCallback((sessionId: string, updater: (s: Session) => Session) => {
    setSessions(prev => prev.map(s => s.id === sessionId ? updater(s) : s));
  }, []);

  useEffect(() => { if (autoConnect && onExecute) performConnect(); }, []);

  useEffect(() => {
    if (injectedCommand && connectedMode === 'live') {
      handleCommand(injectedCommand);
      updateSession(activeSessionId, s => ({ ...s, input: '' }));
      onInjectedDone?.();
    }
  }, [injectedCommand, connectedMode]);

  useEffect(() => { if (terminalRef.current) terminalRef.current.scrollTop = terminalRef.current.scrollHeight; }, [activeSession.history, aiThinking]);

  const addOutput = useCallback((sessionId: string, content: string, type: TerminalLine['type'] = 'output') => {
    updateSession(sessionId, s => ({ ...s, history: [...s.history, { type, content }] }));
  }, [updateSession]);

  const getPrompt = () => aiMode !== 'off' ? `ai@${host}:~$` : connectedMode === 'live' ? `nex@${host}:~$` : 'nex@host:~$';

  const performConnect = async () => {
    if (!onExecute) return;
    setIsConnecting(true);
    try { const r = await onExecute('hostname 2>/dev/null || echo "termux"'); setHost(r?.trim().split('\n')[0] || 'termux'); } catch { setHost('termux'); }
    setTimeout(() => { setIsConnecting(false); setConnectedMode('live'); addOutput(activeSessionId, '[LIVE] Shell bridge active. Auto -y enabled.', 'system'); }, 800);
  };

  const ghostHint = useMemo(() => {
    const input = activeSession.input;
    if (!input || input.length < 2) return null;
    for (const cmd of activeSession.commandHistory) { if (cmd.startsWith(input) && cmd !== input) return cmd.slice(input.length); }
    return null;
  }, [activeSession.input, activeSession.commandHistory]);

  const performTabCompletion = async (inputValue: string) => {
    const parts = inputValue.split(/\s+/);
    const lastPart = parts[parts.length - 1];
    if (lastPart.includes('/')) {
      const dirPath = lastPart.substring(0, lastPart.lastIndexOf('/') + 1) || './';
      const prefix = lastPart.substring(lastPart.lastIndexOf('/') + 1);
      try {
        const res = await fetch('/api/fs/list', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ dirPath }) });
        const data = await res.json();
        if (data.items) {
          const matches = data.items.filter((i: any) => i.name.startsWith(prefix)).map((i: any) => i.name);
          if (matches.length === 1) { parts[parts.length - 1] = dirPath + matches[0]; return parts.join(' '); }
          else if (matches.length > 1) { setTabCompletions(matches); return null; }
        }
      } catch { /* ignore */ }
    }
    const allCompletions = [...BUILTIN_COMMANDS];
    const inputLower = inputValue.toLowerCase();
    const matches = allCompletions.filter(c => c.startsWith(inputLower));
    if (matches.length === 1) { setTabCompletions([]); return matches[0] + ' '; }
    else if (matches.length > 1) { setTabCompletions(matches); let common = matches[0]; for (const m of matches) { while (!m.startsWith(common)) common = common.slice(0, -1); } return common; }
    setTabCompletions([]);
    return null;
  };

  const runAiAgent = useCallback(async (userQuery: string, mode: AIMode) => {
    const sid = activeSessionId;
    if (!onExecute) { addOutput(sid, 'AI needs live connection.', 'error'); return; }
    if (aiThinking) { addOutput(sid, 'AI still processing...', 'error'); return; }
    setAiThinking(true);
    abortRef.current = false;
    const systemPrompt = mode === 'agent' ? AGENT_SYSTEM_PROMPT : TERMINAL_SYSTEM_PROMPT;
    const newSession = [...aiSession, { role: 'user', content: userQuery }];
    const maxIterations = mode === 'agent' ? 5 : 1;
    let iterations = 0;
    let lastExecResult = '';

    while (iterations < maxIterations && !abortRef.current) {
      iterations++;
      const apiMessages: Array<{role: string; content: string}> = [{ role: 'system', content: systemPrompt }];
      apiMessages.push(...newSession.slice(-6));
      if (lastExecResult) apiMessages.push({ role: 'user', content: `[EXEC RESULT]\n${lastExecResult}\n\n${mode === 'agent' ? 'Analyze. Fix errors if any.' : 'Results above.'}` });

      addOutput(sid, iterations === 1 ? `[AI ${mode === 'agent' ? 'AGENT' : 'AUTO'}] Processing...` : `[AI FIX] Iteration ${iterations}...`, 'system');

      try {
        const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: apiMessages }) });
        const data = await res.json();
        if (data.error) { addOutput(sid, `AI Error: ${data.error}`, 'error'); break; }

        const aiContent = data.content || 'No response.';
        const textPart = stripCodeBlocks(aiContent);
        const codeBlocks = extractBashBlocks(aiContent);
        if (textPart) addOutput(sid, textPart);
        newSession.push({ role: 'assistant', content: aiContent });

        if (codeBlocks.length > 0) {
          let execOutputs: string[] = [];
          let hasError = false;
          for (const code of codeBlocks) {
            if (abortRef.current) break;
            addOutput(sid, `$ ${code.split('\n')[0]}${code.includes('\n') ? '...' : ''}`, 'input');
            setIsExecuting(true);
            const start = Date.now();
            const result = await onExecute(code, 60000);
            setIsExecuting(false);
            const success = !result?.startsWith('ERROR') && !result?.startsWith('TIMEOUT');
            if (result) addOutput(sid, result.length > 800 ? result.slice(0, 800) + '\n...(truncated)' : result);
            if (!success) hasError = true;
            execOutputs.push(`--- Command ---\n${code.slice(0, 200)}\n--- Output ---\n${result || '(no output)'}\nStatus: ${success ? 'OK' : 'FAILED'}`);
            setAiExecCount(prev => prev + 1);
          }
          lastExecResult = execOutputs.join('\n\n');
          const okCount = execOutputs.filter(o => o.includes('Status: OK')).length;
          addOutput(sid, `[EXEC] ${okCount}/${codeBlocks.length} succeeded`, okCount === codeBlocks.length ? 'system' : 'error');
          if (mode === 'agent' && hasError && iterations < maxIterations) continue;
        } else { if (!textPart) addOutput(sid, aiContent); }
        break;
      } catch (err: any) { addOutput(sid, `AI connection failed: ${err.message || 'Unknown'}`, 'error'); break; }
    }
    setAiSession(newSession.slice(-10));
    setAiThinking(false);
  }, [onExecute, aiSession, aiThinking, addOutput, activeSessionId]);

  const handleCommand = async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;
    const sid = activeSessionId;
    addOutput(sid, `${getPrompt()} ${trimmed}`, 'input');
    updateSession(sid, s => ({ ...s, commandHistory: [trimmed, ...s.commandHistory], historyIndex: -1 }));
    setTabCompletions([]);

    const args = trimmed.split(/\s+/);
    const command = args[0].toLowerCase();
    const rest = args.slice(1).join(' ');

    if (command === 'ai:' || command === 'ai') {
      if (command === 'ai:' && (!rest || rest === 'on' || rest === 'auto')) {
        setAiMode('auto'); addOutput(sid, '[AI] AUTO mode ON. "ai:off" to exit.', 'system'); return;
      } else if (command === 'ai:' && rest === 'agent') {
        setAiMode('agent'); addOutput(sid, '[AI] AGENT mode ON. "ai:off" to exit.', 'system'); return;
      } else if (command === 'ai:' && rest === 'off') {
        setAiMode('off'); setAiSession([]); addOutput(sid, '[AI] Mode OFF.', 'system'); return;
      } else if (command === 'ai' && rest) {
        addOutput(sid, '[AI] Thinking...', 'system');
        try {
          const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: [{ role: 'system', content: 'Be concise — this is a terminal. Under 5 lines.' }, { role: 'user', content: rest }] }) });
          const data = await res.json();
          addOutput(sid, data.error ? `AI Error: ${data.error}` : (data.content || 'No response.'));
        } catch { addOutput(sid, 'AI offline.', 'error'); }
        return;
      }
      addOutput(sid, 'AI modes: ai:auto | ai:agent | ai:off | ai [question]', 'system'); return;
    }

    if (command === 'bm') {
      if (rest === 'list') { addOutput(sid, bookmarks.length === 0 ? 'No bookmarks.' : `BOOKMARKS:\n${bookmarks.map((b, i) => `  ${i + 1}. ${b}`).join('\n')}`, 'system'); return; }
      if (rest === 'clear') { setBookmarks([]); localStorage.removeItem('nexai-terminal-bookmarks'); addOutput(sid, 'Bookmarks cleared.', 'system'); return; }
      if (!rest) { addOutput(sid, 'Usage: bm <cmd> | bm list | bm clear', 'error'); return; }
      const nb = [...new Set([...bookmarks, rest])].slice(0, 50);
      setBookmarks(nb); localStorage.setItem('nexai-terminal-bookmarks', JSON.stringify(nb));
      addOutput(sid, `Bookmarked: ${rest}`, 'system'); return;
    }

    if (command === 'session') {
      if (rest === 'new') {
        const id = `session-${Date.now()}`;
        setSessions(prev => [...prev, { id, name: `Shell ${prev.length + 1}`, history: [{ type: 'system', content: 'New session' }], commandHistory: [], input: '', historyIndex: -1 }]);
        setActiveSessionId(id); return;
      }
      addOutput(sid, `Sessions: ${sessions.map(s => s.name).join(', ')}`, 'system'); return;
    }

    if (aiMode !== 'off') { await runAiAgent(trimmed, aiMode); return; }

    switch (command) {
      case 'help':
        addOutput(sid, `Nex.AI v1.0 COMMANDS:\n  help, clear, neofetch, tools, sysmon\n  ai:auto, ai:agent, ai:off, ai [query]\n  bm <cmd>, bm list, bm clear\n  session new\n\nAll other commands execute on live shell`);
        return;
      case 'clear': updateSession(sid, s => ({ ...s, history: [] })); return;
      case 'neofetch':
        if (connectedMode === 'live' && onExecute) { const r = await onExecute('echo "OS: $(uname -s)" && echo "Kernel: $(uname -r)" && echo "Arch: $(uname -m)" && echo "User: $(whoami)"'); addOutput(sid, r || ''); }
        else addOutput(sid, 'Nex.AI v1.0\n30 Features | AI Agent | Multi-Session');
        return;
      case 'tools': addOutput(sid, '60+ HACKING TOOLS: Recon | Scanning | Web | Wireless | Password | Exploitation | Forensics\nUse TOOLS tab to browse.'); return;
      case 'sysmon':
        if (connectedMode === 'live' && onExecute) { const r = await onExecute('echo "=== CPU ===" && nproc && echo "=== MEMORY ===" && free -h 2>/dev/null && echo "=== DISK ===" && df -h / 2>/dev/null'); addOutput(sid, r || ''); }
        else addOutput(sid, 'Requires live connection.', 'error');
        return;
    }

    if (connectedMode === 'live' && onExecute) {
      setIsExecuting(true);
      try { const r = await onExecute(trimmed); if (r) addOutput(sid, r); }
      catch (err: any) { addOutput(sid, `Error: ${err.message}`, 'error'); }
      finally { setIsExecuting(false); }
      return;
    }
    addOutput(sid, `Not found: ${command}. Type "help".`, 'error');
  };

  const handleKeyDown = async (e: React.KeyboardEvent) => {
    const sid = activeSessionId;
    if (e.key === 'Enter') { setTabCompletions([]); handleCommand(activeSession.input); updateSession(sid, s => ({ ...s, input: '' })); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); const next = activeSession.historyIndex + 1; if (next < activeSession.commandHistory.length) { updateSession(sid, s => ({ ...s, historyIndex: next, input: s.commandHistory[next] })); setTabCompletions([]); } }
    else if (e.key === 'ArrowDown') { e.preventDefault(); const next = activeSession.historyIndex - 1; if (next >= 0) updateSession(sid, s => ({ ...s, historyIndex: next, input: s.commandHistory[next] })); else updateSession(sid, s => ({ ...s, historyIndex: -1, input: '' })); setTabCompletions([]); }
    else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); updateSession(sid, s => ({ ...s, history: [] })); }
    else if (e.key === 'Tab') { e.preventDefault(); const c = await performTabCompletion(activeSession.input); if (c !== null) updateSession(sid, s => ({ ...s, input: c })); }
    else if (e.key === 'Escape') setTabCompletions([]);
  };

  const setInputValue = (value: string) => { updateSession(activeSessionId, s => ({ ...s, input: value })); setTabCompletions([]); };

  const createSession = () => {
    const id = `session-${Date.now()}`;
    setSessions(prev => [...prev, { id, name: `Shell ${prev.length + 1}`, history: [{ type: 'system', content: 'New session' }], commandHistory: [], input: '', historyIndex: -1 }]);
    setActiveSessionId(id);
  };

  const removeSession = (id: string) => {
    if (sessions.length <= 1) return;
    const filtered = sessions.filter(s => s.id !== id);
    setSessions(filtered);
    if (activeSessionId === id) setActiveSessionId(filtered[0].id);
  };

  const modeLabel = aiMode === 'agent' ? 'AGENT' : aiMode === 'auto' ? 'AUTO' : null;

  return (
    <div className="flex flex-col h-full bg-[#050505] text-accent font-mono relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.2)_50%)] bg-[length:100%_2px] z-50 opacity-[0.03]"></div>

      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-black border-b border-zinc-900 shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <TerminalIcon size={14} className={connectedMode === 'live' ? "text-accent animate-pulse" : "text-zinc-700"} />
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 shrink-0">{connectedMode === 'live' ? 'LIVE' : (isConnecting ? 'CONNECTING...' : 'VIRTUAL')}</span>
          {connectedMode === 'live' && <div className="flex items-center gap-1 px-1.5 py-0.5 bg-accent/10 border border-accent/30 text-accent shrink-0"><div className="w-1 h-1 rounded-full bg-accent animate-pulse"></div><span className="text-[7px] font-black">LIVE</span></div>}
          {modeLabel && (
            <button onClick={() => { setAiMode('off'); setAiSession([]); addOutput(activeSessionId, '[AI] Mode OFF.', 'system'); }}
              className="flex items-center gap-1 px-1.5 py-0.5 bg-accent/10 border border-accent/30 hover:bg-red-500/10 hover:border-red-500/30 transition-colors cursor-pointer shrink-0">
              {aiMode === 'agent' ? <Sparkles size={8} className="text-accent" /> : <Bot size={8} className="text-accent" />}
              <span className="text-[7px] font-black text-accent">{modeLabel}</span>
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest shrink-0">
          {aiExecCount > 0 && aiMode !== 'off' && <span className="text-zinc-600"><Cpu size={7} className="inline mr-0.5" />{aiExecCount}</span>}
          {(isExecuting || aiThinking) && <div className={cn("flex items-center gap-1", aiThinking ? "text-accent" : "text-accent")}><Loader2 size={10} className="animate-spin" /><span>{aiThinking ? 'AI' : 'RUN'}</span></div>}
        </div>
      </div>

      {/* Session Tabs */}
      <div className="flex items-center gap-1 px-2 py-1 bg-black/80 border-b border-zinc-900 shrink-0 overflow-x-auto no-scrollbar">
        {sessions.map(sess => (
          <div key={sess.id} className={cn("flex items-center gap-1 px-2.5 py-1 rounded-sm text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border shrink-0",
            sess.id === activeSessionId ? "bg-zinc-800 text-white border-zinc-700" : "bg-transparent text-zinc-600 border-transparent hover:text-zinc-400")}>
            <span onClick={() => setActiveSessionId(sess.id)}>{sess.name}</span>
            {sessions.length > 1 && <button onClick={(e) => { e.stopPropagation(); removeSession(sess.id); }} className="text-zinc-600 hover:text-red-400"><X size={8} /></button>}
          </div>
        ))}
        <button onClick={createSession} className="shrink-0 p-1 text-zinc-600 hover:text-accent"><Plus size={12} /></button>
        <div className="flex-1" />
        <button onClick={() => setShowBookmarks(v => !v)} className={cn("shrink-0 p-1 transition-colors flex items-center gap-1", showBookmarks ? "text-amber-400" : "text-zinc-600 hover:text-amber-400")}>
          <Star size={12} /><span className="text-[8px] font-black">{bookmarks.length}</span>
        </button>
      </div>

      {showBookmarks && (
        <div className="max-h-40 overflow-y-auto custom-scrollbar border-b border-zinc-900 bg-zinc-950 shrink-0">
          {bookmarks.length === 0 ? <div className="px-3 py-2 text-[10px] text-zinc-600">No bookmarks.</div> :
            bookmarks.map((bm, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-zinc-900 group cursor-pointer" onClick={() => { setShowBookmarks(false); handleCommand(bm); setInputValue(''); }}>
                <Bookmark size={10} className="text-amber-500 shrink-0" />
                <span className="text-[10px] text-zinc-300 flex-1 truncate font-mono">{bm}</span>
              </div>
            ))}
        </div>
      )}

      {tabCompletions.length > 0 && (
        <div className="flex flex-wrap gap-1 px-3 py-1.5 border-b border-zinc-900 bg-zinc-950 shrink-0">
          {tabCompletions.map((c, i) => (
            <button key={i} onClick={() => { setInputValue(c); setTabCompletions([]); }} className="px-2 py-0.5 bg-zinc-800 text-cyan-400 text-[10px] font-mono rounded-sm hover:bg-zinc-700">{c}</button>
          ))}
        </div>
      )}

      {/* Terminal Lines */}
      <div ref={terminalRef} className="flex-1 p-3 md:p-5 overflow-y-auto custom-scrollbar text-[11px] md:text-[12px] space-y-1 selection:bg-accent/20" onClick={() => inputRef.current?.focus()}>
        <div className="space-y-0.5">
          {activeSession.history.map((line, i) => (
            <div key={i} className={cn("whitespace-pre-wrap break-all",
              line.type === 'error' && "text-red-500",
              line.type === 'system' && "text-accent font-black uppercase italic text-[10px] py-0.5 border-b border-accent/10 mb-1.5",
              line.type === 'input' && "text-white font-black"
            )}>
              {line.type === 'output' ? colorizeOutput(line.content) : line.content}
            </div>
          ))}
          {aiThinking && <div className="flex items-center gap-2 text-accent"><Loader2 size={10} className="animate-spin" /><span className="text-[10px]">AI thinking...</span></div>}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-zinc-900 bg-black/80 safe-bottom">
        <div className="flex items-center gap-2 px-3 py-2.5 relative">
          <span className={cn("shrink-0 text-[11px] font-black", aiMode !== 'off' ? 'text-accent' : 'text-zinc-500')}>
            {aiMode !== 'off' ? (aiMode === 'agent' ? <Sparkles size={11} /> : <Bot size={11} />) : (connectedMode === 'live' ? '$' : '>')}
          </span>
          <div className="flex-1 relative">
            <input ref={inputRef} type="text" autoFocus className="bg-transparent border-none outline-none w-full text-white font-bold text-[13px] md:text-[14px] min-w-0 placeholder:text-zinc-800 relative z-10" value={activeSession.input} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} spellCheck={false}
              placeholder={aiMode !== 'off' ? `AI ${aiMode === 'agent' ? 'AGENT' : 'AUTO'}...` : (connectedMode === 'live' ? 'Enter command...' : 'connecting...')} />
            {ghostHint && <div className="absolute top-0 left-0 text-[13px] md:text-[14px] font-bold text-zinc-800 pointer-events-none whitespace-pre overflow-hidden">{activeSession.input}{ghostHint}</div>}
          </div>
          <div className={cn("w-1.5 h-5 animate-[pulse_1s_infinite] shrink-0", "bg-accent")}></div>
          {activeSession.input.trim() && (
            <>
              <button onClick={() => { const cmd = activeSession.input.trim(); const nb = bookmarks.includes(cmd) ? bookmarks.filter(b => b !== cmd) : [...bookmarks, cmd].slice(0, 50); setBookmarks(nb); localStorage.setItem('nexai-terminal-bookmarks', JSON.stringify(nb)); }}
                className={cn("p-2 rounded-sm transition-colors shrink-0", bookmarks.includes(activeSession.input.trim()) ? "text-amber-400 bg-amber-400/10" : "text-zinc-600 hover:text-amber-400")} title="Bookmark">
                <Star size={14} fill={bookmarks.includes(activeSession.input.trim()) ? 'currentColor' : 'none'} />
              </button>
              <button onClick={() => { handleCommand(activeSession.input); setInputValue(''); }} className="p-2 bg-accent text-black rounded-sm active:bg-white transition-colors shrink-0">
                <TerminalIcon size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {isConnecting && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-4 py-2 bg-accent/20 border border-accent text-accent font-black uppercase tracking-widest text-[10px] z-20 flex items-center gap-2 rounded-sm">
          <Loader2 size={12} className="animate-spin" /> Connecting...
        </div>
      )}
    </div>
  );
};
