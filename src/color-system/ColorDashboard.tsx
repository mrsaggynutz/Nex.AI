import React from 'react';
import {
  ColorProvider, useColors, StatusBadge, SeverityBadge, InferProgressBar,
  PercentageDisplay, CategoryTag, ColoredValue, ThemeSwitcher, InferStyles,
} from './infer-hooks.js';
import AutoColorTerminal from './AutoColorTerminal.js';

// ============================================================
// Nex.AI Global Theme Provider
// Wrap your App with this to enable inferred colors everywhere
// ============================================================

export function NexAIColorProvider({ children }: { children: React.ReactNode }) {
  return (
    <ColorProvider initialTheme="dark_hacker">
      {children}
    </ColorProvider>
  );
}

// ============================================================
// Dashboard — Show all inferred color components in action
// Use this as a reference/demo page, or as a live dashboard panel
// ============================================================

export default function ColorDashboard() {
  const { infer, theme, themeName } = useColors();

  return (
    <div style={{
      padding: '20px',
      fontFamily: "'JetBrains Mono', monospace",
      background: theme.bg,
      color: theme.text,
      minHeight: '100%',
    }}>
      <InferStyles />

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '20px', fontWeight: 700, color: theme.primary, marginBottom: '4px' }}>
          🎨 Inferred Color System
        </div>
        <div style={{ fontSize: '12px', color: theme.muted }}>
          Theme: {themeName} | <ThemeSwitcher />
        </div>
      </div>

      {/* Status Badges */}
      <Section title="Status Inference" description="Colors are inferred from status keywords">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge status="idle" size="md" />
          <StatusBadge status="running" size="md" />
          <StatusBadge status="thinking" size="md" />
          <StatusBadge status="success" size="md" />
          <StatusBadge status="error" size="md" />
          <StatusBadge status="warning" size="md" />
          <StatusBadge status="stopped" size="md" />
        </div>
      </Section>

      {/* Severity Badges */}
      <Section title="Severity Inference" description="CVSS-style severity coloring">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <SeverityBadge severity="critical" />
          <SeverityBadge severity="high" />
          <SeverityBadge severity="medium" />
          <SeverityBadge severity="low" />
          <SeverityBadge severity="info" />
          <SeverityBadge severity="9.8" />
          <SeverityBadge severity="4.2" />
        </div>
      </Section>

      {/* Category Tags */}
      <Section title="Category Inference" description="Skill/tool categories get unique color families">
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <CategoryTag category="recon" icon="🔍" />
          <CategoryTag category="exploit" icon="💣" />
          <CategoryTag category="post-exploit" icon="💀" />
          <CategoryTag category="network" icon="🌐" />
          <CategoryTag category="web" icon="🕷️" />
          <CategoryTag category="crypto" icon="🔐" />
          <CategoryTag category="social" icon="🎭" />
          <CategoryTag category="system" icon="⚙️" />
          <CategoryTag category="intelligence" icon="🧠" />
          <CategoryTag category="ai" icon="🦀" />
        </div>
      </Section>

      {/* Progress Bars */}
      <Section title="Value/Progress Inference" description="Numbers automatically map to color gradients">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <InferProgressBar value={15} max={100} label="CPU Usage (Critical)" />
          <InferProgressBar value={65} max={100} label="Memory (Warning)" />
          <InferProgressBar value={92} max={100} label="Success Rate" />
          <InferProgressBar value={3} max={10} label="Steps Complete" />
        </div>
      </Section>

      {/* Percentage Displays */}
      <Section title="Percentage Metrics" description="Auto-graded with color and rating label">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
          <PercentageDisplay value={95} label="Uptime" />
          <PercentageDisplay value={73} label="Accuracy" />
          <PercentageDisplay value={45} label="Coverage" />
          <PercentageDisplay value={28} label="Score" />
          <PercentageDisplay value={8} label="Health" />
        </div>
      </Section>

      {/* Auto-detected Values */}
      <Section title="Text Inference" description="Data types are auto-detected and colored">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <ValueRow label="URL" value="https://api.groq.com/openai/v1" />
          <ValueRow label="IPv4" value="192.168.1.50" />
          <ValueRow label="Hash" value="5f4dcc3b5aa765d61d8327deb882cf99" />
          <ValueRow label="Email" value="admin@target.com" />
          <ValueRow label="File" value="/etc/passwd" />
          <ValueRow label="Command" value="nmap -sV -T4 192.168.1.0/24" />
          <ValueRow label="Boolean" value="true" />
          <ValueRow label="Number" value="443" />
        </div>
      </Section>

      {/* String-hash colors */}
      <Section title="Unique ID Colors" description="Consistent colors generated from any string">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {['session-a1b2', 'scan-192.168.1.1', 'exploit-sqli-01', 'report-pentest', 'agent-openclaw'].map(id => (
            <div key={id} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px',
            }}>
              <div style={{
                width: '10px', height: '10px', borderRadius: '50%',
                background: inferFromString(id),
              }} />
              <span style={{ fontSize: '12px', color: inferFromString(id) }}>{id}</span>
            </div>
          ))}
        </div>
      </Section>

      {/* Auto-Coloring Terminal Demo */}
      <Section title="Terminal Output" description="Full auto-colorization — errors, warnings, IPs, ports, HTTP codes">
        <AutoColorTerminal
          title="OpenClaw Agent Output"
          output={`[THINK] Analyzing target 192.168.1.0/24...
[PLAN] 3 steps identified

Step 1/3: Network scan
$ nmap -sV -T4 192.168.1.0/24
Starting Nmap 7.94 ( https://nmap.org )
Nmap scan report for 192.168.1.1
Host is up (0.0030s latency).
PORT    STATE     SERVICE   VERSION
22/tcp  open      ssh       OpenSSH 8.9
80/tcp  open      http      Apache 2.4.54
443/tcp open      ssl/http  Apache 2.4.54
3306/tcp filtered mysql
8080/tcp closed   http-proxy

[OK] 3 hosts discovered
[OK] 5 open ports found

Step 2/3: Web reconnaissance
$ gobuster dir -u http://192.168.1.1
/admin (Status: 301) [Size: 312]
/api (Status: 200) [Size: 48]
/login (Status: 200) [Size: 2048]
/uploads (Status: 403) [Size: 278]
/config (Status: 403) [Size: 278]

[WARN] /admin redirects — potential brute-force target
[ERROR] /config returned 403 — may need auth bypass

Step 3/3: Testing login page
$ curl -I http://192.168.1.1/login
HTTP/1.1 200 OK
X-Powered-By: PHP/8.1.0
Set-Cookie: session=abc123def456

[SUCCESS] Login page identified — PHP 8.1 with session cookies
[LEARN] New skill: WAF Bypass (level 3)

ERROR: Connection timeout on port 3306
WARNING: SSL certificate expired for 192.168.1.1
Password hash found: 5f4dcc3b5aa765d61d8327deb882cf99
Email discovered: admin@target-network.com`}
          maxHeight={350}
          showLineNumbers
        />
      </Section>

      {/* Color Themes Preview */}
      <Section title="Available Themes" description="Click the ThemeSwitcher above to cycle through">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '8px' }}>
          {[
            { name: 'dark_hacker', color: '#58a6ff' },
            { name: 'matrix', color: '#00ff41' },
            { name: 'cyberpunk', color: '#ff00ff' },
            { name: 'blood_red', color: '#ff4444' },
            { name: 'phantom', color: '#bc8cff' },
            { name: 'stealth', color: '#00d4aa' },
            { name: 'terminal', color: '#50fa7b' },
          ].map(t => (
            <div key={t.name} style={{
              background: 'rgba(255,255,255,0.03)', borderRadius: '8px',
              padding: '12px', border: '1px solid #21262d',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%',
                  background: t.color, boxShadow: `0 0 10px ${t.color}`,
                }} />
                <span style={{ fontSize: '12px', fontWeight: 600, color: t.color }}>
                  {t.name.replace(/_/g, ' ')}
                </span>
              </div>
              <div style={{
                height: '4px', borderRadius: '2px',
                background: `linear-gradient(90deg, ${t.color}, ${t.color}44)`,
              }} />
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}

// ---- Helper Components ----

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{ fontSize: '14px', fontWeight: 700, color: '#c9d1d9', marginBottom: '2px' }}>{title}</div>
      <div style={{ fontSize: '11px', color: '#8b949e', marginBottom: '10px' }}>{description}</div>
      <div style={{ background: '#161b22', borderRadius: '8px', padding: '14px', border: '1px solid #21262d' }}>
        {children}
      </div>
    </div>
  );
}

function ValueRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px 8px', background: '#0d1117', borderRadius: '4px' }}>
      <span style={{ fontSize: '10px', color: '#8b949e', width: '60px' }}>{label}</span>
      <ColoredValue value={value} />
    </div>
  );
}

function inferFromString(str: string, sat?: number, light?: number): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, ${sat || 55}%, ${light || 55}%)`;
}
