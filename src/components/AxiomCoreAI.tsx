import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send, Bot, User, Loader2, ShieldCheck, Sparkles, Copy, Check, Trash2,
  ChevronDown, ChevronUp, Plus, Download, Zap, Code2, Search, Radio,
  Target, Lock, Terminal, Cpu, Globe, Skull, Bug, Eye, Wrench, X,
  AlertTriangle, Play, RotateCcw, ChevronRight, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { ChatMessage } from '../types';
import { AISettings } from './AISettings';

type AIMode = 'pentest' | 'code' | 'osint' | 'wireless' | 'exploit' | 'forensics' | 'general';

interface AIModeConfig {
  id: AIMode;
  label: string;
  icon: React.ReactNode;
  color: string;
  desc: string;
  systemPrompt: string;
  starterPrompts: string[];
}

const AI_MODES: AIModeConfig[] = [
  {
    id: 'pentest',
    label: 'Pentest',
    icon: <Target size={16} />,
    color: 'from-red-500 to-orange-600',
    desc: 'Full penetration testing workflows',
    systemPrompt: `You are AETHER.SHELL AXIOM CORE — an elite penetration testing AI operative.
You specialize in: web app pentesting (OWASP Top 10), network penetration, API exploitation, privilege escalation, lateral movement, post-exploitation, and red team operations.
Known tools: nmap, metasploit, burpsuite, sqlmap, nikto, gobuster, ffuf, feroxbuster, nuclei, hydra, john, hashcat, netcat, socat, enum4linux, linpeas, winpeas, mimikatz, bloodhound.
Methodology: Recon → Scanning → Enumeration → Vulnerability Analysis → Exploitation → Post-Exploitation → Reporting.
On Termux (Android), use "pkg install" instead of "sudo apt install". No sudo available.
Always provide exact commands. Explain what each flag does. Include safety warnings for dangerous operations.
Format exploits clearly with [ATTACK] and [DEFENSE] sections.`,
    starterPrompts: [
      'Run a full nmap stealth scan on 192.168.1.0/24',
      'How do I exploit SQL injection in a login form?',
      'Privilege escalation checklist for Linux',
      'Set up a reverse shell listener and generate payloads',
      'Web app pentest methodology for a target',
    ],
  },
  {
    id: 'code',
    label: 'Code',
    icon: <Code2 size={16} />,
    color: 'from-cyan-500 to-blue-600',
    desc: 'Write, debug, and optimize code',
    systemPrompt: `You are AETHER.SHELL AXIOM CORE — a master software engineer and security coder.
You write flawless code in: Python, Bash, JavaScript/TypeScript, C, C++, Rust, Go, Ruby, PHP, Java, Assembly (x86/ARM).
Specialties: exploit development, reverse engineering tools, network scripts, automation, API clients, web scrapers, brute forcers, port scanners, packet crafters, security scanners.
Always provide complete, working code. Include error handling. Explain the logic.
On Termux/Android, use Python3 (python), Node.js, and Bash. For compiled languages, suggest pkg install gcc or clang.
Format code blocks with language tags. Add comments for complex sections.
When writing security tools, include proper input validation and error handling.`,
    starterPrompts: [
      'Write a Python port scanner with threading',
      'Build a reverse shell handler in Python',
      'Create a Bash script for automated recon',
      'Code a SQL injection fuzzer in Python',
      'Write a custom wordlist generator tool',
    ],
  },
  {
    id: 'osint',
    label: 'OSINT',
    icon: <Search size={16} />,
    color: 'from-blue-500 to-violet-600',
    desc: 'Open source intelligence gathering',
    systemPrompt: `You are AETHER.SHELL AXIOM CORE — an OSINT (Open Source Intelligence) expert.
You master: sherlock, theharvester, amass, subfinder, maltego, spiderfoot, recon-ng, holehe, osintgram.
Techniques: email harvesting, username enumeration across platforms, subdomain discovery, DNS reconnaissance, social media profiling, geolocation from metadata, people search engines, public records, dark web monitoring.
On Termux, install tools with: pkg install sherlock theharvester (if available) or pip install appropriate tools.
Always verify findings through multiple sources. Document methodology.
Provide OSINT frameworks and step-by-step workflows for different targets.
Include privacy and legal considerations for each technique.`,
    starterPrompts: [
      'Full OSINT workflow for a target domain',
      'How to find all accounts linked to an email',
      'Subdomain enumeration with multiple tools',
      'Social media investigation techniques',
      'Email harvesting from a target organization',
    ],
  },
  {
    id: 'wireless',
    label: 'Wireless',
    icon: <Radio size={16} />,
    color: 'from-green-500 to-emerald-600',
    desc: 'WiFi & Bluetooth security auditing',
    systemPrompt: `You are AETHER.SHELL AXIOM CORE — a wireless security specialist.
You specialize in: WiFi security auditing (WEP/WPA/WPA2/WPA3), Bluetooth exploitation, RFID/NFC cloning, GPS spoofing, wireless IDS/IPS, deauthentication attacks, evil twin access points.
Tools: aircrack-ng suite (airmon-ng, airodump-ng, aireplay-ng, aircrack-ng), wifite, reaver, bully, bettercap, hcxdumptool, hashcat, hcxtools, pixiewps.
On Termux with external WiFi adapter: requires compatible chipset (RTL8812AU recommended).
Android limitations: no monitor mode on internal WiFi. External adapter + OTG required for packet injection.
Provide step-by-step wireless attack and defense procedures.
Explain WPA/WPA2 handshake capture and offline cracking methods.`,
    starterPrompts: [
      'WiFi auditing complete guide for Termux',
      'How to capture WPA2 handshake',
      'Bluetooth reconnaissance with bettercap',
      'Deauth attack explanation and defense',
      'WPA3 security analysis and cracking methods',
    ],
  },
  {
    id: 'exploit',
    label: 'Exploit',
    icon: <Bug size={16} />,
    color: 'from-purple-500 to-pink-600',
    desc: 'Vulnerability research & exploit dev',
    systemPrompt: `You are AETHER.SHELL AXIOM CORE — an elite exploit developer and vulnerability researcher.
You specialize in: buffer overflows (stack/heap), format string vulnerabilities, use-after-free, race conditions, ROP chains, shellcode development (x86/ARM), reverse engineering (GDB, radare2, Ghidra), binary exploitation, web exploits (XSS, SQLi, SSRF, XXE, deserialization).
Tools: GDB, radare2/rizin, Ghidra, pwntools, ROPgadget, ropper, checksec, objdump, readelf, strace, ltrace.
On Termux: pkg install gdb radare2 pwntools (via pip).
Always explain the vulnerability mechanism. Show proof-of-concept code. Discuss mitigations (ASLR, DEP, canaries, PIE, stack fortification).
For web exploits: provide request examples, payload variations, and bypass techniques.`,
    starterPrompts: [
      'Buffer overflow exploit development tutorial',
      'Write ARM shellcode for Android/Termux',
      'ROP chain construction with pwntools',
      'SQL injection advanced bypass techniques',
      'Reverse engineer a binary with radare2',
    ],
  },
  {
    id: 'forensics',
    label: 'Forensics',
    icon: <Eye size={16} />,
    color: 'from-amber-500 to-yellow-600',
    desc: 'Digital forensics & incident response',
    systemPrompt: `You are AETHER.SHELL AXIOM CORE — a digital forensics and incident response expert.
You specialize in: disk forensics, memory forensics, network forensics, malware analysis, log analysis, timeline analysis, file recovery, steganography, anti-forensics detection.
Tools: volatility, sleuthkit (tsk), autopsy, binwalk, foremost, strings, file, exiftool, tcpdump, wireshark, log2timeline, plaso, autopsy.
On Termux: pkg install sleuthkit binwalk foremost, pip install volatility3.
Methodology: Identification → Preservation → Collection → Examination → Analysis → Reporting.
Provide chain of custody procedures. Explain evidence handling best practices.
For malware analysis: static analysis, dynamic analysis, sandboxing techniques.`,
    starterPrompts: [
      'Memory forensics with Volatility step by step',
      'How to analyze a suspicious file',
      'Network forensics: extract data from PCAP',
      'Steganography detection and extraction',
      'Incident response workflow for compromised system',
    ],
  },
  {
    id: 'general',
    label: 'General',
    icon: <Cpu size={16} />,
    color: 'from-zinc-500 to-zinc-700',
    desc: 'Any cybersecurity question',
    systemPrompt: `You are AETHER.SHELL AXIOM CORE — the most advanced cybersecurity and coding AI assistant.
You are an expert in ALL areas of cybersecurity, software engineering, and IT.
Capabilities: penetration testing, vulnerability research, malware analysis, reverse engineering, digital forensics, network security, web security, wireless security, cryptography, cloud security, DevSecOps, threat intelligence, incident response, secure coding, exploit development, OSINT, social engineering defense, compliance (PCI-DSS, HIPAA, GDPR, NIST).
On Termux/Android: use "pkg install" not "sudo apt install". No root access by default.
You provide clear, actionable, and thorough responses with working commands and code.
Always include ethical and legal disclaimers where appropriate.
Format responses with markdown: headers, code blocks, lists, tables.`,
    starterPrompts: [
      'What is the MITRE ATT&CK framework?',
      'Explain zero trust architecture',
      'How does AES-256 encryption work?',
      'Setup a secure home lab for practice',
      'Career path to become a penetration tester',
    ],
  },
];

