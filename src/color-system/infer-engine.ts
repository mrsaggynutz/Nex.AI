// ============================================================
// Nex.AI — Color Inference Engine
// Dynamically infers colors based on context, state, data, and severity
// ============================================================

// ---- Core Color Types ----

export interface RGB { r: number; g: number; b: number; }
export interface HSL { h: number; s: number; l: number; }
export interface ColorTheme {
  primary: string;
  secondary: string;
  bg: string;
  text: string;
  border: string;
  accent: string;
  muted: string;
}

// ---- Base Palette ----
// All colors are derived from a 12-hue chromatic wheel + neutrals
// Each semantic category maps to a hue family

export const HUES = {
  red: 0,
  orange: 30,
  amber: 45,
  yellow: 55,
  lime: 80,
  green: 140,
  teal: 170,
  cyan: 190,
  blue: 215,
  indigo: 240,
  purple: 270,
  pink: 330,
} as const;

export const SEMANTIC_COLORS = {
  // Status
  idle:      { h: HUES.blue,   s: 70, l: 55 },
  running:   { h: HUES.green,  s: 70, l: 50 },
  success:   { h: HUES.green,  s: 65, l: 50 },
  error:     { h: HUES.red,    s: 70, l: 55 },
  warning:   { h: HUES.amber,  s: 80, l: 55 },
  info:      { h: HUES.cyan,   s: 70, l: 55 },
  thinking:  { h: HUES.purple, s: 60, l: 55 },
  stopped:   { h: HUES.orange, s: 70, l: 55 },

  // Severity (CVSS-style)
  critical:  { h: HUES.red,    s: 80, l: 45 },
  high:      { h: HUES.orange, s: 75, l: 50 },
  medium:    { h: HUES.amber,  s: 75, l: 55 },
  low:       { h: HUES.blue,   s: 65, l: 55 },
  info_low:  { h: HUES.cyan,   s: 50, l: 55 },

  // Skill levels
  novice:    { h: HUES.green,  s: 50, l: 55 },
  beginner:  { h: HUES.teal,   s: 55, l: 55 },
  intermediate: { h: HUES.blue, s: 60, l: 55 },
  advanced:  { h: HUES.purple, s: 60, l: 55 },
  expert:    { h: HUES.orange, s: 65, l: 55 },
  master:    { h: HUES.red,    s: 60, l: 50 },

  // Categories
  recon:     { h: HUES.blue,   s: 60, l: 55 },
  exploit:   { h: HUES.red,    s: 65, l: 55 },
  post_exploit: { h: HUES.red, s: 70, l: 45 },
  network:   { h: HUES.green,  s: 55, l: 55 },
  web:       { h: HUES.amber,  s: 65, l: 55 },
  crypto:    { h: HUES.purple, s: 55, l: 55 },
  social:    { h: HUES.pink,   s: 55, l: 55 },
  system:    { h: 220,         s: 30, l: 55 },
  intel:     { h: HUES.cyan,   s: 55, l: 55 },
  utility:   { h: 220,         s: 25, l: 50 },
  ai:        { h: HUES.indigo, s: 60, l: 60 },

  // Data types
  number:    { h: HUES.teal,   s: 50, l: 55 },
  string:    { h: HUES.green,  s: 45, l: 55 },
  boolean:   { h: HUES.orange, s: 50, l: 55 },
  url:       { h: HUES.blue,   s: 60, l: 55 },
  ip:        { h: HUES.lime,   s: 60, l: 50 },
  hash:      { h: HUES.amber,  s: 50, l: 55 },
  email:     { h: HUES.cyan,   s: 55, l: 55 },
  file:      { h: HUES.purple, s: 45, l: 55 },
  command:   { h: 220,         s: 40, l: 65 },
} as const;

// ============================================================
// COLOR INFERENCE FUNCTIONS
// ============================================================

// ---- 1. Infer from value/number (gradient) ----
// Maps a numeric value 0-1 (or min/max range) to a color gradient
export function inferFromValue(
  value: number,
  min = 0,
  max = 100,
  gradient: 'red-green' | 'blue-red' | 'cool-warm' | 'traffic' = 'cool-warm'
): string {
  const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));

  switch (gradient) {
    case 'red-green':
      // 0 = red, 1 = green
      return hsl(120 * normalized, 70, 50);

    case 'blue-red':
      // 0 = blue, 1 = red
      return hsl(240 - 240 * normalized, 70, 55);

    case 'traffic':
      // 0 = green, 0.5 = yellow, 1 = red
      if (normalized < 0.5) return hsl(120 - 65 * (normalized * 2), 75, 50);
      return hsl(55 - 55 * ((normalized - 0.5) * 2), 75, 50);

    case 'cool-warm':
    default:
      // 0 = cool blue, 0.5 = neutral, 1 = warm red
      if (normalized < 0.5) return hsl(220 - 50 * (normalized * 2), 60, 55);
      return hsl(170 + 50 * ((normalized - 0.5) * 2), 70, 55);
  }
}

