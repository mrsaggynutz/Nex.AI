import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  inferFromStatus, inferFromSeverity, inferFromCategory, inferFromLevel,
  inferFromValue, inferFromPercentage, inferFromString, inferProgressColor,
  inferTerminalLine, inferFromText,
  withAlpha, lighten, darken, saturate,
  THEMES, generateTheme, ColorTheme,
} from './infer-engine.js';

// ============================================================
// React Hooks — Inferred Color System
// ============================================================

// ---- 1. useInferredColor — Universal color inference hook ----
export function useInferredColor() {
  const fromStatus = useCallback((status: string) => inferFromStatus(status), []);
  const fromSeverity = useCallback((sev: string) => inferFromSeverity(sev), []);
  const fromCategory = useCallback((cat: string) => inferFromCategory(cat), []);
  const fromLevel = useCallback((lvl: number) => inferFromLevel(lvl), []);
  const fromValue = useCallback((val: number, min?: number, max?: number, gradient?: 'red-green' | 'blue-red' | 'cool-warm' | 'traffic') =>
    inferFromValue(val, min, max, gradient), []);
  const fromPercentage = useCallback((pct: number) => inferFromPercentage(pct), []);
  const fromString = useCallback((str: string, sat?: number, light?: number) => inferFromString(str, sat, light), []);
  const fromText = useCallback((text: string) => inferFromText(text), []);
  const progressColor = useCallback((pct: number) => inferProgressColor(pct), []);
  const terminalLine = useCallback((line: string) => inferTerminalLine(line), []);

  return {
    fromStatus, fromSeverity, fromCategory, fromLevel,
    fromValue, fromPercentage, fromString, fromText,
    progressColor, terminalLine,
    alpha: withAlpha, lighten, darken, saturate,
  };
}

// ---- 2. useColorTheme — Dynamic theme hook ----
export function useColorTheme(initialTheme: string = 'dark_hacker') {
  const [themeName, setThemeName] = useState(initialTheme);
  const [theme, setTheme] = useState<ColorTheme>(THEMES.dark_hacker as unknown as ColorTheme);

  useEffect(() => {
    if (THEMES[themeName as keyof typeof THEMES]) {
      setTheme(THEMES[themeName as keyof typeof THEMES] as unknown as ColorTheme);
    }
  }, [themeName]);

  const cycleTheme = useCallback(() => {
    const names = Object.keys(THEMES);
    const idx = names.indexOf(themeName);
    setThemeName(names[(idx + 1) % names.length]);
  }, [themeName]);

  const customTheme = useCallback((hue: number) => {
    setTheme(generateTheme(hue));
    setThemeName('custom');
  }, []);

  return { theme, themeName, setThemeName, cycleTheme, customTheme };
}

// ---- 3. useAutoTerminalColor — Auto-colorize terminal output ----
export function useAutoTerminalColor(rawOutput: string) {
  const coloredLines = useMemo(() => {
    return rawOutput.split('\n').map(line => {
      const color = inferTerminalLine(line);
      return { text: line, color };
    });
  }, [rawOutput]);

  return coloredLines;
}

// ============================================================
// React Context — App-wide inferred color provider
// ============================================================

interface ColorContextValue {
  infer: ReturnType<typeof useInferredColor>;
  theme: ColorTheme;
  themeName: string;
  setThemeName: (name: string) => void;
  cycleTheme: () => void;
  customTheme: (hue: number) => void;
  themeNames: string[];
}

const ColorContext = createContext<ColorContextValue | null>(null);

export function ColorProvider({
  children,
  initialTheme = 'dark_hacker',
}: {
  children: React.ReactNode;
  initialTheme?: string;
}) {
  const infer = useInferredColor();
  const { theme, themeName, setThemeName, cycleTheme, customTheme } = useColorTheme(initialTheme);

  const value = useMemo(() => ({
    infer, theme, themeName, setThemeName, cycleTheme, customTheme,
    themeNames: Object.keys(THEMES),
  }), [infer, theme, themeName, cycleTheme, customTheme]);

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  );
}

export function useColors(): ColorContextValue {
  const ctx = useContext(ColorContext);
  if (!ctx) throw new Error('useColors must be used within a <ColorProvider>');
  return ctx;
}

// ============================================================
// Pre-built Inferred Components
// ============================================================

// ---- StatusBadge — Auto-colored status indicator ----
export function StatusBadge({ status, size = 'sm' }: { status: string; size?: 'sm' | 'md' | 'lg' }) {
  const { infer } = useColors();
  const color = infer.fromStatus(status);
  const sizes = {
    sm: { padding: '2px 8px', fontSize: '10px', dotSize: '6px' },
    md: { padding: '4px 12px', fontSize: '12px', dotSize: '8px' },
    lg: { padding: '6px 16px', fontSize: '14px', dotSize: '10px' },
  };
  const s = sizes[size];
  const isAnimated = ['running', 'executing', 'active', 'thinking', 'planning'].includes(status.toLowerCase());

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '6px',
      padding: s.padding, borderRadius: '12px',
      background: withAlpha(color, 0.15),
      border: `1px solid ${withAlpha(color, 0.3)}`,
      color, fontSize: s.fontSize, fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      letterSpacing: '0.5px',
    }}>
      <span style={{
        width: s.dotSize, height: s.dotSize, borderRadius: '50%',
        background: color,
        animation: isAnimated ? 'inferPulse 1.5s infinite' : 'none',
        display: 'inline-block',
      }} />
      {status.toUpperCase()}
    </span>
  );
}

