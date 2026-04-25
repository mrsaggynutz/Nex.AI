import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Cpu, Activity, Wifi, HardDrive, Terminal, Shield, Zap,
  Radio, Orbit, Database, Thermometer, MemoryStick, Server,
  ChevronDown, ChevronUp, X, Plus, Play, Pause, AlertTriangle,
  RefreshCw, Globe, Fingerprint, Network
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ExecuteFn } from '../types';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

interface TelemetryData {
  cpu: number;
  memory: { used: number; total: number; percent: number };
  disk: { used: number; total: number; percent: number };
  processes: number;
  uptime: number;
  hostname: string;
  arch: string;
  platform: string;
  thermal?: number;
  battery?: { level: number; charging: boolean };
  network?: { interface: string; ip: string; rx: number; tx: number };
  loadAvg?: number[];
}

interface ActiveTask {
  id: string;
  name: string;
  status: 'staged' | 'active' | 'running' | 'pending' | 'complete' | 'error';
  category: string;
  startedAt?: number;
  progress?: number;
}

interface SentinelXOverlayProps {
  onExecuteCommand: (cmd: string) => Promise<string | null>;
  onRunInTerminal: (cmd: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const ACCENT = '#39FF14';
const ORANGE = '#FF5F1F';
const CYAN = '#00D4FF';
const AMBER = '#FFB800';
const RED = '#FF3B3B';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/20 text-emerald-400 animate-pulse',
  running: 'bg-cyan-500/20 text-cyan-400 animate-pulse',
  staged: 'bg-amber-500/20 text-amber-400',
  pending: 'bg-zinc-700/40 text-zinc-500',
  complete: 'bg-emerald-500/20 text-emerald-400',
  error: 'bg-red-500/20 text-red-400',
};

const CATEGORY_COLORS: Record<string, string> = {
  recon: 'text-cyan-400',
  exploit: 'text-red-400',
  privesc: 'text-amber-400',
  wireless: 'text-green-400',
  osint: 'text-blue-400',
  crypto: 'text-yellow-400',
  network: 'text-emerald-400',
  utility: 'text-zinc-400',
  payload: 'text-rose-400',
};

const TASKS_KEY = 'sentinel-active-tasks';
const MINI_CMD_KEY = 'sentinel-mini-cmds';

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */

function loadTasks(): ActiveTask[] {
  try { return JSON.parse(localStorage.getItem(TASKS_KEY) || '[]'); } catch { return []; }
}
function saveTasks(tasks: ActiveTask[]) {
  try { localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); } catch { /* */ }
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)}KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)}MB`;
  return `${(bytes / 1073741824).toFixed(1)}GB`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function clampColor(val: number): string {
  if (val < 40) return 'text-emerald-400';
  if (val < 60) return 'text-cyan-400';
  if (val < 75) return 'text-amber-400';
  return 'text-red-400';
}

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export const SentinelXOverlay: React.FC<SentinelXOverlayProps> = ({ onExecuteCommand, onRunInTerminal }) => {
  const [telemetry, setTelemetry] = useState<TelemetryData | null>(null);
  const [tasks, setTasks] = useState<ActiveTask[]>(loadTasks);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCat, setNewTaskCat] = useState('recon');
  const [miniTermInput, setMiniTermInput] = useState('');
  const [miniTermHistory, setMiniTermHistory] = useState<Array<{ cmd: string; out: string }>>(() => {
    try { return JSON.parse(localStorage.getItem(MINI_CMD_KEY) || '[]'); } catch { return []; }
  });
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [refreshMs, setRefreshMs] = useState(5000);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const miniTermRef = useRef<HTMLDivElement>(null);

  /* ── Telemetry polling ── */
  const fetchTelemetry = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/sentinel/telemetry');
      const data = await res.json();
      setTelemetry(data);
    } catch { /* silent fail */ }
    setIsRefreshing(false);
  }, []);

  useEffect(() => { fetchTelemetry(); }, [fetchTelemetry]);

  useEffect(() => {
    const id = setInterval(fetchTelemetry, refreshMs);
    return () => clearInterval(id);
  }, [fetchTelemetry, refreshMs]);

  /* ── Persist tasks ── */
  useEffect(() => { saveTasks(tasks); }, [tasks]);

  /* ── Persist mini-term ── */
  useEffect(() => {
    try { localStorage.setItem(MINI_CMD_KEY, JSON.stringify(miniTermHistory.slice(-50))); } catch { /* */ }
  }, [miniTermHistory]);

  /* ── Auto-scroll mini terminal ── */
  useEffect(() => {
    if (miniTermRef.current) miniTermRef.current.scrollTop = miniTermRef.current.scrollHeight;
  }, [miniTermHistory]);

  /* ── Task management ── */
  const addTask = () => {
    if (!newTaskName.trim()) return;
    const task: ActiveTask = {
      id: `task-${Date.now()}`,
      name: newTaskName.trim().toUpperCase().replace(/\s+/g, '-'),
      status: 'staged',
      category: newTaskCat,
      startedAt: Date.now(),
    };
    setTasks(prev => [task, ...prev]);
    setNewTaskName('');
    setShowAddTask(false);
  };

  const cycleStatus = (id: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t;
      const flow: ActiveTask['status'][] = ['staged', 'active', 'running', 'complete'];
      const idx = flow.indexOf(t.status);
      const next = flow[(idx + 1) % flow.length] || 'staged';
      return { ...t, status: next, ...(next === 'active' ? { startedAt: Date.now() } : {}) };
    }));
  };

  const removeTask = (id: string) => setTasks(prev => prev.filter(t => t.id !== id));

  /* ── Mini terminal ── */
  const execMiniCmd = async () => {
    const cmd = miniTermInput.trim();
    if (!cmd) return;
    setMiniTermInput('');
    setMiniTermHistory(prev => [...prev, { cmd, out: 'Running...' }]);
    const idx = miniTermHistory.length;
    try {
      const result = await onExecuteCommand(cmd);
      const output = result || 'Done.';
      setMiniTermHistory(prev => prev.map((h, i) => i === idx ? { cmd, out: output.length > 500 ? output.slice(0, 500) + '...' : output } : h));
    } catch (err: any) {
      setMiniTermHistory(prev => prev.map((h, i) => i === idx ? { cmd, out: `Error: ${err.message}` } : h));
    }
  };

  /* ── Telemetry bars config ── */
  const bars = telemetry ? [
    { label: 'CPU', val: telemetry.cpu, icon: <Cpu size={11} />, color: telemetry.cpu > 75 ? 'bg-red-500' : telemetry.cpu > 50 ? 'bg-amber-500' : 'bg-emerald-500' },
    { label: 'MEMORY', val: telemetry.memory.percent, icon: <MemoryStick size={11} />, color: telemetry.memory.percent > 80 ? 'bg-red-500' : telemetry.memory.percent > 60 ? 'bg-amber-500' : 'bg-cyan-500' },
    { label: 'DISK', val: telemetry.disk.percent, icon: <HardDrive size={11} />, color: telemetry.disk.percent > 85 ? 'bg-red-500' : telemetry.disk.percent > 70 ? 'bg-amber-500' : 'bg-violet-500' },
    ...(telemetry.thermal !== undefined ? [{ label: 'THERMAL', val: telemetry.thermal, icon: <Thermometer size={11} />, color: telemetry.thermal > 70 ? 'bg-red-500' : telemetry.thermal > 50 ? 'bg-amber-500' : 'bg-emerald-500' }] : []),
  ] : [];

  const activeTasksCount = tasks.filter(t => t.status === 'active' || t.status === 'running').length;

  return (
    <div className="h-full w-full bg-[#020202] text-emerald-500 font-mono flex flex-col overflow-hidden">

      {/* ── HEADER BAR ── */}
      <div className="shrink-0 bg-black border-b border-emerald-500/20 px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">
            SENTINEL-X // {telemetry?.hostname || 'CONNECTING'}
          </span>
          <span className="text-[8px] text-zinc-600 font-bold">
            {telemetry?.arch || ''} | {telemetry?.platform || ''}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {telemetry && (
            <div className="flex items-center gap-3 text-[8px] font-bold">
              <span className="text-zinc-500">UP <span className="text-emerald-400">{formatUptime(telemetry.uptime)}</span></span>
              <span className="text-zinc-500">PID <span className="text-cyan-400">{telemetry.processes}</span></span>
              {telemetry.battery && (
                <span className="text-zinc-500">BAT <span className={telemetry.battery.charging ? 'text-emerald-400' : 'text-amber-400'}>{telemetry.battery.level}%</span></span>
              )}
            </div>
          )}
          <div className="flex items-center gap-1 bg-zinc-900/50 border border-zinc-800 rounded-sm">
            <button onClick={() => setRefreshMs(v => v === 5000 ? 2000 : v === 2000 ? 1000 : 5000)}
              className="px-1.5 py-0.5 text-[8px] text-zinc-500 hover:text-emerald-400 transition-colors font-bold">
              {refreshMs / 1000}s
            </button>
            <button onClick={fetchTelemetry} className={cn("px-1.5 py-0.5 text-zinc-500 hover:text-emerald-400 transition-colors", isRefreshing && "animate-spin")}>
              <RefreshCw size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* ── MAIN GRID ── */}
      <div className="flex-1 overflow-hidden grid grid-cols-12 gap-0">

        {/* ═══════ LEFT PANEL ═══════ */}
        <AnimatePresence mode="wait">
          {!leftCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="col-span-12 lg:col-span-3 overflow-y-auto custom-scrollbar border-r border-emerald-500/10"
            >
              <div className="p-3 space-y-3">

                {/* A. CORE TELEMETRY */}
                <div className="bg-zinc-900/40 border border-emerald-500/20 p-3 rounded-sm">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 text-emerald-300">
                    <Cpu size={12} className="animate-pulse" /> Core Telemetry
                  </h3>
                  <div className="space-y-2.5">
                    {bars.map(bar => (
                      <div key={bar.label} className="space-y-1">
                        <div className="flex justify-between items-center text-[8px] font-bold">
                          <span className="text-zinc-500 flex items-center gap-1.5">
                            {bar.icon} {bar.label}
                          </span>
                          <span className={clampColor(bar.val)}>{Math.round(bar.val)}%</span>
                        </div>
                        <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full", bar.color)}
                            initial={{ width: 0 }}
                            animate={{ width: `${bar.val}%` }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Memory + Disk detail */}
                  {telemetry && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-1">
                      <div className="flex justify-between text-[7px] font-bold">
                        <span className="text-zinc-600">MEM</span>
                        <span className="text-zinc-400">{formatBytes(telemetry.memory.used)} / {formatBytes(telemetry.memory.total)}</span>
                      </div>
                      <div className="flex justify-between text-[7px] font-bold">
                        <span className="text-zinc-600">DISK</span>
                        <span className="text-zinc-400">{formatBytes(telemetry.disk.used)} / {formatBytes(telemetry.disk.total)}</span>
                      </div>
                      {telemetry.network && (
                        <div className="flex justify-between text-[7px] font-bold">
                          <span className="text-zinc-600">NET</span>
                          <span className="text-zinc-400">
                            <span className="text-cyan-500">↓{formatBytes(telemetry.network.rx)}</span>
                            {' / '}
                            <span className="text-violet-500">↑{formatBytes(telemetry.network.tx)}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* B. ACTIVE TASKS / PAYLOADS */}
                <div className="bg-zinc-900/40 border border-emerald-500/20 p-3 rounded-sm">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-emerald-300">
                      <Zap size={12} /> Active Tasks
                    </h3>
                    <div className="flex items-center gap-1">
                      {activeTasksCount > 0 && (
                        <span className="text-[7px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded-xs font-black animate-pulse">
                          {activeTasksCount} LIVE
                        </span>
                      )}
                      <button onClick={() => setShowAddTask(true)}
                        className="p-1 text-zinc-600 hover:text-emerald-400 transition-colors">
                        <Plus size={10} />
                      </button>
                    </div>
                  </div>

                  <AnimatePresence>
                    {showAddTask && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                        className="mb-2 overflow-hidden"
                      >
                        <div className="bg-black/60 border border-zinc-800 rounded-sm p-2 space-y-2">
                          <input
                            type="text" autoFocus value={newTaskName}
                            onChange={e => setNewTaskName(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addTask()}
                            placeholder="task-name"
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-sm px-2 py-1 text-[10px] text-white font-mono placeholder:text-zinc-700 outline-none focus:border-emerald-500/50"
                          />
                          <div className="flex gap-1">
                            {['recon', 'exploit', 'privesc', 'wireless', 'osint', 'network', 'payload'].map(cat => (
                              <button key={cat} onClick={() => setNewTaskCat(cat)}
                                className={cn("px-1.5 py-0.5 text-[7px] font-black uppercase rounded-xs border transition-colors",
                                  newTaskCat === cat ? "border-emerald-500/50 text-emerald-400 bg-emerald-500/10" : "border-zinc-800 text-zinc-600 hover:text-zinc-400")}>
                                {cat}
                              </button>
                            ))}
                          </div>
                          <div className="flex gap-1">
                            <button onClick={addTask} className="flex-1 bg-emerald-500/20 text-emerald-400 text-[8px] font-black py-1 rounded-sm hover:bg-emerald-500/30 transition-colors">
                              ADD TASK
                            </button>
                            <button onClick={() => setShowAddTask(false)} className="text-zinc-600 hover:text-white">
                              <X size={10} />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar">
                    {tasks.length === 0 && (
                      <div className="text-center py-4 text-[9px] text-zinc-700 font-bold">
                        No active tasks. Add one above.
                      </div>
                    )}
                    {tasks.map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}
                        className="flex items-center justify-between p-2 bg-black/40 border border-white/5 rounded-sm group"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1" onClick={() => cycleStatus(task.id)}>
                          <div className={cn("w-1 h-6 rounded-full shrink-0 transition-colors",
                            task.status === 'running' ? 'bg-cyan-500 animate-pulse' :
                            task.status === 'active' ? 'bg-emerald-500 animate-pulse' :
                            task.status === 'complete' ? 'bg-emerald-500' :
                            task.status === 'error' ? 'bg-red-500' :
                            task.status === 'staged' ? 'bg-amber-500' : 'bg-zinc-700'
                          )} />
                          <div className="min-w-0">
                            <span className="text-[9px] font-black truncate block text-zinc-200">{task.name}</span>
                            <span className={cn("text-[7px] font-bold uppercase", CATEGORY_COLORS[task.category] || 'text-zinc-600')}>
                              {task.category}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className={cn("text-[7px] uppercase px-1.5 py-0.5 rounded-xs font-black", STATUS_STYLES[task.status])}>
                            {task.status}
                          </span>
                          <button onClick={() => removeTask(task.id)}
                            className="p-0.5 text-zinc-700 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                            <X size={8} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* C. QUICK ACTIONS */}
                <div className="bg-zinc-900/40 border border-emerald-500/20 p-3 rounded-sm">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 text-emerald-300">
                    <Activity size={12} /> Quick Actions
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'SYSMON', cmd: 'echo "=== CPU ===" && nproc && echo "=== MEM ===" && free -h && echo "=== DISK ===" && df -h /', icon: <Activity size={10} /> },
                      { label: 'IFCONFIG', cmd: 'ifconfig 2>/dev/null || ip addr 2>/dev/null', icon: <Network size={10} /> },
                      { label: 'BATTERY', cmd: 'termux-battery-status 2>/dev/null || cat /sys/class/power_supply/battery/capacity 2>/dev/null', icon: <Zap size={10} /> },
                      { label: 'WHOAMI', cmd: 'whoami && uname -a', icon: <Fingerprint size={10} /> },
                      { label: 'PORTS', cmd: 'ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null', icon: <Globe size={10} /> },
                      { label: 'PS TOP', cmd: 'ps aux --sort=-%mem 2>/dev/null | head -10 || ps -ef | head -10', icon: <Server size={10} /> },
                    ].map(action => (
                      <button key={action.label}
                        onClick={() => onRunInTerminal(action.cmd)}
                        className="flex items-center gap-1.5 px-2 py-2 bg-black/30 border border-white/5 rounded-sm text-[8px] font-black text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 transition-all"
                      >
                        {action.icon}
                        {action.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle for left panel */}
        <button
          onClick={() => setLeftCollapsed(!leftCollapsed)}
          className="hidden lg:flex items-center justify-center w-4 bg-black border-r border-emerald-500/10 text-zinc-700 hover:text-emerald-400 transition-colors shrink-0"
        >
          {leftCollapsed ? <ChevronRight size={10} /> : <ChevronLeft size={10} />}
        </button>

        {/* ═══════ CENTER — OMNI TERMINAL ═══════ */}
        <div className="col-span-12 lg:col-span-6 flex flex-col overflow-hidden border-r border-emerald-500/10">

          {/* Terminal header */}
          <div className="shrink-0 bg-black border-b border-emerald-500/30 flex items-center justify-between px-3 py-1.5">
            <div className="flex items-center gap-2">
              <Terminal size={10} className="text-emerald-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-400">
                NEX.AI_ROOT@SENTINEL-X
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/50" />
              <div className="w-2 h-2 rounded-full bg-amber-500/50" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/50" />
            </div>
          </div>

          {/* Mini terminal output */}
          <div ref={miniTermRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1 text-[11px] font-mono bg-black">
            {miniTermHistory.length === 0 && (
              <div className="text-zinc-800 text-[10px]">
                <div className="text-emerald-500/40 text-[9px] font-black uppercase tracking-widest mb-2">
                  SENTINEL-X MINI TERMINAL
                </div>
                <div>Quick commands appear here. Type below and press Enter.</div>
                <div className="text-zinc-800 mt-1">Use Quick Actions panel or type your own commands.</div>
              </div>
            )}
            {miniTermHistory.map((entry, i) => (
              <div key={i} className="space-y-0.5">
                <div className="text-emerald-400 font-black text-[10px]">
                  <span className="text-zinc-600">sentinel</span>$ {entry.cmd}
                </div>
                <pre className="text-zinc-400 text-[10px] whitespace-pre-wrap break-all leading-relaxed max-h-40 overflow-y-auto">
                  {entry.out}
                </pre>
              </div>
            ))}
          </div>

          {/* Mini terminal input */}
          <div className="shrink-0 border-t border-emerald-500/20 bg-black px-3 py-2 flex items-center gap-2">
            <span className="text-[10px] text-emerald-500 font-black">$</span>
            <input
              type="text" value={miniTermInput}
              onChange={e => setMiniTermInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && execMiniCmd()}
              placeholder="execute command..."
              className="flex-1 bg-transparent text-[11px] text-white font-mono outline-none placeholder:text-zinc-800 min-w-0"
              spellCheck={false}
            />
            <button onClick={execMiniCmd} className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-sm hover:bg-emerald-500/30 transition-colors">
              <Play size={12} />
            </button>
          </div>
        </div>

        {/* ═══════ RIGHT PANEL ═══════ */}
        <AnimatePresence mode="wait">
          {!rightCollapsed && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="col-span-12 lg:col-span-3 overflow-y-auto custom-scrollbar"
            >
              <div className="p-3 space-y-3">

                {/* D. SYSTEM STATUS GRID */}
                <div className="bg-zinc-900/40 border border-emerald-500/20 p-3 rounded-sm">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 text-emerald-300">
                    <Shield size={12} /> System Status
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {telemetry ? [
                      { label: 'HOST', val: telemetry.hostname, color: 'text-emerald-400' },
                      { label: 'ARCH', val: telemetry.arch, color: 'text-cyan-400' },
                      { label: 'PLATFORM', val: telemetry.platform, color: 'text-zinc-400' },
                      { label: 'PROCESSES', val: String(telemetry.processes), color: 'text-amber-400' },
                      { label: 'UPTIME', val: formatUptime(telemetry.uptime), color: 'text-emerald-400' },
                      { label: 'LOAD AVG', val: telemetry.loadAvg ? telemetry.loadAvg.slice(0, 2).map(v => v.toFixed(1)).join(' / ') : 'N/A', color: 'text-violet-400' },
                    ].map(item => (
                      <div key={item.label} className="bg-black/30 border border-white/5 rounded-sm p-2">
                        <div className="text-[7px] font-black text-zinc-600 uppercase">{item.label}</div>
                        <div className={cn("text-[10px] font-black truncate", item.color)}>{item.val}</div>
                      </div>
                    )) : (
                      <div className="col-span-2 text-center py-6 text-[10px] text-zinc-700">Loading...</div>
                    )}
                  </div>
                </div>

                {/* E. TASK STATS */}
                <div className="bg-zinc-900/40 border border-emerald-500/20 p-3 rounded-sm">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 text-emerald-300">
                    <Database size={12} /> Mission Stats
                  </h3>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'TOTAL', val: tasks.length, color: 'text-zinc-400' },
                      { label: 'ACTIVE', val: activeTasksCount, color: 'text-emerald-400' },
                      { label: 'DONE', val: tasks.filter(t => t.status === 'complete').length, color: 'text-cyan-400' },
                    ].map(stat => (
                      <div key={stat.label} className="text-center bg-black/30 border border-white/5 rounded-sm p-2">
                        <div className={cn("text-lg font-black leading-none", stat.color)}>{stat.val}</div>
                        <div className="text-[6px] font-black text-zinc-600 uppercase mt-1">{stat.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* F. NETWORK ENTITIES (Simulated Mesh) */}
                <div className="bg-zinc-900/40 border border-emerald-500/20 p-3 rounded-sm">
                  <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 text-emerald-300">
                    <Radio size={12} /> Network Entities
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: telemetry?.hostname?.toUpperCase() || 'LOCAL', type: 'Host', active: true },
                      { id: telemetry?.network?.interface?.toUpperCase() || 'WLAN0', type: 'Interface', active: true },
                      { id: telemetry?.network?.ip || '0.0.0.0', type: 'IP', active: true },
                      { id: '127.0.0.1', type: 'Loopback', active: true },
                    ].map(node => (
                      <div key={node.id} className={cn("p-2 border rounded-sm flex flex-col gap-1 transition-all",
                        node.active ? "border-emerald-500/30 bg-emerald-500/5" : "border-zinc-800 bg-zinc-950/50 opacity-50")}>
                        <Orbit size={12} className={node.active ? "text-emerald-500" : "text-zinc-700"} />
                        <span className="text-[8px] font-black truncate text-zinc-200">{node.id}</span>
                        <span className="text-[6px] uppercase text-zinc-600 font-bold">{node.type}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* G. BATTERY (if available) */}
                {telemetry?.battery && (
                  <div className="bg-zinc-900/40 border border-emerald-500/20 p-3 rounded-sm">
                    <h3 className="text-[9px] font-black uppercase tracking-[0.3em] mb-3 flex items-center gap-2 text-emerald-300">
                      <Zap size={12} /> Power
                    </h3>
                    <div className="space-y-2">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[8px] font-bold">
                          <span className="text-zinc-500">BATTERY</span>
                          <span className={telemetry.battery.level > 30 ? 'text-emerald-400' : 'text-red-400'}>
                            {telemetry.battery.level}%
                          </span>
                        </div>
                        <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <motion.div
                            className={cn("h-full rounded-full transition-colors",
                              telemetry.battery.level > 50 ? 'bg-emerald-500' :
                              telemetry.battery.level > 20 ? 'bg-amber-500' : 'bg-red-500')}
                            animate={{ width: `${telemetry.battery.level}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                        <div className="flex justify-between text-[7px] text-zinc-600 font-bold">
                          <span>{telemetry.battery.charging ? 'CHARGING' : 'ON BATTERY'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* H. CLEAR / RESET */}
                <div className="flex gap-2">
                  <button onClick={() => { setTasks([]); saveTasks([]); }}
                    className="flex-1 py-1.5 text-[8px] font-black uppercase border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 rounded-sm transition-colors">
                    CLEAR TASKS
                  </button>
                  <button onClick={() => { setMiniTermHistory([]); localStorage.removeItem(MINI_CMD_KEY); }}
                    className="flex-1 py-1.5 text-[8px] font-black uppercase border border-zinc-800 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700 rounded-sm transition-colors">
                    CLEAR TERM
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle for right panel */}
        <button
          onClick={() => setRightCollapsed(!rightCollapsed)}
          className="hidden lg:flex items-center justify-center w-4 bg-black border-l border-emerald-500/10 text-zinc-700 hover:text-emerald-400 transition-colors shrink-0"
        >
          {rightCollapsed ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
        </button>
      </div>
    </div>
  );
};
