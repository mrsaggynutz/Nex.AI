import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNotification } from './NotificationProvider';
import {
  Folder, File, ChevronRight, Home, Search, RefreshCw,
  Trash2, Edit3, Download, Eye, X, ArrowUp, FolderPlus,
  FolderOpen, FileText, FileCode, Image, Archive, Music,
  Film, Terminal as TerminalIcon, MoreVertical, Check
} from 'lucide-react';
import { cn } from '../lib/utils';

interface FileBrowserProps {
  onExecute?: (command: string, timeout?: number) => Promise<string | null>;
  onOpenInEditor?: (filePath: string) => void;
  onRunInTerminal?: (cmd: string) => void;
}

interface FileItem {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  permissions: string;
  modified: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  } catch { return iso; }
}

function getFileIcon(name: string, type: string) {
  if (type === 'directory') return <Folder size={18} className="text-amber-400" />;
  if (type === 'symlink') return <FolderOpen size={18} className="text-cyan-400" />;
  const ext = name.split('.').pop()?.toLowerCase() || '';
  if (['py', 'js', 'ts', 'tsx', 'jsx', 'rb', 'go', 'rs', 'c', 'cpp', 'h', 'java', 'sh', 'bash'].includes(ext))
    return <FileCode size={18} className="text-neon-green" />;
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp', 'bmp', 'ico'].includes(ext))
    return <Image size={18} className="text-pink-400" />;
  if (['mp3', 'wav', 'ogg', 'flac', 'aac'].includes(ext))
    return <Music size={18} className="text-purple-400" />;
  if (['mp4', 'mkv', 'avi', 'mov', 'webm'].includes(ext))
    return <Film size={18} className="text-violet-400" />;
  if (['zip', 'tar', 'gz', 'bz2', 'xz', '7z', 'rar'].includes(ext))
    return <Archive size={18} className="text-yellow-500" />;
  if (['txt', 'md', 'log', 'csv'].includes(ext))
    return <FileText size={18} className="text-zinc-400" />;
  if (['json', 'yaml', 'yml', 'xml', 'toml', 'ini', 'conf', 'cfg'].includes(ext))
    return <FileCode size={18} className="text-cyan-400" />;
  if (['html', 'htm', 'css', 'scss'].includes(ext))
    return <FileCode size={18} className="text-orange-400" />;
  return <File size={18} className="text-zinc-500" />;
}

const QUICK_PATHS = [
  { label: '$HOME', path: '' },
  { label: '/sdcard', path: '/storage/emulated/0' },
  { label: '/tmp', path: '/tmp' },
  { label: '/', path: '/' },
];

