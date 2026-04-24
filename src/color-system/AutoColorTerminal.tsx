import React, { useRef, useEffect, useState, useMemo } from 'react';
import { inferTerminalLine, withAlpha } from './infer-engine.js';

// ============================================================
// AutoColorTerminal — Terminal output with inferred coloring
// Automatically detects and colorizes: errors, warnings, IPs,
// URLs, ports, HTTP codes, hashes, commands, success/fail, etc.
// ============================================================

interface AutoColorTerminalProps {
  output: string;
  maxHeight?: number | string;
  fontSize?: number;
  showLineNumbers?: boolean;
  fontFamily?: string;
  className?: string;
  title?: string;
  onLineClick?: (line: string, index: number) => void;
  highlightPatterns?: Array<{ pattern: RegExp; color: string }>;
}

export default function AutoColorTerminal({
  output,
  maxHeight = 400,
  fontSize = 12,
  showLineNumbers = false,
  fontFamily = "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
  className,
  title,
  onLineClick,
  highlightPatterns,
}: AutoColorTerminalProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Parse output into colorized lines
  const lines = useMemo(() => {
    if (!output) return [];
    return output.split('\n').map((line, i) => {
      // Check custom highlight patterns first
      if (highlightPatterns) {
        for (const hp of highlightPatterns) {
          if (hp.pattern.test(line)) {
            return { text: line, color: hp.color, index: i };
          }
        }
      }
      // Use inferred color
      return { text: line, color: inferTerminalLine(line), index: i };
    });
  }, [output, highlightPatterns]);

  // Word-level coloring for special patterns within lines
  const colorizeLine = useMemo(() => {
    return (line: { text: string; color: string; index: number }) => {
      const { text, color, index } = line;

      // Full-line coloring for known patterns (errors, commands, etc.)
      const trimmed = text.trim().toLowerCase();
      if (
        /^(error|err|fatal|exception|traceback|panic)/i.test(trimmed) ||
        /^(warn|warning)/i.test(trimmed) ||
        /^(success|ok|done|complete)/i.test(trimmed) ||
        /^\$ |^root@|^nex\.ai/i.test(trimmed) ||
        /^\[think\]|\[plan\]|\[reason\]|\[learn\]|\[skill\]|\[error\]|\[ok\]|\[warn\]|✗|✓|⚠/i.test(trimmed)
      ) {
        return <span key={index} style={{ color }}>{text}</span>;
      }

      // Word-level inline coloring
      const parts: React.ReactNode[] = [];
      let remaining = text;
      let partIdx = 0;

      const patterns = [
        // URLs
        { regex: /(https?:\/\/[^\s)]+)/gi, color: '#79c0ff' },
        // IPv4
        { regex: /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g, color: '#7ee787' },
        // IPv6
        { regex: /\b([0-9a-f]{1,4}(:[0-9a-f]{1,4}){5,7})\b/gi, color: '#7ee787' },
        // Hashes (32+ hex chars)
        { regex: /\b([a-f0-9]{32,})\b/gi, color: '#d29922' },
        // Email
        { regex: /\b([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\b/g, color: '#79c0ff' },
        // File paths
        { regex: /(\/[a-zA-Z0-9_\-./~]+)/g, color: '#d2a8ff' },
        // Hex colors
        { regex: /(#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8}))/gi, color: '#ff7b72' },
        // Quoted strings
        { regex: /("[^"]*")/g, color: '#a5d6ff' },
        // Single-quoted strings
        { regex: /('[^']*')/g, color: '#a5d6ff' },
        // Numbers with units
        { regex: /\b(\d+(?:\.\d+)?\s*(?:kb|mb|gb|tb|bytes|ms|s|ms|b|bps|%)?)\b/gi, color: '#79c0ff' },
        // Port mentions
        { regex: /port\s+(\d+)/gi, color: '#7ee787' },
        // HTTP status codes in context
        { regex: /(HTTP\/[\d.]+)\s+(\d{3})\s*(\w+)?/gi, matchHandler: (m: RegExpMatchArray) => {
          const code = parseInt(m[2]);
          const codeColor = code < 300 ? '#3fb950' : code < 400 ? '#d29922' : '#f85149';
          return [m[1], codeColor, ' ', m[2], codeColor, m[3] ? ` ${m[3]}` : ''];
        }},
        // TCP/UDP port states
        { regex: /(\d+\/tcp)\s+(open|closed|filtered)/gi, matchHandler: (m: RegExpMatchArray) => {
          const state = m[2].toLowerCase();
          const stateColor = state === 'open' ? '#3fb950' : state === 'filtered' ? '#d29922' : '#f85149';
          return [m[1], '#c9d1d9', ' ', m[2], stateColor];
        }},
      ];

      let lastEnd = 0;

      while (remaining.length > 0) {
        let earliestMatch: RegExpExecArray | null = null;
        let earliestIdx = remaining.length;

        for (const p of patterns) {
          if (p.matchHandler) continue; // Complex patterns handled below
          p.regex.lastIndex = 0;
          const match = p.regex.exec(remaining);
          if (match && match.index < earliestIdx) {
            earliestMatch = match;
            earliestIdx = match.index;
          }
        }

        if (earliestMatch && earliestIdx < remaining.length) {
          // Add text before match
          if (earliestIdx > 0) {
            parts.push(<span key={partIdx++} style={{ color }}>{remaining.slice(0, earliestIdx)}</span>);
          }
          // Add matched text with its color
          parts.push(<span key={partIdx++} style={{ color: (earliestMatch as any).color }}>{earliestMatch[0]}</span>);
          remaining = remaining.slice(earliestIdx + earliestMatch[0].length);
        } else {
          // No more matches — add rest with base color
          if (remaining.length > 0) {
            parts.push(<span key={partIdx++} style={{ color }}>{remaining}</span>);
          }
          remaining = '';
        }
      }

      return parts.length > 0 ? <React.Fragment key={index}>{parts}</React.Fragment> : <span key={index}>{text}</span>;
    };
  }, []);

  // Auto-scroll detection
  const handleScroll = () => {
    const el = containerRef.current;
    if (el) {
      const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 50;
      setAutoScroll(atBottom);
    }
  };

  // Scroll to bottom on new content
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [output, autoScroll]);

  // Toggle auto-scroll on click at bottom
  const scrollToBottom = () => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
      setAutoScroll(true);
    }
  };

  return (
    <div style={{
      background: '#0d1117',
      border: '1px solid #21262d',
      borderRadius: '8px',
      overflow: 'hidden',
      fontFamily,
    }}>
      {/* Title bar */}
      {title && (
        <div style={{
          padding: '6px 12px',
          background: '#161b22',
          borderBottom: '1px solid #21262d',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}>
          <span style={{ fontSize: '11px', color: '#8b949e', fontWeight: 600 }}>{title}</span>
          <span style={{ fontSize: '10px', color: '#484f58' }}>{lines.length} lines</span>
        </div>
      )}

      {/* Terminal output */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={className}
        style={{
          maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : maxHeight,
          overflowY: 'auto',
          overflowX: 'auto',
          padding: '8px 0',
          fontSize,
          lineHeight: '1.6',
          cursor: 'text',
        }}
      >
        {lines.map((line) => (
          <div
            key={line.index}
            onClick={() => onLineClick?.(line.text, line.index)}
            style={{
              display: 'flex',
              padding: '0 12px',
              cursor: onLineClick ? 'pointer' : 'default',
              transition: 'background 0.1s',
              borderLeft: '2px solid transparent',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = withAlpha(line.color, 0.06);
              (e.currentTarget as HTMLDivElement).style.borderLeftColor = withAlpha(line.color, 0.4);
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
              (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
            }}
          >
            {showLineNumbers && (
              <span style={{
                width: '40px', flexShrink: 0, textAlign: 'right',
                paddingRight: '12px', color: '#484f58', userSelect: 'none',
              }}>
                {line.index + 1}
              </span>
            )}
            <span style={{ whiteSpace: 'pre', flex: 1 }}>
              {colorizeLine(line)}
            </span>
          </div>
        ))}

        {lines.length === 0 && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#484f58' }}>
            {output ? 'Processing...' : 'No output'}
          </div>
        )}
      </div>

      {/* Scroll-to-bottom button */}
      {!autoScroll && (
        <button
          onClick={scrollToBottom}
          style={{
            position: 'absolute', bottom: '12px', right: '12px',
            background: '#21262d', border: '1px solid #30363d',
            color: '#c9d1d9', padding: '4px 12px', borderRadius: '6px',
            cursor: 'pointer', fontSize: '11px',
          }}
        >
          ↓ Latest
        </button>
      )}
    </div>
  );
}

// ============================================================
// Simplified wrapper — just pass a string, get colored output
// ============================================================

export function ColorizedOutput({ text, fontSize }: { text: string; fontSize?: number }) {
  return (
    <div style={{
      background: '#0d1117', borderRadius: '6px', padding: '8px 12px',
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: fontSize || 12, lineHeight: 1.5,
      maxHeight: 300, overflow: 'auto',
    }}>
      {text.split('\n').map((line, i) => (
        <div key={i} style={{ color: inferTerminalLine(line), whiteSpace: 'pre' }}>
          {line}
        </div>
      ))}
    </div>
  );
}