// ---- 2. Infer from text content ----
// Auto-detects data types in text and returns appropriate color
export function inferFromText(text: string): string {
  const t = text.trim();

  // URLs
  if (/^https?:\/\//i.test(t) || /\.(com|org|net|io|dev|app|xyz|co|me|cc|ru|cn|de|uk|fr|jp|in|br|au|ca|gov|mil|edu)$/i.test(t)) {
    return toHSL(SEMANTIC_COLORS.url);
  }
  // IP addresses
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(t) || /^[0-9a-f:]+:[0-9a-f:]+$/i.test(t)) {
    return toHSL(SEMANTIC_COLORS.ip);
  }
  // Hashes (MD5, SHA, etc.)
  if (/^[a-f0-9]{32,}$/i.test(t) || /^\$[0-9a-z\$]+$/i.test(t)) {
    return toHSL(SEMANTIC_COLORS.hash);
  }
  // Email addresses
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
    return toHSL(SEMANTIC_COLORS.email);
  }
  // File paths
  if (/^(\/|~|\.\/|\.\.\/|[A-Z]:\\)/.test(t) || /\.(sh|py|js|ts|tsx|jsx|rb|go|rs|c|cpp|h|java|json|xml|yaml|yml|toml|cfg|conf|log|txt|md|csv)$/i.test(t)) {
    return toHSL(SEMANTIC_COLORS.file);
  }
  // Boolean
  if (['true', 'false', 'yes', 'no', 'on', 'off', 'enabled', 'disabled'].includes(t.toLowerCase())) {
    return toHSL(SEMANTIC_COLORS.boolean);
  }
  // Numbers
  if (!isNaN(Number(t)) && t !== '') {
    return toHSL(SEMANTIC_COLORS.number);
  }
  // Hex colors
  if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(t)) {
    return t; // Already a color
  }
  // Commands (start with common prefixes)
  if (/^(sudo|apt|yum|pip|npm|nmap|hydra|sqlmap|gobuster|nikto|hashcat|john|aircrack|metasploit|msf|curl|wget|ssh|nc|ncat|python|ruby|bash|sh|dig|nslookup|whois|ping|traceroute|ifconfig|ip|netstat|ss|ps|ls|cat|grep|find|chmod|chown|tar|gzip)/i.test(t)) {
    return toHSL(SEMANTIC_COLORS.command);
  }

  // Default
  return '#c9d1d9';
}

// ---- 3. Infer from severity ----
export function inferFromSeverity(severity: string): string {
  const s = severity.toLowerCase();
  if (s === 'critical' || s === 'crit') return toHSL(SEMANTIC_COLORS.critical);
  if (s === 'high') return toHSL(SEMANTIC_COLORS.high);
  if (s === 'medium' || s === 'moderate' || s === 'mod') return toHSL(SEMANTIC_COLORS.medium);
  if (s === 'low') return toHSL(SEMANTIC_COLORS.low);
  if (s === 'info' || s === 'informational' || s === 'note') return toHSL(SEMANTIC_COLORS.info_low);
  // CVSS numeric
  const num = parseFloat(s);
  if (!isNaN(num)) {
    if (num >= 9) return toHSL(SEMANTIC_COLORS.critical);
    if (num >= 7) return toHSL(SEMANTIC_COLORS.high);
    if (num >= 4) return toHSL(SEMANTIC_COLORS.medium);
    if (num > 0) return toHSL(SEMANTIC_COLORS.low);
  }
  return '#8b949e';
}

export function inferSeverityBg(severity: string): string {
  const color = inferFromSeverity(severity);
  return withAlpha(color, 0.12);
}

