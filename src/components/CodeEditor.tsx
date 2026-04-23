import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  FileCode, Save, Play, RotateCcw, WrapText, Plus, X,
  FileText, Terminal as TerminalIcon
} from 'lucide-react';
import { cn } from '../lib/utils';

interface CodeEditorProps {
  filePath?: string;
  initialContent?: string;
  onExecute?: (command: string, timeout?: number) => Promise<string | null>;
  onRunInTerminal?: (cmd: string) => void;
}

const LANG_MAP: Record<string, string> = {
  py: 'Python', js: 'JavaScript', ts: 'TypeScript', tsx: 'TSX', jsx: 'JSX',
  c: 'C', h: 'C Header', cpp: 'C++', rs: 'Rust', go: 'Go',
  json: 'JSON', yaml: 'YAML', yml: 'YAML', xml: 'XML', html: 'HTML',
  css: 'CSS', sh: 'Bash', bash: 'Bash', rb: 'Ruby', java: 'Java',
  md: 'Markdown', sql: 'SQL', toml: 'TOML', ini: 'INI',
};

function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  return LANG_MAP[ext] || 'Text';
}

// Simple keyword-based syntax highlighting
const KEYWORDS: Record<string, string[]> = {
  Python: ['def', 'class', 'import', 'from', 'return', 'if', 'elif', 'else', 'for', 'while', 'try', 'except', 'finally', 'with', 'as', 'async', 'await', 'yield', 'lambda', 'pass', 'break', 'continue', 'raise', 'in', 'not', 'and', 'or', 'is', 'True', 'False', 'None', 'self', 'print', 'global', 'nonlocal', 'assert', 'del'],
  JavaScript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'yield', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false', 'console', 'window', 'document'],
  TypeScript: ['function', 'const', 'let', 'var', 'return', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class', 'extends', 'import', 'export', 'default', 'async', 'await', 'yield', 'try', 'catch', 'finally', 'throw', 'typeof', 'instanceof', 'in', 'of', 'null', 'undefined', 'true', 'false', 'interface', 'type', 'enum', 'namespace', 'implements', 'readonly', 'keyof', 'never'],
  Bash: ['if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done', 'case', 'esac', 'function', 'return', 'in', 'local', 'export', 'source', 'echo', 'exit', 'read', 'cd', 'ls', 'cat', 'grep', 'sed', 'awk', 'find', 'mkdir', 'rm', 'cp', 'mv', 'chmod', 'chown', 'sudo', 'apt', 'pkg', 'install', 'pip', 'npm', 'git'],
  C: ['int', 'char', 'void', 'float', 'double', 'long', 'short', 'unsigned', 'signed', 'struct', 'union', 'enum', 'typedef', 'const', 'static', 'extern', 'volatile', 'register', 'auto', 'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'sizeof', 'include', 'define', 'ifdef', 'ifndef', 'endif', 'NULL', 'malloc', 'free', 'printf', 'scanf'],
  Rust: ['fn', 'let', 'mut', 'const', 'if', 'else', 'for', 'while', 'loop', 'match', 'return', 'struct', 'enum', 'impl', 'trait', 'use', 'mod', 'pub', 'crate', 'self', 'super', 'where', 'async', 'await', 'move', 'ref', 'true', 'false', 'Some', 'None', 'Ok', 'Err', 'println', 'panic', 'Vec', 'String', 'Box', 'Option', 'Result'],
  Go: ['func', 'var', 'const', 'type', 'struct', 'interface', 'map', 'chan', 'go', 'select', 'case', 'default', 'if', 'else', 'for', 'range', 'switch', 'break', 'continue', 'return', 'defer', 'package', 'import', 'nil', 'true', 'false', 'fmt', 'error', 'string', 'int', 'float64', 'bool', 'make', 'len', 'append', 'println', 'printf'],
  JSON: ['true', 'false', 'null'],
};

function highlightLine(line: string, lang: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const keywords = KEYWORDS[lang];
  if (!keywords) {
    parts.push(line);
    return parts;
  }

  let remaining = line;
  let keyIndex = 0;

  while (remaining.length > 0) {
    // Check for strings (single or double quotes)
    const strMatch = remaining.match(/^(['"`])(.*?)(\1)/);
    // Check for comments
    const commentMatch = lang !== 'JSON' && remaining.match(/^\/\/.*$/) || lang === 'Python' && remaining.match(/^#.*$/) || lang === 'Bash' && remaining.match(/^#.*/);
    // Check for numbers
    const numMatch = remaining.match(/^\b\d+\.?\d*\b/);
    // Check for keywords
    let kwMatch: RegExpMatchArray | null = null;
    if (keywords) {
      const kwRegex = new RegExp(`\\b(${keywords.join('|')})\\b`);
      kwMatch = remaining.match(kwRegex);
    }

    // Prioritize: strings > comments > numbers > keywords
    let matchStart = remaining.length;
    let matchType: string | null = null;
    let matchLen = 0;

    if (strMatch && strMatch.index === 0) {
      matchType = 'string';
      matchLen = strMatch[0].length;
    } else if (commentMatch && commentMatch.index === 0) {
      matchType = 'comment';
      matchLen = commentMatch[0].length;
    } else if (numMatch && numMatch.index === 0) {
      matchType = 'number';
      matchLen = numMatch[0].length;
    } else if (kwMatch && kwMatch.index === 0) {
      matchType = 'keyword';
      matchLen = kwMatch[0].length;
    } else {
      // Find earliest match
      const candidates = [
        strMatch ? { start: strMatch.index || Infinity, type: 'string', len: strMatch[0].length } : null,
        commentMatch ? { start: commentMatch.index || Infinity, type: 'comment', len: commentMatch[0].length } : null,
        numMatch ? { start: numMatch.index || Infinity, type: 'number', len: numMatch[0].length } : null,
        kwMatch ? { start: kwMatch.index || Infinity, type: 'keyword', len: kwMatch[0].length } : null,
      ].filter(Boolean) as Array<{ start: number; type: string; len: number }>;

      candidates.sort((a, b) => a.start - b.start);
      const first = candidates[0];
      if (first && first.start < matchStart) {
        matchType = first.type;
        matchLen = first.len;
        // Push text before match
        const before = remaining.slice(0, first.start);
        if (before) parts.push(before);
      }
    }

    if (matchType && matchLen > 0) {
      const matched = remaining.slice(0, matchLen);
      if (matchType === 'string') {
        parts.push(<span key={keyIndex++} className="text-amber-400">{matched}</span>);
      } else if (matchType === 'comment') {
        parts.push(<span key={keyIndex++} className="text-zinc-600 italic">{matched}</span>);
      } else if (matchType === 'number') {
        parts.push(<span key={keyIndex++} className="text-purple-400">{matched}</span>);
      } else if (matchType === 'keyword') {
        parts.push(<span key={keyIndex++} className="text-cyan-400 font-bold">{matched}</span>);
      }
      remaining = remaining.slice(matchLen);
    } else {
      parts.push(remaining);
      break;
    }
  }

  return parts;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ filePath: initialFilePath, initialContent, onExecute, onRunInTerminal }) => {
  const [filePath, setFilePath] = useState(initialFilePath || '');
  const [content, setContent] = useState(initialContent || '');
  const [saved, setSaved] = useState(true);
  const [wordWrap, setWordWrap] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showNewFile, setShowNewFile] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const language = detectLanguage(filePath || 'untitled.txt');

  const loadFile = useCallback(async (path: string) => {
    if (!path) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/fs/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath: path }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setFilePath(data.path);
      setContent(data.content);
      setSaved(true);
    } catch {
      setError('Failed to read file');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialFilePath) loadFile(initialFilePath);
  }, [initialFilePath, loadFile]);

  const saveFile = async () => {
    if (!filePath) {
      setError('No file path. Create or open a file first.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/fs/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, content }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
      } else {
        setError(data.error || 'Save failed');
      }
    } catch {
      setError('Save failed');
    } finally {
      setLoading(false);
    }
  };

  const runCode = () => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    if (onRunInTerminal) {
      if (['py'].includes(ext)) {
        onRunInTerminal(`python3 "${filePath}"`);
      } else if (['js'].includes(ext)) {
        onRunInTerminal(`node "${filePath}"`);
      } else if (['sh', 'bash'].includes(ext)) {
        onRunInTerminal(`bash "${filePath}"`);
      } else if (['ts'].includes(ext)) {
        onRunInTerminal(`npx tsx "${filePath}"`);
      } else if (['go'].includes(ext)) {
        onRunInTerminal(`cd "$(dirname "${filePath}")" && go run "$(basename "${filePath}")"`);
      } else if (['rs'].includes(ext)) {
        onRunInTerminal(`cd "$(dirname "${filePath}")" && cargo run`);
      } else if (['c', 'cpp'].includes(ext)) {
        const out = filePath.replace(/\.\w+$/, '');
        onRunInTerminal(`gcc "${filePath}" -o "${out}" && "${out}"`);
      } else {
        onRunInTerminal(`cat "${filePath}"`);
      }
    }
  };

  const createNewFile = () => {
    if (!newFileName.trim()) return;
    setFilePath(newFileName.trim());
    setContent('');
    setSaved(false);
    setShowNewFile(false);
    setNewFileName('');
    textareaRef.current?.focus();
  };

  // Auto-indent on Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const newContent = content.substring(0, start) + '  ' + content.substring(end);
      setContent(newContent);
      setSaved(false);
      setTimeout(() => { target.selectionStart = target.selectionEnd = start + 2; }, 0);
    }
    if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      saveFile();
    }
    if (e.key === 'Enter') {
      const target = e.target as HTMLTextAreaElement;
      const start = target.selectionStart;
      const before = content.substring(0, start);
      const currentLine = before.split('\n').pop() || '';
      const indent = currentLine.match(/^\s*/)?.[0] || '';
      // Extra indent after { or : or def
      const extraIndent = /[{:]\s*$/.test(currentLine) ? '  ' : '';
      if (indent || extraIndent) {
        e.preventDefault();
        const newContent = content.substring(0, start) + '\n' + indent + extraIndent + content.substring(target.selectionEnd);
        setContent(newContent);
        setSaved(false);
        const newPos = start + 1 + indent.length + extraIndent.length;
        setTimeout(() => { target.selectionStart = target.selectionEnd = newPos; }, 0);
      }
    }
  };

  const lines = content.split('\n');

  const handleScroll = () => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-neon-green/20 border border-neon-green/30 flex items-center justify-center">
              <FileCode size={16} className="text-neon-green" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-black text-white uppercase tracking-tighter">Code Editor</h2>
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em] truncate">
                {filePath || 'No file open'} · {language} · {lines.length} lines
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setShowNewFile(v => !v)}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
              <Plus size={14} />
            </button>
            <button onClick={() => setWordWrap(v => !v)}
              className={cn("p-2 border rounded-sm transition-colors",
                wordWrap ? "bg-accent/20 text-accent border-accent/30" : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white"
              )}>
              <WrapText size={14} />
            </button>
            <button onClick={() => { setContent(''); setSaved(false); }}
              className="p-2 bg-zinc-900 border border-zinc-800 rounded-sm text-zinc-400 hover:text-white transition-colors">
              <RotateCcw size={14} />
            </button>
            {filePath && (
              <button onClick={runCode}
                className="p-2 bg-neon-green/20 border border-neon-green/30 rounded-sm text-neon-green hover:bg-neon-green/30 transition-colors">
                <Play size={14} />
              </button>
            )}
            <button onClick={saveFile} disabled={loading || saved}
              className={cn("px-3 py-2 text-[10px] font-black uppercase rounded-sm flex items-center gap-1 transition-colors disabled:opacity-50",
                saved ? "bg-zinc-900 text-zinc-500 border border-zinc-800" : "bg-accent text-black border border-accent"
              )}>
              <Save size={12} /> Save
            </button>
          </div>
        </div>
      </div>

      {/* New File Input */}
      {showNewFile && (
        <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-900 shrink-0">
          <input
            type="text"
            value={newFileName}
            onChange={e => setNewFileName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && createNewFile()}
            placeholder="/path/to/newfile.py"
            className="flex-1 bg-black border border-zinc-700 rounded-sm px-3 py-1.5 text-[12px] text-white outline-none focus:border-accent placeholder:text-zinc-600"
            autoFocus
          />
          <button onClick={createNewFile}
            className="px-3 py-1.5 bg-accent text-black text-[10px] font-black uppercase rounded-sm">
            Create
          </button>
          <button onClick={() => { setShowNewFile(false); setNewFileName(''); }}
            className="p-1.5 text-zinc-500 hover:text-white"><X size={14} /></button>
        </div>
      )}

      {/* Error Bar */}
      {error && (
        <div className="px-3 py-1.5 bg-red-500/10 border-b border-red-500/20 text-[10px] text-red-400 flex items-center justify-between shrink-0">
          <span>{error}</span>
          <button onClick={() => setError('')}><X size={12} /></button>
        </div>
      )}

      {/* Editor Area */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Line Numbers */}
        <div ref={lineNumbersRef} className="w-10 shrink-0 bg-black/50 border-r border-zinc-900 overflow-hidden">
          <div className="py-3 px-1.5">
            {lines.map((_, i) => (
              <div key={i} className="text-[11px] text-zinc-700 text-right font-mono leading-[1.6] select-none">
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => { setContent(e.target.value); setSaved(false); }}
          onKeyDown={handleKeyDown}
          onScroll={handleScroll}
          className={cn(
            "flex-1 bg-transparent text-[11px] text-zinc-200 font-mono p-3 outline-none border-none resize-none leading-[1.6] selection:bg-neon-green/20",
            wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre overflow-x-auto"
          )}
          spellCheck={false}
          autoFocus
          placeholder="// Start coding or create a new file..."
        />

        {/* Syntax Highlighted Overlay (read-only display) */}
        {content && (
          <div
            className={cn(
              "absolute inset-0 top-0 left-10 pointer-events-none p-3 font-mono text-[11px] leading-[1.6] overflow-hidden opacity-30",
              wordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
            )}
            aria-hidden="true"
          >
            {lines.map((line, i) => (
              <div key={i}>{highlightLine(line, language)}</div>
            ))}
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-black border-t border-zinc-900 shrink-0 text-[9px] font-black uppercase tracking-widest">
        <div className="flex items-center gap-3">
          <span className={saved ? "text-neon-green" : "text-accent"}>
            {saved ? '● Saved' : '○ Modified'}
          </span>
          <span className="text-zinc-600">{language}</span>
          <span className="text-zinc-600">{lines.length}L</span>
          <span className="text-zinc-600">{content.length}B</span>
        </div>
        <div className="flex items-center gap-2 text-zinc-600">
          <span>UTF-8</span>
          <span>Tab: 2sp</span>
        </div>
      </div>
    </div>
  );
};
