// ============================================================
// OpenClaw — Skill Tree System
// Dynamic skill discovery, learning, and dependency management
// ============================================================

import { Skill, SkillTree, ToolCategory, ExecutionContext } from './types.js';

export class SkillTreeEngine {
  private tree: SkillTree;
  private learningLog: Array<{ skill: string; method: string; timestamp: number }> = [];

  constructor() {
    this.tree = {
      skills: new Map(),
      categories: {} as Record<ToolCategory, string[]>,
      rootSkills: [],
      discoveredPaths: [],
    };
    this.initializeBuiltinSkills();
  }

  // ---- Built-in skill library ----
  private initializeBuiltinSkills(): void {
    const builtinSkills: Omit<Skill, 'id'>[] = [
      // === RECON (Level 1-2) ===
      {
        name: 'Network Scanning',
        description: 'Scan networks to discover hosts, open ports, and running services using nmap, masscan, or custom probes.',
        category: 'recon',
        level: 1,
        prerequisites: [],
        tools: ['shell_execute', 'network_scan'],
        knowledge: ['nmap flags', 'TCP/UDP scanning', 'service fingerprinting', 'OS detection'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Web Reconnaissance',
        description: 'Gather intelligence about web applications: directories, technologies, endpoints, parameters, and hidden content.',
        category: 'recon',
        level: 1,
        prerequisites: [],
        tools: ['shell_execute', 'http_request', 'web_scraper'],
        knowledge: ['dirb/gobuster', 'Wappalyzer', 'robots.txt parsing', 'wayback URLs', 'API discovery'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'DNS Enumeration',
        description: 'Enumerate DNS records, subdomains, and DNS infrastructure. Includes zone transfer attempts and brute-force techniques.',
        category: 'recon',
        level: 2,
        prerequisites: ['Network Scanning'],
        tools: ['shell_execute', 'dns_lookup'],
        knowledge: ['dig/nslookup', 'subdomain brute-force', 'DNS zone transfer', 'DNSSEC', 'reverse DNS'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === EXPLOIT (Level 2-4) ===
      {
        name: 'SQL Injection',
        description: 'Detect and exploit SQL injection vulnerabilities in web applications. Supports error-based, union-based, blind, and time-based techniques.',
        category: 'exploit',
        level: 2,
        prerequisites: ['Web Reconnaissance'],
        tools: ['shell_execute', 'http_request', 'code_execute'],
        knowledge: ['SQLmap usage', 'payload crafting', 'WAF bypass', 'data extraction', 'privilege escalation via SQLi'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'XSS Exploitation',
        description: 'Detect and exploit Cross-Site Scripting vulnerabilities. Covers reflected, stored, and DOM-based XSS with advanced payload generation.',
        category: 'exploit',
        level: 2,
        prerequisites: ['Web Reconnaissance'],
        tools: ['shell_execute', 'http_request', 'code_execute'],
        knowledge: ['XSS payloads', 'DOM clobbering', ' CSP bypass', 'cookie theft', 'keylogging'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Authentication Bypass',
        description: 'Attempt to bypass authentication mechanisms including brute-force, credential stuffing, JWT manipulation, and session hijacking.',
        category: 'exploit',
        level: 3,
        prerequisites: ['Web Reconnaissance', 'Network Scanning'],
        tools: ['shell_execute', 'http_request', 'code_execute'],
        knowledge: ['hydra/medusa', 'JWT attacks', 'session fixation', 'password spraying', 'OAuth abuse'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Privilege Escalation',
        description: 'Escalate privileges on compromised systems. Covers Linux/Android kernel exploits, SUID binaries, misconfigured services, and container escapes.',
        category: 'exploit',
        level: 4,
        prerequisites: ['Network Scanning', 'Authentication Bypass'],
        tools: ['shell_execute', 'code_execute'],
        knowledge: ['LinPEAS/WinPEAS', 'kernel exploits', 'SUID/SGUID', 'capabilities', 'cron jobs', 'Docker escape'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === POST-EXPLOIT (Level 3-5) ===
      {
        name: 'Lateral Movement',
        description: 'Move through a network after initial compromise. Pivot through compromised hosts, tunnel traffic, and expand access.',
        category: 'post-exploit',
        level: 3,
        prerequisites: ['Network Scanning', 'Authentication Bypass'],
        tools: ['shell_execute', 'network_scan', 'code_execute'],
        knowledge: ['SSH tunneling', 'proxychains', 'ARP spoofing', 'pass-the-hash', 'Kerberos attacks'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Persistence',
        description: 'Establish persistent access on compromised systems. Covers backdoors, scheduled tasks, and stealth techniques.',
        category: 'post-exploit',
        level: 4,
        prerequisites: ['Privilege Escalation'],
        tools: ['shell_execute', 'code_execute', 'file_write'],
        knowledge: ['cron persistence', 'systemd services', 'SSH keys', 'rootkits', 'registry run keys'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Data Exfiltration',
        description: 'Extract and exfiltrate sensitive data from compromised systems. Covers encryption, steganography, and covert channels.',
        category: 'post-exploit',
        level: 5,
        prerequisites: ['Persistence', 'Lateral Movement'],
        tools: ['shell_execute', 'http_request', 'code_execute', 'file_write'],
        knowledge: ['DNS exfiltration', 'ICMP tunneling', 'steganography', 'encrypted channels', 'chunked transfer'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === NETWORK ===
      {
        name: 'Packet Analysis',
        description: 'Capture and analyze network traffic. Identify protocols, extract credentials, and detect suspicious activity.',
        category: 'network',
        level: 2,
        prerequisites: ['Network Scanning'],
        tools: ['shell_execute', 'code_execute'],
        knowledge: ['tcpdump/wireshark', 'packet filtering', 'protocol analysis', 'credential extraction', 'PCAP analysis'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Wireless Attacks',
        description: 'Attack wireless networks including WPA/WPA2 cracking, evil twin APs, deauthentication, and WPS attacks.',
        category: 'network',
        level: 3,
        prerequisites: ['Network Scanning', 'Packet Analysis'],
        tools: ['shell_execute', 'code_execute'],
        knowledge: ['aircrack-ng suite', 'WPA handshake capture', 'evil twin', 'PMKID attack', 'deauth flood'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === WEB ===
      {
        name: 'API Exploitation',
        description: 'Find and exploit vulnerabilities in REST/GraphQL APIs. Includes IDOR, broken auth, rate limit bypass, and injection.',
        category: 'web',
        level: 3,
        prerequisites: ['Web Reconnaissance', 'SQL Injection'],
        tools: ['shell_execute', 'http_request', 'code_execute'],
        knowledge: ['API fuzzing', 'GraphQL introspection', 'IDOR detection', 'mass assignment', 'BOLA/BFLA'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === CRYPTO ===
      {
        name: 'Password Cracking',
        description: 'Crack password hashes using brute-force, dictionary, rule-based, and rainbow table attacks.',
        category: 'crypto',
        level: 2,
        prerequisites: [],
        tools: ['shell_execute', 'code_execute'],
        knowledge: ['hashcat', 'john the ripper', 'hash identification', 'wordlists', 'rule generation', 'mask attacks'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Cryptography Analysis',
        description: 'Analyze and break cryptographic implementations. Identify weak algorithms, padding oracles, and implementation flaws.',
        category: 'crypto',
        level: 3,
        prerequisites: ['Password Cracking'],
        tools: ['shell_execute', 'code_execute'],
        knowledge: ['RSA attacks', 'AES-NI', 'padding oracle', 'CBC bit-flipping', 'hash collisions', 'custom cipher analysis'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === SOCIAL ===
      {
        name: 'Phishing',
        description: 'Generate convincing phishing campaigns including emails, landing pages, and credential harvesters.',
        category: 'social',
        level: 3,
        prerequisites: ['Web Reconnaissance'],
        tools: ['shell_execute', 'http_request', 'code_execute', 'file_write'],
        knowledge: ['email templates', 'clone sites', 'credential harvesting', 'social engineering principles', 'pretexting'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === INTELLIGENCE ===
      {
        name: 'OSINT Collection',
        description: 'Gather open-source intelligence on targets. Includes email harvesting, social media profiling, geolocation, and data aggregation.',
        category: 'intelligence',
        level: 1,
        prerequisites: [],
        tools: ['web_search', 'http_request', 'web_scraper', 'shell_execute'],
        knowledge: ['Shodan/Censys', 'theHarvester', 'Maltego', 'social media OSINT', 'geolocation', 'email harvesting'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Vulnerability Research',
        description: 'Research known vulnerabilities, CVEs, and exploits. Search exploit databases and match to discovered services.',
        category: 'intelligence',
        level: 2,
        prerequisites: ['Network Scanning', 'OSINT Collection'],
        tools: ['web_search', 'http_request', 'shell_execute'],
        knowledge: ['CVE databases', 'exploit-db', 'searchsploit', 'NVD', 'GitHub exploit hunting', 'patch analysis'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === SYSTEM ===
      {
        name: 'Shell Scripting',
        description: 'Write and execute shell scripts for automation, reconnaissance, and exploitation tasks on Linux/Android/Termux.',
        category: 'system',
        level: 1,
        prerequisites: [],
        tools: ['shell_execute', 'file_write', 'code_execute'],
        knowledge: ['bash scripting', 'Termux environment', 'Android utilities', 'automation', 'piping and redirection'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      {
        name: 'Code Execution',
        description: 'Write, compile, and execute code in multiple languages for custom tools and exploits.',
        category: 'system',
        level: 2,
        prerequisites: ['Shell Scripting'],
        tools: ['code_execute', 'file_write', 'shell_execute'],
        knowledge: ['Python', 'JavaScript/Node.js', 'C/C++ compilation', 'Ruby', 'Go', 'Rust basics'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
      // === UTILITY ===
      {
        name: 'Report Generation',
        description: 'Generate professional pentest reports with findings, evidence, risk ratings, and remediation recommendations.',
        category: 'utility',
        level: 2,
        prerequisites: ['OSINT Collection'],
        tools: ['file_write', 'code_execute'],
        knowledge: ['report templates', 'CVSS scoring', 'evidence documentation', 'executive summaries'],
        learned: true,
        source: 'builtin',
        usageCount: 0,
        successRate: 1.0,
      },
    ];

    for (const s of builtinSkills) {
      const skill: Skill = { ...s, id: this.generateId(s.name) };
      this.tree.skills.set(skill.id, skill);
    }

    // Build categories and root skills
    this.rebuildIndex();
  }

  private rebuildIndex(): void {
    this.tree.categories = {} as Record<ToolCategory, string[]>;
    this.tree.rootSkills = [];

    for (const [id, skill] of this.tree.skills) {
      if (!this.tree.categories[skill.category]) {
        this.tree.categories[skill.category] = [];
      }
      this.tree.categories[skill.category].push(id);
      if (skill.prerequisites.length === 0) {
        this.tree.rootSkills.push(id);
      }
    }
  }

  // ---- Public API ----
  getSkill(id: string): Skill | undefined {
    return this.tree.skills.get(id);
  }

  getSkillByName(name: string): Skill | undefined {
    for (const [, skill] of this.tree.skills) {
      if (skill.name.toLowerCase() === name.toLowerCase()) return skill;
    }
    return undefined;
  }

  getAllSkills(): Skill[] {
    return Array.from(this.tree.skills.values());
  }

  getSkillsByCategory(category: ToolCategory): Skill[] {
    const ids = this.tree.categories[category] || [];
    return ids.map(id => this.tree.skills.get(id)!).filter(Boolean);
  }

  getAvailableSkills(): Skill[] {
    return this.getAllSkills().filter(s => s.learned);
  }

  getTree(): SkillTree {
    return this.tree;
  }

  getTreeJSON(): object {
    const skills: Record<string, any> = {};
    for (const [id, skill] of this.tree.skills) {
      skills[id] = {
        ...skill,
        prerequisites: skill.prerequisites.map(pid => {
          const parent = this.tree.skills.get(pid);
          return parent ? parent.name : pid;
        }),
      };
    }
    return {
      rootSkills: this.tree.rootSkills.map(id => this.tree.skills.get(id)?.name),
      categories: Object.fromEntries(
        Object.entries(this.tree.categories).map(([cat, ids]) => [
          cat,
          ids.map(id => this.tree.skills.get(id)?.name).filter(Boolean),
        ])
      ),
      skills,
    };
  }

  // ---- Learning ----
  async discoverSkill(skillName: string, description: string, context: ExecutionContext): Promise<Skill | null> {
    // Check if already exists
    const existing = this.getSkillByName(skillName);
    if (existing) return existing;

    // Use AI to generate skill definition
    const skill: Skill = {
      id: this.generateId(skillName),
      name: skillName,
      description: description,
      category: 'utility',
      level: 2,
      prerequisites: [],
      tools: [],
      knowledge: [],
      learned: false,
      source: 'discovered',
      usageCount: 0,
      successRate: 0,
    };

    this.tree.skills.set(skill.id, skill);
    this.tree.discoveredPaths.push(skill.id);
    this.rebuildIndex();

    this.learningLog.push({
      skill: skillName,
      method: 'discovered',
      timestamp: Date.now(),
    });

    return skill;
  }

  async learnSkill(
    skillId: string,
    knowledge: string[],
    codeTemplate?: string
  ): Promise<Skill | null> {
    const skill = this.tree.skills.get(skillId);
    if (!skill) return null;

    // Check prerequisites
    for (const prereqId of skill.prerequisites) {
      const prereq = this.tree.skills.get(prereqId);
      if (prereq && !prereq.learned) {
        // Auto-learn prerequisite if it's a builtin skill
        if (prereq.source === 'builtin') {
          prereq.learned = true;
          prereq.learnedAt = Date.now();
        }
      }
    }

    skill.learned = true;
    skill.learnedAt = Date.now();
    skill.knowledge = [...new Set([...skill.knowledge, ...knowledge])];
    if (codeTemplate) skill.codeTemplate = codeTemplate;
    skill.source = skill.source === 'discovered' ? 'learned' : skill.source;

    this.learningLog.push({
      skill: skill.name,
      method: 'learned',
      timestamp: Date.now(),
    });

    return skill;
  }

  recordUsage(skillId: string, success: boolean): void {
    const skill = this.tree.skills.get(skillId);
    if (!skill) return;
    skill.usageCount++;
    // Exponential moving average for success rate
    skill.successRate = skill.successRate * 0.8 + (success ? 1 : 0) * 0.2;
  }

  findSkillForTask(task: string): Skill | null {
    // Simple keyword matching — the agent can also use AI for smarter matching
    const taskLower = task.toLowerCase();
    let bestMatch: Skill | null = null;
    let bestScore = 0;

    for (const [, skill] of this.tree.skills) {
      if (!skill.learned) continue;
      const descLower = skill.description.toLowerCase();
      const nameLower = skill.name.toLowerCase();

      let score = 0;
      // Check name match
      const nameWords = nameLower.split(/\s+/);
      for (const w of nameWords) {
        if (taskLower.includes(w)) score += 3;
      }
      // Check description match
      const descWords = descLower.split(/\s+/);
      for (const w of descWords) {
        if (w.length > 3 && taskLower.includes(w)) score += 1;
      }

      // Boost by success rate and level
      score *= skill.successRate * (skill.level / 5);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = skill;
      }
    }

    return bestMatch;
  }

  getLearningLog(): Array<{ skill: string; method: string; timestamp: number }> {
    return [...this.learningLog];
  }

  private generateId(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  }
}
