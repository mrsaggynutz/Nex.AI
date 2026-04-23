import React, { useState, useEffect, useCallback } from 'react';
import {
  GitBranch, GitCommit, GitPullRequest, RefreshCw, Plus,
  Check, X, ChevronDown, ChevronUp, File, Folder, AlertTriangle,
  Copy, Upload, Download, Terminal as TerminalIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface GitPanelProps {
  onExecute?: (command: string, timeout?: number) => Promise<string | null>;
  onRunInTerminal?: (cmd: string) => void;
}

interface GitFile {
  file: string;
  status: string;
  staged: boolean;
}

interface GitCommit {
  hash: string;
  fullHash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

interface GitBranchItem {
  name: string;
  shortName: string;
  isCurrent: boolean;
  isRemote: boolean;
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  'M': { label: 'Modified', color: 'text-red-400', bg: 'bg-red-500/10' },
  'A': { label: 'Added', color: 'text-neon-green', bg: 'bg-neon-green/10' },
  'D': { label: 'Deleted', color: 'text-red-500', bg: 'bg-red-500/10' },
  'R': { label: 'Renamed', color: 'text-amber-400', bg: 'bg-amber-500/10' },
  'C': { label: 'Copied', color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  '?': { label: 'Untracked', color: 'text-yellow-400', bg: 'bg-yellow-500/10' },
  '!': { label: 'Ignored', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch { return iso; }
}

export const GitPanel: React.FC<GitPanelProps> = ({ onExecute, onRunInTerminal }) => {
  const [branch, setBranch] = useState<string | null>(null);
  const [files, setFiles] = useState<GitFile[]>([]);
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [branches, setBranches] = useState<GitBranchItem[]>([]);
  const [diffContent, setDiffContent] = useState<string | null>(null);
  const [diffFile, setDiffFile] = useState<string | null>(null);
  const [commitMessage, setCommitMessage] = useState('');
  const [showCommit, setShowCommit] = useState(false);
  const [showBranches, setShowBranches] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [gitError, setGitError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'log' | 'branches'>('status');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [cwd, setCwd] = useState('');

  const loadCwd = useCallback(async () => {
    if (!onExecute) return;
    const result = await onExecute('pwd');
    if (result) setCwd(result.trim());
  }, [onExecute]);

  const fetchStatus = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/git/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: cwd || undefined }),
      });
      const data = await res.json();
      if (data.error && data.error.includes('not a git')) {
        setGitError('Not a git repository');
        setBranch(null);
        setFiles([]);
        return;
      }
      setGitError(null);
      setBranch(data.branch);
      setFiles(data.files || []);
    } catch {
      setError('Failed to fetch git status');
    } finally {
      setLoading(false);
    }
  }, [cwd]);

  const fetchLog = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/git/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: cwd || undefined, count: 20 }),
      });
      const data = await res.json();
      setCommits(data.commits || []);
    } catch {
      setError('Failed to fetch git log');
    } finally {
      setLoading(false);
    }
  }, [cwd]);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/git/branch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: cwd || undefined }),
      });
      const data = await res.json();
      setBranches(data.branches || []);
    } catch {
      setError('Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  }, [cwd]);

  useEffect(() => { loadCwd(); }, [loadCwd]);

  useEffect(() => {
    if (cwd) {
      fetchStatus();
    }
  }, [cwd, fetchStatus]);

  useEffect(() => {
    if (activeTab === 'log') fetchLog();
    if (activeTab === 'branches') fetchBranches();
  }, [activeTab, fetchLog, fetchBranches]);

  const stageFiles = async (fileNames: string[], unstage: boolean = false) => {
    try {
      const res = await fetch('/api/git/stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: cwd || undefined, files: fileNames, unstage }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
        setSelectedFiles(new Set());
      } else {
        setError(data.error || 'Stage failed');
      }
    } catch {
      setError('Stage operation failed');
    }
  };

  const commit = async () => {
    if (!commitMessage.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/git/commit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: cwd || undefined, message: commitMessage.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setCommitMessage('');
        setShowCommit(false);
        fetchStatus();
        fetchLog();
      } else {
        setError(data.error || 'Commit failed');
      }
    } catch {
      setError('Commit failed');
    } finally {
      setLoading(false);
    }
  };

  const switchBranch = async (branchName: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/git/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: cwd || undefined, branch: branchName }),
      });
      const data = await res.json();
      if (data.success) {
        fetchStatus();
        setShowBranches(false);
      } else {
        setError(data.error || 'Checkout failed');
      }
    } catch {
      setError('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchDiff = async (file: string, staged: boolean = false) => {
    setLoading(true);
    try {
      const res = await fetch('/api/git/diff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cwd: cwd || undefined, file, staged }),
      });
      const data = await res.json();
      setDiffContent(data.diff || '(no diff)');
      setDiffFile(file);
      setShowDiff(true);
    } catch {
      setError('Failed to fetch diff');
    } finally {
      setLoading(false);
    }
  };

  const pushPull = (action: 'push' | 'pull') => {
    if (onRunInTerminal) {
      onRunInTerminal(`git ${action}`);
    }
  };

  const toggleFile = (file: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(file)) next.delete(file);
      else next.add(file);
      return next;
    });
  };

  const stagedCount = files.filter(f => f.staged).length;
  const unstagedCount = files.filter(f => !f.staged && f.status !== '?').length;
  const untrackedCount = files.filter(f => f.status === '?').length;

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neon-green/20 border border-neon-green/30 flex items-center justify-center">
              <GitBranch size={16} className="text-neon-green" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tighter">Git Panel</h2>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em] truncate">
                {branch ? `Branch: ${branch}` : gitError || 'Loading...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => pushPull('push')}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-neon-green transition-colors">
              <Upload size={14} />
            </button>
            <button onClick={() => pushPull('pull')}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-cyan-400 transition-colors">
              <Download size={14} />
            </button>
            <button onClick={() => { fetchStatus(); fetchLog(); }}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {gitError && (
        <div className="px-4 py-6 text-center">
          <GitBranch size={32} className="mx-auto text-zinc-700 mb-2" />
          <p className="text-[11px] text-zinc-500">{gitError}</p>
          <p className="text-[9px] text-zinc-600 mt-1">Navigate to a git repo directory and refresh</p>
          <button onClick={() => { setCwd(''); loadCwd(); }}
            className="mt-3 px-4 py-2 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase rounded-sm">
            Reload CWD
          </button>
        </div>
      )}

      {!gitError && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-zinc-900 shrink-0">
            {(['status', 'log', 'branches'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={cn("flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2",
                  activeTab === tab ? "text-accent border-accent" : "text-zinc-500 border-transparent hover:text-zinc-300"
                )}>
                {tab === 'status' && `Status (${files.length})`}
                {tab === 'log' && `Log (${commits.length})`}
                {tab === 'branches' && `Branches (${branches.length})`}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">

            {/* Status Tab */}
            {activeTab === 'status' && (
              <div className="p-3 space-y-3">
                {/* Summary */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-neon-green/5 border border-neon-green/10 rounded-sm p-2 text-center">
                    <p className="text-[16px] font-black text-neon-green">{stagedCount}</p>
                    <p className="text-[8px] font-black uppercase text-zinc-500">Staged</p>
                  </div>
                  <div className="bg-red-500/5 border border-red-500/10 rounded-sm p-2 text-center">
                    <p className="text-[16px] font-black text-red-400">{unstagedCount}</p>
                    <p className="text-[8px] font-black uppercase text-zinc-500">Modified</p>
                  </div>
                  <div className="bg-yellow-500/5 border border-yellow-500/10 rounded-sm p-2 text-center">
                    <p className="text-[16px] font-black text-yellow-400">{untrackedCount}</p>
                    <p className="text-[8px] font-black uppercase text-zinc-500">Untracked</p>
                  </div>
                </div>

                {/* Stage/Commit Actions */}
                {files.length > 0 && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => stageFiles(files.filter(f => f.status === '?' && selectedFiles.has(f.file)).map(f => f.file))}
                      disabled={selectedFiles.size === 0}
                      className="flex-1 py-2 bg-neon-green/10 border border-neon-green/20 text-neon-green text-[10px] font-black uppercase rounded-sm disabled:opacity-30 flex items-center justify-center gap-1">
                      <Plus size={12} /> Stage ({selectedFiles.size})
                    </button>
                    {stagedCount > 0 && (
                      <button onClick={() => setShowCommit(true)}
                        className="flex-1 py-2 bg-accent text-black text-[10px] font-black uppercase rounded-sm flex items-center justify-center gap-1">
                        <Check size={12} /> Commit
                      </button>
                    )}
                    {unstagedCount > 0 && (
                      <button onClick={() => stageFiles(files.filter(f => f.staged).map(f => f.file), true)}
                        className="py-2 px-3 bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-black uppercase rounded-sm">
                        Unstage
                      </button>
                    )}
                  </div>
                )}

                {/* File List */}
                {files.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-[11px]">
                    <Check size={20} className="mx-auto mb-2 text-neon-green/30" />
                    Working tree clean
                  </div>
                ) : (
                  <div className="space-y-1">
                    {files.map((f, i) => {
                      const status = STATUS_MAP[f.status] || STATUS_MAP['?'];
                      return (
                        <div key={`${f.file}-${i}`}
                          onClick={() => toggleFile(f.file)}
                          className={cn("flex items-center gap-2.5 px-3 py-2.5 rounded-sm cursor-pointer transition-colors group",
                            selectedFiles.has(f.file) ? "bg-accent/10 border border-accent/20" : "bg-zinc-900/50 border border-transparent hover:border-zinc-700"
                          )}>
                          <div className={cn("w-1 h-6 rounded-full shrink-0",
                            f.staged ? "bg-neon-green" : f.status === '?' ? "bg-yellow-400" : "bg-red-400"
                          )} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] text-zinc-300 font-medium truncate">{f.file}</p>
                          </div>
                          <span className={cn("text-[8px] font-black uppercase px-1.5 py-0.5 rounded-sm shrink-0", status.color, status.bg)}>
                            {status.label}
                          </span>
                          <button
                            onClick={(e) => { e.stopPropagation(); fetchDiff(f.file, f.staged); }}
                            className="p-1 text-zinc-600 hover:text-accent opacity-0 group-hover:opacity-100 transition-all">
                            <File size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Log Tab */}
            {activeTab === 'log' && (
              <div className="p-3 space-y-2">
                {commits.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-[11px]">No commits</div>
                ) : (
                  commits.map((c, i) => (
                    <div key={c.hash + i} className="bg-zinc-900/50 border border-zinc-800/50 rounded-sm p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded-sm">{c.hash}</span>
                        <span className="text-[9px] text-zinc-600">{formatDate(c.date)}</span>
                      </div>
                      <p className="text-[11px] text-white font-medium mb-1">{c.message}</p>
                      <p className="text-[9px] text-zinc-500">{c.author}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Branches Tab */}
            {activeTab === 'branches' && (
              <div className="p-3 space-y-1">
                <button onClick={async () => {
                  const name = prompt('New branch name:');
                  if (name && onRunInTerminal) onRunInTerminal(`git checkout -b ${name}`);
                }}
                  className="w-full flex items-center gap-2 px-3 py-2.5 bg-accent/10 border border-accent/20 rounded-sm text-accent text-[10px] font-black uppercase mb-2">
                  <Plus size={14} /> New Branch
                </button>
                {branches.length === 0 ? (
                  <div className="text-center py-8 text-zinc-600 text-[11px]">No branches</div>
                ) : (
                  branches.map((b, i) => (
                    <button key={`${b.name}-${i}`}
                      onClick={() => !b.isCurrent && switchBranch(b.name)}
                      className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 rounded-sm transition-colors text-left",
                        b.isCurrent ? "bg-neon-green/10 border border-neon-green/20" : "bg-zinc-900/50 border border-transparent hover:border-zinc-700"
                      )}>
                      <GitBranch size={14} className={b.isCurrent ? "text-neon-green" : "text-zinc-500"} />
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[11px] font-medium truncate",
                          b.isCurrent ? "text-neon-green" : b.isRemote ? "text-zinc-400" : "text-zinc-300"
                        )}>{b.shortName || b.name}</p>
                      </div>
                      {b.isCurrent && (
                        <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-neon-green text-black rounded-sm">Active</span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Error */}
      {error && (
        <div className="px-3 py-1.5 bg-red-500/10 border-t border-red-500/20 text-[10px] text-red-400 flex items-center justify-between shrink-0">
          <span className="truncate">{error}</span>
          <button onClick={() => setError('')}><X size={12} /></button>
        </div>
      )}

      {/* Commit Modal */}
      {showCommit && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-md bg-surface border border-zinc-800 rounded-t-lg sm:rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[12px] font-black text-white uppercase">Commit ({stagedCount} staged)</h3>
              <button onClick={() => setShowCommit(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
            </div>
            <textarea
              value={commitMessage}
              onChange={e => setCommitMessage(e.target.value)}
              placeholder="Commit message..."
              className="w-full bg-black border border-zinc-700 rounded-sm px-3 py-2 text-[12px] text-white outline-none focus:border-accent mb-3 resize-none h-20 placeholder:text-zinc-600"
              autoFocus
            />
            <button onClick={commit} disabled={loading || !commitMessage.trim()}
              className="w-full py-2.5 bg-accent text-black text-[10px] font-black uppercase rounded-sm disabled:opacity-50 flex items-center justify-center gap-1">
              <Check size={14} /> Commit
            </button>
          </div>
        </div>
      )}

      {/* Diff Modal */}
      {showDiff && diffContent && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg max-h-[80vh] bg-surface border border-zinc-800 rounded-t-lg sm:rounded-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <span className="text-[11px] font-bold text-white">Diff: {diffFile}</span>
              <button onClick={() => setShowDiff(false)} className="text-zinc-500 hover:text-white"><X size={16} /></button>
            </div>
            <pre className="flex-1 p-4 overflow-auto custom-scrollbar text-[10px] font-mono text-zinc-300 whitespace-pre-wrap break-all">
              {diffContent.split('\n').map((line, i) => (
                <div key={i} className={cn(
                  line.startsWith('+') && !line.startsWith('+++') && "text-neon-green bg-neon-green/5",
                  line.startsWith('-') && !line.startsWith('---') && "text-red-400 bg-red-500/5",
                  line.startsWith('@@') && "text-cyan-400 font-bold"
                )}>{line}</div>
              ))}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
