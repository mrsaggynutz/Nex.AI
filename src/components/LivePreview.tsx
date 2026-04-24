import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNotification } from './NotificationProvider';
import {
  Globe, Save, Download, Upload, RotateCcw, Maximize2, Minimize2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface LivePreviewProps {
  onExecute?: (command: string, timeout?: number) => Promise<string | null>;
  onRunInTerminal?: (cmd: string) => void;
}

const DEFAULT_HTML = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: -apple-system, sans-serif;
      background: #0a0a0a;
      color: #e5e5e5;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      text-align: center;
      padding: 2rem;
    }
    h1 {
      color: #39FF14;
      font-size: 2rem;
      margin-bottom: 0.5rem;
    }
    p { color: #888; font-size: 0.9rem; }
    .badge {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.25rem 0.75rem;
      border: 1px solid #39FF14;
      color: #39FF14;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>AETHER.SHELL</h1>
    <p>Live Preview - Edit HTML, CSS, and JS</p>
    <span class="badge">Live Preview Active</span>
  </div>
</body>
</html>`;

export const LivePreview: React.FC<LivePreviewProps> = ({ onExecute, onRunInTerminal }) => {
  const [html, setHtml] = useState(DEFAULT_HTML);
  const [css, setCss] = useState('');
  const [js, setJs] = useState('');
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'js'>('html');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filePath, setFilePath] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [importPath, setImportPath] = useState('');
  const [loading, setLoading] = useState(false);
  const notify = useNotification();
  const [splitPos, setSplitPos] = useState(50);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Parse the initial HTML into separate tabs if it contains style/script
  useEffect(() => {
    // Already using default combined HTML, so extract CSS and JS from it
    const styleMatch = DEFAULT_HTML.match(/<style[^>]*>([\s\S]*?)<\/style>/);
    const scriptMatch = DEFAULT_HTML.match(/<script[^>]*>([\s\S]*?)<\/script>/);
    if (styleMatch) setCss(styleMatch[1].trim());
    if (scriptMatch) setJs(scriptMatch[1].trim());
  }, []);

  const buildDocument = useCallback(() => {
    const cssBlock = css ? `\n    <style>\n${css}\n    </style>` : '';
    const jsBlock = js ? `\n    <script>\n${js}\n    </script>` : '';
    return `<!DOCTYPE html>
<html>
<head>${cssBlock}
</head>
<body>
${html}
${jsBlock}
</body>
</html>`;
  }, [html, css, js]);

  // Debounced preview update
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (iframeRef.current) {
        const doc = buildDocument();
        const blob = new Blob([doc], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        iframeRef.current.src = url;
        // Cleanup after load
        iframeRef.current.onload = () => URL.revokeObjectURL(url);
      }
    }, 500);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [buildDocument]);

  const refreshPreview = () => {
    if (iframeRef.current) {
      const doc = buildDocument();
      const blob = new Blob([doc], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;
      iframeRef.current.onload = () => URL.revokeObjectURL(url);
    }
  };


  const saveToFile = async () => {
    if (!filePath) {
      setFilePath('/tmp/preview.html');
    }
    const targetPath = filePath || '/tmp/preview.html';
    const content = buildDocument();
    setLoading(true);
    try {
      const res = await fetch('/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: targetPath, content }),
      });
      const data = await res.json();
      if (!data.success) {
        notify(data.error || 'Save failed', 'error');
      } else {
        notify('Preview saved successfully.', 'success');
      }
    } catch {
      notify('Save failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadFromFile = async () => {
    if (!importPath.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: importPath.trim() }),
      });
      const data = await res.json();
      if (data.error) {
        notify(data.error, 'error');
        return;
      }
      const content = data.content;
      setFilePath(data.path);
      // Try to parse into tabs
      const styleMatch = content.match(/<style[^>]*>([\s\S]*?)<\/style>/);
      const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
      // Extract body content
      const bodyMatch = content.match(/<body[^>]*>([\s\S]*?)<\/body>/);
      setHtml(bodyMatch ? bodyMatch[1].trim() : content);
      setCss(styleMatch ? styleMatch[1].trim() : '');
      setJs(scriptMatch ? scriptMatch[1].trim() : '');
      setImportPath('');
      setShowImport(false);
    } catch {
      notify('Failed to load file', 'error');
    } finally {
      setLoading(false);
    }
  };

  const tabContent = activeTab === 'html' ? html : activeTab === 'css' ? css : js;
  const setTabContent = activeTab === 'html' ? setHtml : activeTab === 'css' ? setCss : setJs;

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center">
              <Globe size={16} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tighter">Live Preview</h2>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em]">HTML + CSS + JS</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowImport(v => !v)}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
              <Upload size={14} />
            </button>
            <button onClick={saveToFile}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-neon-green transition-colors">
              <Save size={14} />
            </button>
            <button onClick={() => setIsFullscreen(v => !v)}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
              {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>
      </div>

      {/* Import Input */}
      {showImport && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-900 shrink-0">
          <input
            type="text"
            value={importPath}
            onChange={e => setImportPath(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && loadFromFile()}
            placeholder="/path/to/file.html"
            className="flex-1 bg-black border border-zinc-700 rounded-sm px-3 py-1.5 text-[12px] text-white outline-none focus:border-cyan-400 placeholder:text-zinc-600"
            autoFocus
          />
          <button onClick={loadFromFile}
            className="px-3 py-1.5 bg-cyan-500 text-black text-[10px] font-black uppercase rounded-sm">
            Load
          </button>
        </div>
      )}

      {/* Save Path */}
      {filePath && (
        <div className="px-3 py-1 border-b border-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2">
            <Save size={10} className="text-zinc-600" />
            <input
              type="text"
              value={filePath}
              onChange={e => setFilePath(e.target.value)}
              className="flex-1 bg-transparent text-[10px] text-zinc-500 outline-none font-mono"
            />
          </div>
        </div>
      )}

      {/* Editor Tabs */}
      {!isFullscreen && (
        <div className="flex border-b border-zinc-900 shrink-0">
          {(['html', 'css', 'js'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={cn("flex-1 py-2 text-[10px] font-black uppercase tracking-widest transition-colors border-b-2",
                activeTab === tab ? "text-cyan-400 border-cyan-400" : "text-zinc-500 border-transparent hover:text-zinc-300"
              )}>
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Main Content */}
      <div className={cn("flex-1 flex overflow-hidden", isFullscreen ? "flex-col" : "flex-col-reverse")}>
        {/* Editor */}
        {!isFullscreen && (
          <div className="h-[45%] flex flex-col border-t border-zinc-900 shrink-0">
            <textarea
              value={tabContent}
              onChange={e => setTabContent(e.target.value)}
              className="flex-1 bg-black text-[11px] text-cyan-400 font-mono p-3 outline-none border-none resize-none leading-[1.6] whitespace-pre selection:bg-cyan-400/20"
              spellCheck={false}
              autoFocus
            />
          </div>
        )}

        {/* Preview */}
        <div className={cn("flex-1 bg-white relative", isFullscreen ? "flex-1" : "h-[55%]")}>
          <iframe
            ref={iframeRef}
            className="w-full h-full border-none"
            sandbox="allow-scripts"
            title="Live Preview"
          />
          {loading && (
            <div className="absolute top-2 right-2 bg-black/80 px-2 py-1 text-[9px] text-zinc-400 rounded-sm">
              Processing...
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black border-t border-zinc-900 shrink-0 text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span className="text-cyan-400">● Live</span>
          <span className="text-zinc-600">500ms debounce</span>
          <span className="text-zinc-600">{activeTab.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <span>{buildDocument().length}B</span>
          <button onClick={refreshPreview}
            className="text-zinc-500 hover:text-white transition-colors">
            <RotateCcw size={10} />
          </button>
        </div>
      </div>
    </div>
  );
};