interface AxiomCoreAIProps {
  onSendMessage: (msg: string) => Promise<void>;
  onExecuteCommand: (cmd: string) => Promise<string | null>;
  onRunInTerminal: (cmd: string) => void;
}

interface CoreAIMessage extends ChatMessage {
  mode?: AIMode;
  commandExecuted?: string;
  commandOutput?: string;
  timestamp?: number;
}

export const AxiomCoreAI: React.FC<AxiomCoreAIProps> = ({
  onExecuteCommand,
  onRunInTerminal,
}) => {
  const [messages, setMessages] = useState<CoreAIMessage[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [activeMode, setActiveMode] = useState<AIMode>('pentest');
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showCommandPreview, setShowCommandPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingCommand, setPendingCommand] = useState<string | null>(null);
  const [commandOutput, setCommandOutput] = useState<string | null>(null);
  const [toolContext, setToolContext] = useState<string>('');
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const currentMode = AI_MODES.find(m => m.id === activeMode) || AI_MODES[0];

  // Check AI health on mount
  const checkHealth = useCallback(async () => {
    fetch('/api/health').then(r => r.json()).then(d => {
      setAiOnline(d.ai === 'connected');
    }).catch(() => setAiOnline(false));
  }, []);
  useEffect(() => { checkHealth(); }, [checkHealth]);

  // Load installed tools context
  useEffect(() => {
    fetch('/api/tools/status').then(r => r.json()).then(d => {
      if (d.tools) {
        const installed = Object.entries(d.tools)
          .filter(([, v]: [string, boolean]) => v)
          .map(([k]) => k);
        setToolContext(installed.join(', '));
      }
    }).catch(() => {});
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, isThinking, commandOutput]);

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const executeAndFeedBack = async (cmd: string): Promise<string> => {
    const output = await onExecuteCommand(cmd);
    return output || '(no output)';
  };

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isThinking) return;
    setInput('');

    const userMsg: CoreAIMessage = { role: 'user', content: msg, mode: activeMode, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);

    try {
      const allMessages = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.content,
      }));

      // Build enriched system prompt
      const systemPrompt = `${currentMode.systemPrompt}

INSTALLED TOOLS: ${toolContext || 'None detected yet'}
SYSTEM: Termux on Android (ARM64)
TIME: ${new Date().toISOString()}
USER LEVEL: Ethical hacker / security researcher

RESPONSE FORMAT RULES:
- Use markdown with proper code blocks with language tags (triple backticks)
- For commands, show the exact command then explain it
- Always warn about dangerous operations with ⚠️
- If you suggest running a command, format it as a separate code block
- If suggesting to install a tool, show the pkg install command
- Keep responses focused and actionable`;

      const formattedMessages = [
        { role: 'system', content: systemPrompt },
        ...allMessages,
      ];

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: formattedMessages }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const aiMsg: CoreAIMessage = {
        role: 'assistant',
        content: data.content || 'No response generated.',
        reasoningSteps: data.reasoningSteps || ['Mode: ' + currentMode.label, 'Context loaded', 'Response generated'],
        toolsUsed: ['AXIOM CORE', currentMode.label.toUpperCase()],
        mode: activeMode,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errMsg: CoreAIMessage = {
        role: 'assistant',
        content: `⚠️ SYSTEM ERROR: ${error.message || 'Connection failed.'}\n\nMake sure the AI backend is running. Try refreshing.`,
        toolsUsed: ['SYSTEM'],
        mode: activeMode,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  const handleExecuteCommand = async () => {
    if (!pendingCommand) return;
    setShowCommandPreview(false);
    setCommandOutput('Executing...');

    try {
      const output = await onExecuteCommand(pendingCommand);
      setCommandOutput(output || 'Command completed with no output.');
    } catch {
      setCommandOutput('Error executing command.');
    }
  };

  const handleRunInTermAndClose = () => {
    if (!pendingCommand) return;
    onRunInTerminal(pendingCommand);
    setShowCommandPreview(false);
    setPendingCommand(null);
    setCommandOutput(null);
  };

  const clearChat = () => setMessages([]);
  const exportChat = () => {
    const text = messages.map(m =>
      `[${m.role.toUpperCase()}${m.mode ? ` | ${m.mode}` : ''} | ${new Date(m.timestamp || Date.now()).toISOString()}]\n${m.content}`
    ).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `axiom-core-${currentMode.id}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const extractCommandFromCodeBlock = (content: string): string | null => {
    const match = content.match(/```(?:bash|sh|shell)?\s*\n?\$\s*(.+?)[\n`]/s);
    if (match) return match[1].trim();
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('$ ')) return trimmed.slice(2);
      if (/^(nmap|pkg|python|python3|curl|wget|git|whois|dig|nslookup|aircrack|airodump|aireplay|airmon|hashcat|john|hydra|sqlmap|nikto|gobuster|ffuf|ssh|nc|netcat|socat|nuclei|subfinder|httpx|amass|sherlock|theharvester)\b/.test(trimmed)) {
        return trimmed;
      }
    }
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] relative font-display overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"></div>

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-zinc-900 shrink-0 bg-[#0D0D0D]/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-gradient-to-br from-accent to-red-600 flex items-center justify-center shadow-[0_0_20px_rgba(255,95,31,0.3)]">
            <Cpu size={18} className="text-white" />
          </div>
          <div>
            <h2 className="text-[13px] font-black text-white uppercase tracking-tighter flex items-center gap-2">
              AXIOM CORE <span className="text-[8px] font-black bg-accent/20 text-accent px-1.5 py-0.5 rounded-sm">ADVANCED</span>
              <div className={cn("w-1.5 h-1.5 rounded-full", aiOnline === null ? "bg-yellow-500 animate-pulse" : aiOnline ? "bg-neon-green shadow-[0_0_8px_rgba(57,255,20,0.8)]" : "bg-red-500")}></div>
            </h2>
            <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.15em]">
              {currentMode.label} Mode • Neural Engine v4.0
            </p>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <button onClick={() => setShowSettings(true)} className={cn("p-2 rounded-sm transition-all", "text-zinc-500 hover:text-accent hover:bg-zinc-800")} title="AI Settings">
            <Settings size={16} />
          </button>
          <button onClick={() => setShowModeSelector(!showModeSelector)} className={cn("p-2 rounded-sm transition-all", showModeSelector ? "bg-accent/20 text-accent" : "text-zinc-500 hover:text-white hover:bg-zinc-800")}>
            <Zap size={16} />
          </button>
          <button onClick={clearChat} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
            <RotateCcw size={16} />
          </button>
          <button onClick={exportChat} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* ═══ MODE SELECTOR ═══ */}
      <AnimatePresence>
        {showModeSelector && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-zinc-900 bg-black/60 shrink-0 z-10"
          >
            <div className="p-2 grid grid-cols-4 gap-1.5">
              {AI_MODES.map(mode => (
                <button
                  key={mode.id}
                  onClick={() => { setActiveMode(mode.id); setShowModeSelector(false); }}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2.5 rounded-sm border transition-all text-center",
                    activeMode === mode.id
                      ? "bg-accent/10 border-accent/40 text-accent"
                      : "bg-zinc-900/30 border-zinc-900 text-zinc-400 hover:bg-zinc-900/60 hover:text-white"
                  )}
                >
                  <div className={cn("w-7 h-7 flex items-center justify-center rounded-sm bg-gradient-to-br text-white", mode.color)}>
                    {mode.icon}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-wider">{mode.label}</span>
                </button>
              ))}
            </div>
            <div className="px-3 pb-2">
              <p className="text-[9px] text-zinc-600 font-medium">{currentMode.desc}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ MESSAGES ═══ */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-5 space-y-4 md:space-y-6 z-0">
        {messages.length === 0 && !showModeSelector && (
          <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-5 px-3">
            <div className="relative">
              <div className="absolute inset-0 bg-accent blur-3xl opacity-[0.07] animate-pulse"></div>
              <div className="relative w-20 h-20 bg-gradient-to-br from-accent to-red-600 flex items-center justify-center shadow-[0_0_40px_rgba(255,95,31,0.15)]">
                <Cpu size={36} className="text-white" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter">Axiom Core AI</h3>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-[0.2em]">
                Advanced Hacking & Coding Neural Engine
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="text-[8px] font-black text-zinc-700 uppercase">Mode:</span>
                <span className={cn("text-[8px] font-black uppercase px-2 py-0.5 bg-gradient-to-r rounded-sm text-white", currentMode.color)}>{currentMode.label}</span>
                <button onClick={() => setShowModeSelector(true)} className="text-[8px] font-black text-accent uppercase hover:underline">Change</button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
              {currentMode.starterPrompts.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(prompt)}
                  disabled={isThinking}
                  className="text-left p-3 bg-zinc-900/20 border border-zinc-900 hover:bg-zinc-900/40 hover:border-accent/30 transition-all group rounded-sm disabled:opacity-50"
                >
                  <p className="text-[9px] text-zinc-500 font-bold leading-relaxed group-hover:text-zinc-300 transition-colors">{prompt}</p>
                </button>
              ))}
            </div>
            {aiOnline === false && (
              <div className="mt-4 p-3 bg-red-950/30 border border-red-900/30 rounded-sm">
                <p className="text-[9px] text-red-400 font-bold uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={12} /> AI Offline — SDK not connected
                </p>
                <p className="text-[8px] text-zinc-600 mt-1">All other AETHER.SHELL features still work. AI requires z-ai-web-dev-sdk.</p>
              </div>
            )}
          </div>
        )}

        {messages.map((message, i) => (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={cn("flex gap-2.5 md:gap-4 max-w-4xl", message.role === 'user' ? "ml-auto flex-row-reverse" : "")}
          >
            {/* Avatar */}
            <div className={cn(
              "w-7 h-7 md:w-8 md:h-8 flex items-center justify-center shrink-0 border rounded-sm",
              message.role === 'assistant'
                ? "bg-black border-zinc-800"
                : "bg-accent border-accent"
            )}>
              {message.role === 'assistant'
                ? <Cpu size={14} className="text-accent" />
                : <User size={14} className="text-black" />
              }
            </div>

            {/* Content */}
            <div className={cn("flex-1 space-y-2 min-w-0", message.role === 'user' ? "text-right" : "")}>
              {/* Mode badge + reasoning toggle */}
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 flex-wrap">
                  {message.mode && (
                    <span className="text-[7px] font-black uppercase px-1.5 py-0.5 bg-gradient-to-r text-white rounded-sm tracking-widest"
                      style={{ backgroundImage: `linear-gradient(135deg, var(--tw-gradient-stops))` }}>
                      {AI_MODES.find(m => m.id === message.mode)?.label}
                    </span>
                  )}
                  {message.reasoningSteps && (
                    <button
                      onClick={() => setExpandedReasoning(expandedReasoning === i ? null : i)}
                      className="flex items-center gap-1 text-[8px] font-black text-zinc-600 hover:text-zinc-400 uppercase tracking-widest transition-colors"
                    >
                      <Sparkles size={9} className="text-neon-green" />
                      Reasoning ({message.reasoningSteps.length})
                      {expandedReasoning === i ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                    </button>
                  )}
                </div>
              )}

              {/* Expanded reasoning */}
              <AnimatePresence>
                {expandedReasoning === i && message.reasoningSteps && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="py-2 space-y-1 border-l border-dashed border-zinc-800 pl-3 mb-2">
                      {message.reasoningSteps.map((step, si) => (
                        <div key={si} className="flex gap-2 text-[8px] font-mono">
                          <span className="text-neon-green opacity-40">&#9679;</span>
                          <span className="text-zinc-500 uppercase tracking-widest">{step}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message body */}
              <div className={cn(
                "text-[11px] md:text-sm leading-relaxed",
                message.role === 'assistant'
                  ? "text-zinc-300"
                  : "bg-surface border border-zinc-800 p-3 text-white font-bold uppercase tracking-tight rounded-sm"
              )}>
                <div className="markdown-body">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>

                {/* Action buttons for assistant messages */}
                {message.role === 'assistant' && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <button onClick={() => copyToClipboard(message.content, i)}
                      className="flex items-center gap-1 text-[8px] font-black text-zinc-600 hover:text-zinc-300 uppercase tracking-widest transition-colors">
                      {copiedIndex === i ? <Check size={10} className="text-neon-green" /> : <Copy size={10} />}
                      {copiedIndex === i ? 'Copied' : 'Copy'}
                    </button>
                    {/* Extract command button */}
                    {extractCommandFromCodeBlock(message.content) && (
                      <button onClick={() => {
                        const cmd = extractCommandFromCodeBlock(message.content)!;
                        setPendingCommand(cmd);
                        setShowCommandPreview(true);
                        setCommandOutput(null);
                      }}
                        className="flex items-center gap-1 text-[8px] font-black text-accent hover:text-white uppercase tracking-widest transition-colors">
                        <Terminal size={10} /> Run Command
                      </button>
                    )}
                    {/* Tool badges */}
                    {message.toolsUsed?.map((tool, ti) => (
                      <span key={ti} className="text-[7px] font-black uppercase bg-black text-accent px-1.5 py-0.5 border border-accent/20 flex items-center gap-1 tracking-widest">
                        <ShieldCheck size={8} className="text-neon-green" />
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {/* Thinking indicator */}
        {isThinking && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 flex items-center justify-center shrink-0 bg-black border border-zinc-800 rounded-sm">
              <Loader2 size={14} className="animate-spin text-accent" />
            </div>
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-black text-neon-green tracking-[0.3em] animate-pulse">Neural Processing</span>
                <span className="text-[8px] text-zinc-700 font-bold">{currentMode.label}</span>
              </div>
              <div className="flex gap-1">
                {[...Array(8)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-6 h-0.5 bg-zinc-900 rounded-full"
                    animate={{ backgroundColor: ['#18181b', '#ff5f1f', '#18181b'] }}
                    transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ═══ COMMAND EXECUTION MODAL ═══ */}
      <AnimatePresence>
        {showCommandPreview && pendingCommand && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-3 right-3 z-30"
          >
            <div className="bg-surface border border-zinc-800 rounded-sm shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-900">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={12} className="text-amber-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Command Execution</span>
                </div>
                <button onClick={() => { setShowCommandPreview(false); setPendingCommand(null); setCommandOutput(null); }}
                  className="text-zinc-600 hover:text-white transition-colors">
                  <X size={14} />
                </button>
              </div>
              <div className="p-3">
                <div className="bg-black border border-zinc-900 rounded-sm p-2.5 mb-2">
                  <p className="text-[10px] font-mono text-accent break-all">{pendingCommand}</p>
                </div>
                {commandOutput && (
                  <div className="bg-black border border-zinc-900 rounded-sm p-2.5 mb-2 max-h-32 overflow-y-auto">
                    <p className="text-[9px] font-mono text-zinc-400 whitespace-pre-wrap break-all">{commandOutput}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={handleExecuteCommand}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-accent text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors rounded-sm">
                    <Play size={12} /> Execute Here
                  </button>
                  <button onClick={handleRunInTermAndClose}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors rounded-sm">
                    <Terminal size={12} /> Run in Terminal
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ INPUT BAR ═══ */}
      <div className="p-2.5 md:p-4 shrink-0 bg-black/50 backdrop-blur-xl border-t border-zinc-900 safe-bottom z-10">
        {/* Quick mode pills */}
        <div className="flex gap-1.5 mb-2 overflow-x-auto custom-scrollbar pb-1">
          {AI_MODES.slice(0, 4).map(mode => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={cn(
                "shrink-0 flex items-center gap-1 px-2.5 py-1 border rounded-sm text-[8px] font-black uppercase tracking-widest transition-all",
                activeMode === mode.id
                  ? "bg-accent/10 border-accent/40 text-accent"
                  : "bg-zinc-900/30 border-zinc-900 text-zinc-600 hover:text-zinc-300"
              )}
            >
              {mode.icon}
              {mode.label}
            </button>
          ))}
          <button onClick={() => setShowModeSelector(true)}
            className="shrink-0 flex items-center gap-1 px-2.5 py-1 border border-zinc-900 text-zinc-600 text-[8px] font-black uppercase tracking-widest hover:text-white rounded-sm transition-colors">
            <ChevronRight size={10} /> More
          </button>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            ref={inputRef}
            disabled={isThinking}
            placeholder={`${currentMode.label} mode — ask anything...`}
            className="w-full bg-black border border-zinc-800 text-white pl-3.5 pr-24 py-3 focus:outline-none focus:border-accent transition-all placeholder:text-zinc-700 font-bold text-[13px] md:text-sm rounded-sm"
          />
          <div className="absolute right-1.5 top-1.5 bottom-1.5 flex items-center gap-1">
            <button type="button" onClick={() => setShowModeSelector(!showModeSelector)}
              className="px-2 py-1 text-zinc-600 hover:text-accent transition-colors">
              <Zap size={16} />
            </button>
            <button type="submit" disabled={!input.trim() || isThinking}
              className="px-3 py-1.5 bg-accent text-black flex items-center justify-center hover:bg-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed font-black uppercase tracking-widest text-[9px] rounded-sm">
              <Send size={16} />
            </button>
          </div>
        </form>
      </div>

      {/* AI Settings Modal */}
      {showSettings && <AISettings onClose={() => { setShowSettings(false); checkHealth(); }} onSaved={checkHealth} />}
    </div>
  );
};