// ---- SeverityBadge — Auto-colored severity indicator ----
export function SeverityBadge({ severity }: { severity: string }) {
  const color = inferFromSeverity(severity);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '2px 10px', borderRadius: '4px',
      background: withAlpha(color, 0.15),
      border: `1px solid ${withAlpha(color, 0.3)}`,
      color, fontSize: '11px', fontWeight: 700,
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      {severity === 'critical' && '🔴'}
      {severity === 'high' && '🟠'}
      {severity === 'medium' && '🟡'}
      {severity === 'low' && '🔵'}
      {(severity === 'info' || severity === 'informational') && '⚪'}
      {severity.toUpperCase()}
    </span>
  );
}

// ---- ProgressBar — Inferred color gradient ----
export function InferProgressBar({
  value, min = 0, max = 100, height = 6, label, showValue = true,
}: {
  value: number; min?: number; max?: number; height?: number;
  label?: string; showValue?: boolean;
}) {
  const pct = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  const color = inferProgressColor(pct / 100);

  return (
    <div style={{ width: '100%' }}>
      {(label || showValue) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#8b949e', marginBottom: '4px' }}>
          {label && <span>{label}</span>}
          {showValue && <span>{Math.round(pct)}%</span>}
        </div>
      )}
      <div style={{
        height, borderRadius: height / 2, background: '#21262d', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: height / 2,
          background: `linear-gradient(90deg, ${color}, ${lighten(color, 15)})`,
          width: `${pct}%`,
          transition: 'width 0.5s ease',
          boxShadow: `0 0 8px ${withAlpha(color, 0.4)}`,
        }} />
      </div>
    </div>
  );
}

// ---- PercentageDisplay — Color-coded metric display ----
export function PercentageDisplay({ value, label, size = 'md' }: { value: number; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const { color, bg, label: rating } = inferFromPercentage(value);
  const sizes = {
    sm: { fontSize: '20px', labelSize: '10px' },
    md: { fontSize: '28px', labelSize: '12px' },
    lg: { fontSize: '40px', labelSize: '14px' },
  };
  const s = sizes[size];

  return (
    <div style={{
      textAlign: 'center', padding: '12px', borderRadius: '8px',
      background: bg, border: `1px solid ${withAlpha(color, 0.2)}`,
    }}>
      <div style={{ fontSize: s.fontSize, fontWeight: 800, color, fontFamily: "'JetBrains Mono', monospace" }}>
        {Math.round(value)}%
      </div>
      <div style={{ fontSize: s.labelSize, color: '#8b949e', marginTop: '2px' }}>{label}</div>
      <div style={{ fontSize: '10px', color, marginTop: '4px', fontWeight: 600 }}>{rating}</div>
    </div>
  );
}

// ---- CategoryTag — Color-coded category tag ----
export function CategoryTag({ category, icon }: { category: string; icon?: string }) {
  const color = inferFromCategory(category);
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      padding: '3px 10px', borderRadius: '6px',
      background: withAlpha(color, 0.12),
      border: `1px solid ${withAlpha(color, 0.25)}`,
      color, fontSize: '11px', fontWeight: 600,
      fontFamily: "'JetBrains Mono', monospace",
      textTransform: 'capitalize',
    }}>
      {icon && <span>{icon}</span>}
      {category.replace(/[_-]/g, ' ')}
    </span>
  );
}

// ---- ColoredValue — Auto-detects data type and colors ----
export function ColoredValue({ value, mono = true }: { value: string; mono?: boolean }) {
  const color = inferFromText(value);
  return (
    <span style={{
      color,
      fontFamily: mono ? "'JetBrains Mono', monospace" : 'inherit',
      fontSize: '12px',
    }}>
      {value}
    </span>
  );
}

// ---- ThemeSwitcher — Cycle through color themes ----
export function ThemeSwitcher() {
  const { themeName, cycleTheme, themeNames } = useColors();
  return (
    <button onClick={cycleTheme} style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      padding: '4px 12px', borderRadius: '6px',
      background: '#21262d', border: '1px solid #30363d',
      color: '#c9d1d9', cursor: 'pointer', fontSize: '12px',
      fontFamily: "'JetBrains Mono', monospace",
    }}>
      <span style={{
        width: '12px', height: '12px', borderRadius: '50%',
        background: themeName === 'matrix' ? '#00ff41' :
                   themeName === 'cyberpunk' ? '#ff00ff' :
                   themeName === 'terminal' ? '#50fa7b' :
                   themeName === 'phantom' ? '#bc8cff' :
                   themeName === 'stealth' ? '#00d4aa' :
                   '#58a6ff',
        boxShadow: '0 0 6px currentColor',
      }} />
      {themeName.replace(/_/g, ' ')}
    </button>
  );
}

// ---- Pulse animation for status dots ----
export function InferStyles() {
  return (
    <style>{`
      @keyframes inferPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.8); }
      }
    `}</style>
  );
}