export const FileBrowser: React.FC<FileBrowserProps> = ({ onExecute, onOpenInEditor, onRunInTerminal }) => {
  const [currentPath, setCurrentPath] = useState('');
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [viewFile, setViewFile] = useState<{ name: string; content: string; path: string } | null>(null);
  const [editFile, setEditFile] = useState<{ name: string; content: string; path: string } | null>(null);
  const [renameFile, setRenameFile] = useState<{ oldPath: string; newName: string } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ item: FileItem; x: number; y: number } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const notify = useNotification();
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const editRef = useRef<HTMLTextAreaElement>(null);

  const fetchDirectory = useCallback(async (dirPath: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/fs/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: dirPath || undefined }),
      });
      const data = await res.json();
      if (data.error) {
        setItems([]);
        notify(data.error, 'error');
        return;
      }
      setItems(data.items || []);
      if (data.path) setCurrentPath(data.path);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDirectory(currentPath); }, [fetchDirectory]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [contextMenu]);

  const navigateTo = (dirPath: string) => {
    setSearchQuery('');
    setShowSearch(false);
    fetchDirectory(dirPath);
  };

  const handleItemClick = (item: FileItem) => {
    if (item.type === 'directory') {
      navigateTo(`${currentPath}/${item.name}`);
    } else {
      viewFileContent(item);
    }
  };

  const viewFileContent = async (item: FileItem) => {
    const fullPath = `${currentPath}/${item.name}`;
    setLoading(true);
    try {
      const res = await fetch('/api/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fullPath }),
      });
      const data = await res.json();
      if (data.error) {
        notify(data.error, 'error');
        return;
      }
      setViewFile({ name: item.name, content: data.content, path: data.path });
    } catch {
      notify('Failed to read file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const saveFile = async () => {
    if (!editFile) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: editFile.path, content: editFile.content }),
      });
      const data = await res.json();
      if (data.success) {
        setEditFile(null);
        fetchDirectory(currentPath);
        notify('File saved successfully.', 'success');
      } else {
        notify(data.error || 'Save failed', 'error');
      }
    } catch {
      notify('Save failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteItem = async (item: FileItem) => {
    const fullPath = `${currentPath}/${item.name}`;
    if (!confirm(`Delete ${item.type === 'directory' ? 'folder' : 'file'} "${item.name}"?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/fs/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: fullPath }),
      });
      const data = await res.json();
      if (data.success) {
        setContextMenu(null);
        fetchDirectory(currentPath);
        notify('Item deleted successfully.', 'success');
      } else {
        notify(data.error || 'Delete failed', 'error');
      }
    } catch {
      notify('Delete failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const renameItem = async () => {
    if (!renameFile || !renameFile.newName.trim()) return;
    setActionLoading(true);
    try {
      const dir = currentPath;
      const newPath = `${dir}/${renameFile.newName.trim()}`;
      const res = await fetch('/api/fs/rename', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPath: renameFile.oldPath, newPath }),
      });
      const data = await res.json();
      if (data.success) {
        setRenameFile(null);
        fetchDirectory(currentPath);
        notify('Rename completed.', 'success');
      } else {
        notify(data.error || 'Rename failed', 'error');
      }
    } catch {
      notify('Rename failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/fs/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dirPath: `${currentPath}/${newFolderName.trim()}` }),
      });
      const data = await res.json();
      if (data.success) {
        setNewFolderName('');
        setShowNewFolder(false);
        fetchDirectory(currentPath);
        notify('Folder created successfully.', 'success');
      } else {
        notify(data.error || 'Failed to create folder', 'error');
      }
    } catch {
      notify('Failed to create folder', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const downloadFile = (item: FileItem) => {
    if (onExecute) {
      const fullPath = `${currentPath}/${item.name}`;
      onExecute(`cp "${fullPath}" /storage/emulated/0/Download/`);
    }
    setContextMenu(null);
  };

  const openInEditor = (item: FileItem) => {
    const fullPath = `${currentPath}/${item.name}`;
    setContextMenu(null);
    if (onOpenInEditor) {
      onOpenInEditor(fullPath);
    } else {
      viewFileContent(item);
    }
  };

  const filteredItems = showHidden
    ? items
    : items.filter(i => !i.name.startsWith('.'));

  const displayedItems = searchQuery
    ? filteredItems.filter(i => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : filteredItems;

  const breadcrumbs = currentPath.split('/').filter(Boolean);

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <FolderOpen size={16} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tighter">File Browser</h2>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em]">{items.length} items</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowHidden(v => !v)}
              className={cn("p-2 rounded-sm transition-colors text-[10px] font-black uppercase",
                showHidden ? "bg-accent/20 text-accent border border-accent/30" : "bg-zinc-900 text-zinc-500 border border-zinc-800"
              )}>
              .*
            </button>
            <button onClick={() => setShowSearch(v => !v)}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
              <Search size={14} />
            </button>
            <button onClick={() => setShowNewFolder(v => !v)}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
              <FolderPlus size={14} />
            </button>
            <button onClick={() => fetchDirectory(currentPath)}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Paths */}
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-zinc-900 shrink-0 overflow-x-auto no-scrollbar">
        {QUICK_PATHS.map(p => (
          <button key={p.path} onClick={() => navigateTo(p.path)}
            className={cn("shrink-0 px-2.5 py-1 rounded-sm text-[10px] font-black uppercase transition-colors border",
              currentPath === p.path ? "bg-accent/20 text-accent border-accent/30" : "bg-zinc-900 text-zinc-500 border-zinc-800 hover:text-white"
            )}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-zinc-900 shrink-0 overflow-x-auto no-scrollbar">
        <button onClick={() => navigateTo('')}
          className="shrink-0 flex items-center gap-1 px-2 py-1 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
          <Home size={12} />
          <span className="text-[10px] font-black uppercase">root</span>
        </button>
        <ChevronRight size={10} className="shrink-0 text-zinc-700" />
        {breadcrumbs.map((part, i) => (
          <React.Fragment key={i}>
            <button onClick={() => navigateTo('/' + breadcrumbs.slice(0, i + 1).join('/'))}
              className={cn("shrink-0 px-2 py-1 rounded-sm text-[10px] font-black uppercase transition-colors",
                i === breadcrumbs.length - 1 ? "text-white bg-zinc-800" : "text-zinc-500 hover:text-white"
              )}>
              {part}
            </button>
            {i < breadcrumbs.length - 1 && <ChevronRight size={10} className="shrink-0 text-zinc-700" />}
          </React.Fragment>
        ))}
      </div>

      {/* New Folder Input */}
      {showNewFolder && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-900 shrink-0">
          <input
            type="text"
            value={newFolderName}
            onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createFolder()}
            placeholder="Folder name..."
            className="flex-1 bg-black border border-zinc-700 rounded-sm px-3 py-1.5 text-[12px] text-white outline-none focus:border-accent placeholder:text-zinc-600"
            autoFocus
          />
          <button onClick={createFolder} disabled={actionLoading}
            className="px-3 py-1.5 bg-accent text-black text-[10px] font-black uppercase rounded-sm disabled:opacity-50">
            Create
          </button>
          <button onClick={() => { setShowNewFolder(false); setNewFolderName(''); }}
            className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase rounded-sm">
            Cancel
          </button>
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="px-3 py-2 border-b border-zinc-900 shrink-0">
          <div className="flex items-center gap-2 bg-black border border-zinc-700 rounded-sm px-3 py-1.5">
            <Search size={12} className="text-zinc-500 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search files..."
              className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-zinc-600"
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-zinc-500 hover:text-white"><X size={12} /></button>
            )}
          </div>
        </div>
      )}

      {/* File List */}
      <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar">
        {loading && items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-zinc-500 text-[11px]">
            <RefreshCw size={14} className="animate-spin mr-2" /> Loading...
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-zinc-600 text-[11px] gap-2">
            <Folder size={24} />
            <span>{searchQuery ? 'No matches' : 'Empty directory'}</span>
          </div>
        ) : (
          <div className="divide-y divide-zinc-900/50">
            {/* Go up */}
            {currentPath && currentPath !== '/' && (
              <button
                onClick={() => navigateTo(currentPath.split('/').slice(0, -1).join('/') || '/')}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 active:bg-zinc-800/50 transition-colors text-left"
              >
                <ArrowUp size={16} className="text-zinc-600" />
                <span className="text-[12px] text-zinc-500 font-medium">..</span>
              </button>
            )}
            {displayedItems.map((item, i) => (
              <button
                key={`${item.name}-${i}`}
                onClick={() => handleItemClick(item)}
                onContextMenu={(e) => { e.preventDefault(); setContextMenu({ item, x: e.clientX, y: e.clientY }); }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-900/50 active:bg-zinc-800/50 transition-colors text-left group"
              >
                {getFileIcon(item.name, item.type)}
                <div className="flex-1 min-w-0">
                  <p className={cn("text-[12px] font-medium truncate",
                    item.type === 'directory' ? 'text-amber-300' : 'text-zinc-300'
                  )}>{item.name}</p>
                  <p className="text-[9px] text-zinc-600 mt-0.5">
                    {item.type === 'directory' ? 'DIR' : formatSize(item.size)} · {item.permissions} · {formatDate(item.modified)}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setContextMenu({ item, x: e.clientX, y: e.clientY }); }}
                  className="p-1 text-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical size={14} />
                </button>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div className="fixed inset-0 z-50" onClick={() => setContextMenu(null)}>
          <div className="absolute bg-zinc-900 border border-zinc-700 rounded-sm shadow-2xl overflow-hidden min-w-[160px]"
            style={{ left: Math.min(contextMenu.x, window.innerWidth - 180), top: Math.min(contextMenu.y, window.innerHeight - 250) }}>
            {contextMenu.item.type === 'file' && (
              <>
                <button onClick={() => { setContextMenu(null); viewFileContent(contextMenu.item); }}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-zinc-800 transition-colors">
                  <Eye size={14} className="text-zinc-400" />
                  <span className="text-[11px] font-medium text-zinc-300">View</span>
                </button>
                <button onClick={() => openInEditor(contextMenu.item)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-zinc-800 transition-colors">
                  <Edit3 size={14} className="text-neon-green" />
                  <span className="text-[11px] font-medium text-zinc-300">Edit</span>
                </button>
                <button onClick={() => downloadFile(contextMenu.item)}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-zinc-800 transition-colors">
                  <Download size={14} className="text-cyan-400" />
                  <span className="text-[11px] font-medium text-zinc-300">Copy to Download</span>
                </button>
              </>
            )}
            <button onClick={() => setRenameFile({ oldPath: `${currentPath}/${contextMenu.item.name}`, newName: contextMenu.item.name })}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-zinc-800 transition-colors">
              <Edit3 size={14} className="text-amber-400" />
              <span className="text-[11px] font-medium text-zinc-300">Rename</span>
            </button>
            <button onClick={() => deleteItem(contextMenu.item)}
              className="w-full flex items-center gap-2.5 px-4 py-3 text-left hover:bg-red-500/10 transition-colors">
              <Trash2 size={14} className="text-red-500" />
              <span className="text-[11px] font-medium text-red-400">Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* View File Modal */}
      {viewFile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg max-h-[80vh] bg-surface border border-zinc-800 rounded-t-lg sm:rounded-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                {getFileIcon(viewFile.name, 'file')}
                <span className="text-[12px] font-bold text-white">{viewFile.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditFile(viewFile); setViewFile(null); setTimeout(() => editRef.current?.focus(), 100); }}
                  className="p-2 text-neon-green hover:bg-zinc-800 rounded-sm transition-colors">
                  <Edit3 size={14} />
                </button>
                <button onClick={() => setViewFile(null)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-sm transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            <pre className="flex-1 p-4 overflow-auto custom-scrollbar text-[11px] text-zinc-300 font-mono whitespace-pre-wrap break-all">
              {viewFile.content}
            </pre>
          </div>
        </div>
      )}

      {/* Edit File Modal */}
      {editFile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-lg max-h-[85vh] bg-surface border border-zinc-800 rounded-t-lg sm:rounded-lg flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 shrink-0">
              <div className="flex items-center gap-2">
                <Edit3 size={14} className="text-neon-green" />
                <span className="text-[12px] font-bold text-white">Edit: {editFile.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={saveFile} disabled={actionLoading}
                  className="px-3 py-1.5 bg-neon-green text-black text-[10px] font-black uppercase rounded-sm disabled:opacity-50 flex items-center gap-1">
                  <Check size={12} /> Save
                </button>
                <button onClick={() => setEditFile(null)}
                  className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-sm transition-colors">
                  <X size={14} />
                </button>
              </div>
            </div>
            <textarea
              ref={editRef}
              value={editFile.content}
              onChange={e => setEditFile({ ...editFile, content: e.target.value })}
              className="flex-1 p-4 bg-black text-[11px] text-neon-green font-mono resize-none outline-none border-none"
              spellCheck={false}
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renameFile && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
          <div className="w-full max-w-sm bg-surface border border-zinc-800 rounded-lg p-4">
            <h3 className="text-[12px] font-black text-white uppercase mb-3">Rename</h3>
            <input
              type="text"
              value={renameFile.newName}
              onChange={e => setRenameFile({ ...renameFile, newName: e.target.value })}
              onKeyDown={e => e.key === 'Enter' && renameItem()}
              className="w-full bg-black border border-zinc-700 rounded-sm px-3 py-2 text-[12px] text-white outline-none focus:border-accent mb-3"
              autoFocus
            />
            <div className="flex gap-2">
              <button onClick={renameItem} disabled={actionLoading}
                className="flex-1 px-3 py-2 bg-accent text-black text-[10px] font-black uppercase rounded-sm disabled:opacity-50">
                Rename
              </button>
              <button onClick={() => setRenameFile(null)}
                className="flex-1 px-3 py-2 bg-zinc-800 text-zinc-400 text-[10px] font-black uppercase rounded-sm">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