// ---- 4. Infer from status ----
export function inferFromStatus(status: string): string {
  const s = status.toLowerCase().trim();
  if (s === 'idle' || s === 'ready' || s === 'waiting') return toHSL(SEMANTIC_COLORS.idle);
  if (s === 'running' || s === 'executing' || s === 'active' || s === 'working') return toHSL(SEMANTIC_COLORS.running);
  if (s === 'success' || s === 'completed' || s === 'done' || s === 'ok' || s === 'passed') return toHSL(SEMANTIC_COLORS.success);
  if (s === 'error' || s === 'failed' || s === 'crashed' || s === 'fatal') return toHSL(SEMANTIC_COLORS.error);
  if (s === 'warning' || s === 'warn' || s === 'risky') return toHSL(SEMANTIC_COLORS.warning);
  if (s === 'thinking' || s === 'planning' || s === 'reasoning' || s === 'analyzing') return toHSL(SEMANTIC_COLORS.thinking);
  if (s === 'stopped' || s === 'cancelled' || s === 'aborted') return toHSL(SEMANTIC_COLORS.stopped);
  return '#8b949e';
}

// ---- 5. Infer from category ----
export function inferFromCategory(category: string): string {
  const c = category.toLowerCase().replace(/[\s-]+/g, '_');
  if (c === 'recon' || c === 'reconnaissance') return toHSL(SEMANTIC_COLORS.recon);
  if (c === 'exploit' || c === 'exploitation') return toHSL(SEMANTIC_COLORS.exploit);
  if (c === 'post_exploit' || c === 'post-exploit' || c === 'postexploit') return toHSL(SEMANTIC_COLORS.post_exploit);
  if (c === 'network') return toHSL(SEMANTIC_COLORS.network);
  if (c === 'web') return toHSL(SEMANTIC_COLORS.web);
  if (c === 'crypto' || c === 'cryptography') return toHSL(SEMANTIC_COLORS.crypto);
  if (c === 'social' || c === 'social_engineering') return toHSL(SEMANTIC_COLORS.social);
  if (c === 'system') return toHSL(SEMANTIC_COLORS.system);
  if (c === 'intelligence' || c === 'intel' || c === 'osint') return toHSL(SEMANTIC_COLORS.intel);
  if (c === 'utility') return toHSL(SEMANTIC_COLORS.utility);
  if (c === 'ai' || c === 'agent' || c === 'openclaw') return toHSL(SEMANTIC_COLORS.ai);
  return '#8b949e';
}

// ---- 6. Infer from skill level ----
export function inferFromLevel(level: number): string {
  if (level <= 1) return toHSL(SEMANTIC_COLORS.novice);
  if (level <= 2) return toHSL(SEMANTIC_COLORS.beginner);
  if (level <= 3) return toHSL(SEMANTIC_COLORS.intermediate);
  if (level <= 4) return toHSL(SEMANTIC_COLORS.expert);
  return toHSL(SEMANTIC_COLORS.master);
}

// ---- 7. Infer from percentage ----
// Smart gradient: red for critical, amber for concerning, green for healthy
export function inferFromPercentage(pct: number): { color: string; bg: string; label: string } {
  if (pct >= 90) return { color: toHSL(SEMANTIC_COLORS.success), bg: withAlpha(toHSL(SEMANTIC_COLORS.success), 0.12), label: 'Excellent' };
  if (pct >= 70) return { color: toHSL(SEMANTIC_COLORS.running), bg: withAlpha(toHSL(SEMANTIC_COLORS.running), 0.12), label: 'Good' };
  if (pct >= 50) return { color: toHSL(SEMANTIC_COLORS.warning), bg: withAlpha(toHSL(SEMANTIC_COLORS.warning), 0.12), label: 'Fair' };
  if (pct >= 30) return { color: toHSL(SEMANTIC_COLORS.high), bg: withAlpha(toHSL(SEMANTIC_COLORS.high), 0.12), label: 'Poor' };
  return { color: toHSL(SEMANTIC_COLORS.error), bg: withAlpha(toHSL(SEMANTIC_COLORS.error), 0.12), label: 'Critical' };
}

// ---- 8. Infer from string (hash-based unique color) ----
// Generates a consistent color for any string (useful for sessions, IDs, names)
export function inferFromString(str: string, saturation = 55, lightness = 55): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  return hsl(hue, saturation, lightness);
}

// ---- 9. Infer progress bar color ----
export function inferProgressColor(progress: number): string {
  if (progress < 0.3) return toHSL(SEMANTIC_COLORS.error);
  if (progress < 0.7) return toHSL(SEMANTIC_COLORS.warning);
  return toHSL(SEMANTIC_COLORS.success);
}

// ---- 10. Infer terminal output color ----
// Colorizes each line based on its content
export function inferTerminalLine(line: string): string {
  const trimmed = line.trim().toLowerCase();

  // Error patterns
  if (/^(error|err|fatal|exception|traceback|panic|segfault|killed)/i.test(trimmed)) return '#f85149';
  if (/(error|failed|failure|denied|forbidden|refused|timeout|unauthorized)/i.test(trimmed)) return '#f85149';
  if (/\[error\]|\[fail\]|\[err\]|✗|❌|×/.test(trimmed)) return '#f85149';
  if (/permission denied|no such file|not found|command not found|cannot connect/i.test(trimmed)) return '#f85149';

  // Warning patterns
  if (/^(warn|warning|caution|notice)/i.test(trimmed)) return '#d29922';
  if (/\[warn\]|\[warning\]|⚠|⚠️|△/.test(trimmed)) return '#d29922';
  if (/deprecated|insecure|vulnerable|outdated/i.test(trimmed)) return '#d29922';

  // Success patterns
  if (/^(success|ok|done|complete|finished|passed)/i.test(trimmed)) return '#3fb950';
  if (/\[ok\]|\[success\]|\[✓\]|✓|✅|✔/.test(trimmed)) return '#3fb950';
  if (/open$|listening|running|started|accepted|connected/i.test(trimmed)) return '#3fb950';

  // Info / headers
  if (/^(info|information|note|debug)/i.test(trimmed)) return '#58a6ff';
  if (/\[info\]|\[debug\]|\[note\]|ℹ|ℹ️/.test(trimmed)) return '#58a6ff';

  // Thinking / AI
  if (/^\[think\]|\[plan\]|\[reason\]|🧠|💭/i.test(trimmed)) return '#bc8cff';
  if (/^(analyzing|planning|reasoning|evaluating|iterating)/i.test(trimmed)) return '#bc8cff';

  // Learning
  if (/\[learn\]|\[skill\]|\[discovered\]/i.test(trimmed)) return '#d2a8ff';

  // Tool execution
  if (/^\$ |^root@|^nex\.ai|openclaw/i.test(trimmed)) return '#79c0ff';
  if (/^(step|executing|scanning|cracking|testing|attacking|probing)/i.test(trimmed)) return '#58a6ff';

  // Port states
  if (/\/tcp\s+open/i.test(trimmed)) return '#3fb950';
  if (/\/tcp\s+filtered|\/tcp\s+closed/i.test(trimmed)) return '#f85149';

  // HTTP status codes
  if (/HTTP\/\d/.test(trimmed)) {
    if (/200|201|204/.test(trimmed)) return '#3fb950';
    if (/301|302|303|307|308/.test(trimmed)) return '#d29922';
    if (/400|401|403|404|405|408/.test(trimmed)) return '#f85149';
    if (/500|502|503|504/.test(trimmed)) return '#f85149';
  }

  // IPs
  if (/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(trimmed)) return '#7ee787';

  // URLs
  if (/https?:\/\//.test(trimmed)) return '#79c0ff';

  // Table headers and separators
  if (/^[-=+|─┌┐└┘├┤┬┴┼╔╗╚╝║═]{5,}$/.test(trimmed) || /^\+[-+]+\+$/.test(trimmed)) return '#484f58';
  if (/^PORT\s|^HOST\s|^TARGET\s|^SERVICE\s|^STATUS\s|^TYPE\s|^NAME\s|^ID\s|^LEVEL/i.test(trimmed)) return '#8b949e';

  // Numbers and sizes
  if (/^\d+(\.\d+)?\s*(kb|mb|gb|tb|ms|s|%)?$/.test(trimmed)) return '#79c0ff';

  // Hex strings (hashes)
  if (/^[a-f0-9]{16,}$/i.test(trimmed)) return '#d29922';

  // Default
  return '#c9d1d9';
}

// ============================================================
// COLOR UTILITY FUNCTIONS
// ============================================================

export function hsl(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function toHSL(c: { h: number; s: number; l: number }): string {
  return hsl(c.h, c.s, c.l);
}

export function withAlpha(color: string, alpha: number): string {
  // Handle hsl/hsla
  const hslMatch = color.match(/hsl[a]?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) {
    return `hsla(${hslMatch[1]}, ${hslMatch[2]}%, ${hslMatch[3]}%, ${alpha})`;
  }
  // Handle hex
  const hexMatch = color.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
  if (hexMatch) {
    const r = parseInt(hexMatch[1], 16);
    const g = parseInt(hexMatch[2], 16);
    const b = parseInt(hexMatch[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return color;
}

export function lighten(color: string, amount = 10): string {
  const hslMatch = color.match(/hsl[a]?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) {
    return hsl(parseInt(hslMatch[1]), parseInt(hslMatch[2]), Math.min(90, parseInt(hslMatch[3]) + amount));
  }
  return color;
}

export function darken(color: string, amount = 10): string {
  const hslMatch = color.match(/hsl[a]?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) {
    return hsl(parseInt(hslMatch[1]), parseInt(hslMatch[2]), Math.max(10, parseInt(hslMatch[3]) - amount));
  }
  return color;
}

export function saturate(color: string, amount = 10): string {
  const hslMatch = color.match(/hsl[a]?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) {
    return hsl(parseInt(hslMatch[1]), Math.min(100, parseInt(hslMatch[2]) + amount), parseInt(hslMatch[3]));
  }
  return color;
}

// Generate a complete theme from a base hue
export function generateTheme(baseHue: number): ColorTheme {
  return {
    primary: hsl(baseHue, 65, 55),
    secondary: hsl((baseHue + 30) % 360, 55, 50),
    bg: hsl(baseHue, 15, 6),
    text: hsl(baseHue, 10, 85),
    border: hsl(baseHue, 15, 18),
    accent: hsl((baseHue + 180) % 360, 60, 60),
    muted: hsl(baseHue, 10, 45),
  };
}

// Pre-built themes
export const THEMES = {
  dark_hacker: generateTheme(220),      // Blue-tinted dark
  matrix: { primary: '#00ff41', secondary: '#008f11', bg: '#0a0f0a', text: '#c0ffc0', border: '#1a2f1a', accent: '#00ff41', muted: '#3a5a3a' },
  cyberpunk: generateTheme(300),         // Pink/purple
  blood_red: generateTheme(0),           // Red theme
  phantom: generateTheme(260),           // Deep purple
  stealth: generateTheme(180),           // Teal/green
  terminal: { primary: '#50fa7b', secondary: '#8be9fd', bg: '#282a36', text: '#f8f8f2', border: '#44475a', accent: '#ff79c6', muted: '#6272a4' },
} as const;

// Pre-built status badge styles
export function getStatusBadge(status: string): { bg: string; color: string; border: string; label: string; icon: string } {
  const color = inferFromStatus(status);
  const s = status.toLowerCase().trim();
  let label = status.toUpperCase();
  let icon = '●';

  if (['idle', 'ready', 'waiting'].includes(s)) { label = 'IDLE'; icon = '●'; }
  else if (['running', 'executing', 'active', 'working'].includes(s)) { label = 'RUNNING'; icon = '▶'; }
  else if (['success', 'completed', 'done', 'ok', 'passed'].includes(s)) { label = 'COMPLETE'; icon = '✓'; }
  else if (['error', 'failed', 'crashed', 'fatal'].includes(s)) { label = 'ERROR'; icon = '✗'; }
  else if (['warning', 'warn'].includes(s)) { label = 'WARNING'; icon = '⚠'; }
  else if (['thinking', 'planning', 'analyzing'].includes(s)) { label = 'THINKING'; icon = '◉'; }
  else if (['stopped', 'cancelled'].includes(s)) { label = 'STOPPED'; icon = '■'; }

  return {
    bg: withAlpha(color, 0.15),
    color,
    border: withAlpha(color, 0.3),
    label,
    icon,
  };
}

// Pre-built severity badge styles
export function getSeverityBadge(severity: string): { bg: string; color: string; border: string; label: string; score: string } {
  const color = inferFromSeverity(severity);
  const s = severity.toLowerCase();
  let label = severity.toUpperCase();
  let score = '';

  if (['critical', 'crit'].includes(s)) { label = 'CRITICAL'; score = '9.0-10.0'; }
  else if (s === 'high') { label = 'HIGH'; score = '7.0-8.9'; }
  else if (['medium', 'moderate', 'mod'].includes(s)) { label = 'MEDIUM'; score = '4.0-6.9'; }
  else if (s === 'low') { label = 'LOW'; score = '0.1-3.9'; }
  else if (['info', 'informational'].includes(s)) { label = 'INFO'; score = '0.0'; }

  return {
    bg: withAlpha(color, 0.15),
    color,
    border: withAlpha(color, 0.3),
    label,
    score,
  };
}
