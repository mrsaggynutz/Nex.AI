// ============================================================
// OpenClaw — Tool Registry
// All tools the agent can invoke during autonomous execution
// ============================================================

import { ToolDefinition, ToolResult, ExecutionContext, ToolCategory } from './types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

const execAsync = promisify(exec);

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();

  constructor() {
    this.registerBuiltinTools();
  }

  private registerBuiltinTools(): void {
    // === CORE TOOLS ===
    this.register({
      name: 'shell_execute',
      description: 'Execute a shell command on the local system (Linux/Termux/Android). Returns stdout, stderr, and exit code. Supports bash, sh, and Termux-specific commands.',
      category: 'system',
      dangerous: true,
      requiresConfirmation: false,
      parameters: [
        { name: 'command', type: 'string', description: 'The shell command to execute', required: true },
        { name: 'timeout', type: 'number', description: 'Timeout in milliseconds (default 30000)', required: false, default: 30000 },
        { name: 'workingDir', type: 'string', description: 'Working directory for the command', required: false },
      ],
      handler: async (args, ctx) => {
        const start = Date.now();
        try {
          const cwd = args.workingDir || ctx.workingDirectory;
          const timeout = Math.min(args.timeout || 30000, 120000); // max 2 min
          const { stdout, stderr } = await execAsync(args.command, {
            cwd,
            timeout,
            maxBuffer: 10 * 1024 * 1024,
            env: { ...process.env, ...ctx.environment },
          });
          const output = (stdout + stderr).trim();
          return {
            toolCallId: crypto.randomUUID(),
            output: output || '(no output)',
            success: true,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          return {
            toolCallId: crypto.randomUUID(),
            output: err.stdout || err.stderr || err.message,
            success: false,
            error: err.message,
            duration: Date.now() - start,
          };
        }
      },
    });

    this.register({
      name: 'code_execute',
      description: 'Write and execute code in a specified language. Supports Python, JavaScript, Bash, and compiled languages. Returns the execution output.',
      category: 'system',
      dangerous: true,
      parameters: [
        { name: 'language', type: 'string', description: 'Programming language (python, javascript, bash, ruby)', required: true, enum: ['python', 'javascript', 'bash', 'ruby'] },
        { name: 'code', type: 'string', description: 'The code to execute', required: true },
        { name: 'args', type: 'string', description: 'Optional command-line arguments', required: false },
      ],
      handler: async (args, ctx) => {
        const start = Date.now();
        const tmpFile = path.join('/tmp', `openclaw_${crypto.randomUUID().slice(0, 8)}`);
        try {
          let cmd: string;
          switch (args.language) {
            case 'python':
              fs.writeFileSync(tmpFile + '.py', args.code);
              cmd = `python3 "${tmpFile}.py" ${args.args || ''}`;
              break;
            case 'javascript':
              fs.writeFileSync(tmpFile + '.js', args.code);
              cmd = `node "${tmpFile}.js" ${args.args || ''}`;
              break;
            case 'bash':
              fs.writeFileSync(tmpFile + '.sh', args.code);
              cmd = `bash "${tmpFile}.sh" ${args.args || ''}`;
              break;
            case 'ruby':
              fs.writeFileSync(tmpFile + '.rb', args.code);
              cmd = `ruby "${tmpFile}.rb" ${args.args || ''}`;
              break;
            default:
              return { toolCallId: crypto.randomUUID(), output: `Unsupported language: ${args.language}`, success: false, duration: Date.now() - start };
          }
          const { stdout, stderr } = await execAsync(cmd, { timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
          return {
            toolCallId: crypto.randomUUID(),
            output: (stdout + stderr).trim() || '(no output)',
            success: true,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          return {
            toolCallId: crypto.randomUUID(),
            output: err.stdout || err.stderr || err.message,
            success: false,
            error: err.message,
            duration: Date.now() - start,
          };
        } finally {
          // Cleanup temp files
          try { fs.unlinkSync(tmpFile + '.py'); } catch {}
          try { fs.unlinkSync(tmpFile + '.js'); } catch {}
          try { fs.unlinkSync(tmpFile + '.sh'); } catch {}
          try { fs.unlinkSync(tmpFile + '.rb'); } catch {}
        }
      },
    });

    this.register({
      name: 'file_write',
      description: 'Write content to a file. Creates parent directories if needed. Returns file path and size.',
      category: 'system',
      dangerous: false,
      parameters: [
        { name: 'path', type: 'string', description: 'File path to write to', required: true },
        { name: 'content', type: 'string', description: 'Content to write', required: true },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          const dir = path.dirname(args.path);
          fs.mkdirSync(dir, { recursive: true });
          fs.writeFileSync(args.path, args.content);
          return {
            toolCallId: crypto.randomUUID(),
            output: `Written ${args.content.length} bytes to ${args.path}`,
            success: true,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });

    this.register({
      name: 'file_read',
      description: 'Read content from a file. Returns file contents as text.',
      category: 'system',
      dangerous: false,
      parameters: [
        { name: 'path', type: 'string', description: 'File path to read', required: true },
        { name: 'maxLines', type: 'number', description: 'Maximum lines to read (default 500)', required: false, default: 500 },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          const content = fs.readFileSync(args.path, 'utf-8');
          const lines = content.split('\n').slice(0, args.maxLines || 500).join('\n');
          return {
            toolCallId: crypto.randomUUID(),
            output: lines || '(empty file)',
            success: true,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });

    // === NETWORK TOOLS ===
    this.register({
      name: 'http_request',
      description: 'Make an HTTP/HTTPS request to a URL. Supports all methods, custom headers, and request body. Returns status code, headers, and response body.',
      category: 'network',
      dangerous: false,
      parameters: [
        { name: 'url', type: 'string', description: 'Target URL', required: true },
        { name: 'method', type: 'string', description: 'HTTP method (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD)', required: false, default: 'GET' },
        { name: 'headers', type: 'object', description: 'Custom headers as key-value pairs', required: false },
        { name: 'body', type: 'string', description: 'Request body (for POST/PUT/PATCH)', required: false },
        { name: 'followRedirects', type: 'boolean', description: 'Follow HTTP redirects (default true)', required: false, default: true },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          const url = new URL(args.url);
          const fetchOptions: RequestInit = {
            method: args.method || 'GET',
            headers: { 'User-Agent': 'OpenClaw/2.0 (Autonomous Agent)', ...(args.headers || {}) },
            body: args.body || undefined,
            redirect: args.followRedirects === false ? 'manual' : 'follow',
          };
          const response = await fetch(args.url, fetchOptions);
          const body = await response.text();
          const headerLines = Object.entries(response.headers)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n');
          return {
            toolCallId: crypto.randomUUID(),
            output: `HTTP ${response.status} ${response.statusText}\n${headerLines}\n\n${body.slice(0, 50000)}`,
            success: response.ok,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });

    this.register({
      name: 'web_search',
      description: 'Search the web for information. Returns search results with titles, URLs, and snippets. Useful for finding vulnerabilities, tools, and techniques.',
      category: 'intelligence',
      dangerous: false,
      parameters: [
        { name: 'query', type: 'string', description: 'Search query', required: true },
        { name: 'maxResults', type: 'number', description: 'Maximum results (default 10)', required: false, default: 10 },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          // Use DuckDuckGo HTML search (no API key needed)
          const query = encodeURIComponent(args.query);
          const resp = await fetch(`https://html.duckduckgo.com/html/?q=${query}`, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36' },
          });
          const html = await resp.text();
          // Parse results from HTML
          const results: string[] = [];
          const urlRegex = /<a rel="nofollow" class="result__a" href="([^"]+)">([^<]+)<\/a>/g;
          const snippetRegex = /<a[^>]*class="result__snippet"[^>]*>([^<]*(?:<[^>]+>[^<]*)*)<\/a>/g;
          let match;
          while ((match = urlRegex.exec(html)) !== null && results.length < (args.maxResults || 10)) {
            const title = match[2].trim();
            const url = match[1].replace(/^(\/\/duckduckgo\.com\/l\/\?uddg=)/, '')
              .replace(/&rut=.*$/, '')
              .replace(/%3A/g, ':').replace(/%2F/g, '/').replace(/%3F/g, '?').replace(/%3D/g, '=').replace(/%26/g, '&');
            results.push(`[${title}](${url})`);
          }
          if (results.length === 0) {
            // Fallback: use a simpler approach
            results.push(`Search completed but no structured results found. Raw HTML length: ${html.length}`);
          }
          return {
            toolCallId: crypto.randomUUID(),
            output: results.join('\n\n'),
            success: true,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });

    this.register({
      name: 'web_scraper',
      description: 'Scrape a web page and extract structured content including text, links, forms, and metadata.',
      category: 'web',
      dangerous: false,
      parameters: [
        { name: 'url', type: 'string', description: 'URL to scrape', required: true },
        { name: 'extract', type: 'string', description: 'What to extract: all, text, links, forms, headers, scripts, comments', required: false, default: 'all' },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          const resp = await fetch(args.url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36' },
          });
          const html = await resp.text();
          // Simple HTML parsing
          const result: string[] = [];
          result.push(`Status: ${resp.status}`);
          result.push(`Content-Length: ${html.length}`);
          result.push('');

          if (args.extract === 'all' || args.extract === 'text') {
            const text = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
              .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
              .replace(/<[^>]+>/g, ' ')
              .replace(/\s+/g, ' ')
              .trim()
              .slice(0, 10000);
            result.push('=== TEXT CONTENT ===');
            result.push(text);
            result.push('');
          }

          if (args.extract === 'all' || args.extract === 'links') {
            result.push('=== LINKS ===');
            const linkRegex = /href=["']([^"']+)["']/gi;
            let m;
            while ((m = linkRegex.exec(html)) !== null) {
              result.push(m[1]);
            }
            result.push('');
          }

          if (args.extract === 'all' || args.extract === 'forms') {
            result.push('=== FORMS ===');
            const formRegex = /<form[^>]*>([\s\S]*?)<\/form>/gi;
            let f;
            while ((f = formRegex.exec(html)) !== null) {
              result.push(f[0].replace(/\s+/g, ' ').trim().slice(0, 2000));
            }
          }

          return {
            toolCallId: crypto.randomUUID(),
            output: result.join('\n'),
            success: true,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });

    this.register({
      name: 'dns_lookup',
      description: 'Perform DNS lookups including A, AAAA, MX, NS, TXT, CNAME, and SOA records. Supports reverse DNS and zone transfer attempts.',
      category: 'recon',
      dangerous: false,
      parameters: [
        { name: 'domain', type: 'string', description: 'Domain name or IP address (for reverse DNS)', required: true },
        { name: 'recordType', type: 'string', description: 'DNS record type (A, AAAA, MX, NS, TXT, CNAME, SOA, ANY, AXFR)', required: false, default: 'ANY' },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          const { stdout } = await execAsync(`dig +noall +answer ${args.domain} ${args.recordType}`, { timeout: 15000 });
          return {
            toolCallId: crypto.randomUUID(),
            output: stdout.trim() || 'No records found',
            success: true,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          // Fallback to nslookup
          try {
            const { stdout } = await execAsync(`nslookup ${args.domain}`, { timeout: 15000 });
            return { toolCallId: crypto.randomUUID(), output: stdout.trim(), success: true, duration: Date.now() - start };
          } catch (err2: any) {
            return { toolCallId: crypto.randomUUID(), output: err2.message, success: false, error: err2.message, duration: Date.now() - start };
          }
        }
      },
    });

    this.register({
      name: 'network_scan',
      description: 'Scan a target for open ports and services. Uses netcat, nmap if available, or custom probing. Returns discovered open ports and service banners.',
      category: 'recon',
      dangerous: true,
      parameters: [
        { name: 'target', type: 'string', description: 'IP address, hostname, or CIDR range to scan', required: true },
        { name: 'ports', type: 'string', description: 'Port(s) to scan (e.g., "80,443", "1-1000", "22,80,443,8080")', required: false, default: '22,80,443,8080,8443,3000,3306,5432,27017,6379' },
        { name: 'scanType', type: 'string', description: 'Scan type: quick, connect, banner', required: false, default: 'connect' },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          // Try nmap first, fall back to netcat probing
          let cmd: string;
          const ports = args.ports || '22,80,443,8080';
          try {
            await execAsync('which nmap', { timeout: 3000 });
            const extra = args.scanType === 'quick' ? '-T4 --top-ports 100' : `-p ${ports} -sV`;
            cmd = `nmap ${extra} ${args.target} 2>/dev/null`;
          } catch {
            // Fallback: Python port scanner
            const code = `
import socket, sys
target = "${args.target}"
ports = [int(p.strip()) for p in "${ports}".split(",")]
results = []
for port in ports:
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        s.settimeout(2)
        result = s.connect_ex((target, port))
        if result == 0:
            try:
                banner = s.recv(1024).decode('utf-8', errors='ignore').strip()
            except:
                banner = "unknown"
            print(f"Port {port}: OPEN - {banner}")
        s.close()
    except Exception as e:
        print(f"Port {port}: ERROR - {e}")
`;
            const tmpScript = `/tmp/oc_scan_${Date.now()}.py`;
            fs.writeFileSync(tmpScript, code);
            const { stdout } = await execAsync(`python3 ${tmpScript}`, { timeout: 60000 });
            try { fs.unlinkSync(tmpScript); } catch {}
            return {
              toolCallId: crypto.randomUUID(),
              output: stdout.trim() || 'No open ports found',
              success: true,
              duration: Date.now() - start,
            };
          }
          const { stdout } = await execAsync(cmd, { timeout: 120000 });
          return { toolCallId: crypto.randomUUID(), output: stdout.trim() || 'Scan complete - no results', success: true, duration: Date.now() - start };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });

    // === UTILITY TOOLS ===
    this.register({
      name: 'think',
      description: 'Think through a complex problem step by step. Use this to reason about strategies, analyze results, or plan multi-step attacks. This is a reasoning tool — it helps the agent think before acting.',
      category: 'utility',
      dangerous: false,
      parameters: [
        { name: 'reasoning', type: 'string', description: 'Your step-by-step reasoning and analysis', required: true },
      ],
      handler: async (args) => {
        return {
          toolCallId: crypto.randomUUID(),
          output: `Reasoning recorded: ${args.reasoning.length} characters of analysis`,
          success: true,
          duration: 0,
        };
      },
    });

    this.register({
      name: 'learn_skill',
      description: 'Discover and learn a new skill. Use this when you encounter a task that requires knowledge or tools you do not currently possess. The system will search for and acquire the necessary skill.',
      category: 'utility',
      dangerous: false,
      parameters: [
        { name: 'skillName', type: 'string', description: 'Name of the skill to learn', required: true },
        { name: 'context', type: 'string', description: 'What you are trying to accomplish that requires this skill', required: true },
      ],
      handler: async (args, ctx) => {
        const start = Date.now();
        try {
          // Discover skill
          const skill = await ctx.skillTree.discoverSkill(args.skillName, args.context, ctx);
          if (!skill) {
            return { toolCallId: crypto.randomUUID(), output: 'Failed to create skill entry', success: false, duration: Date.now() - start };
          }
          // Mark as learned with basic knowledge
          await ctx.skillTree.learnSkill(skill.id, [`Learned for: ${args.context}`]);
          return {
            toolCallId: crypto.randomUUID(),
            output: `Skill "${args.skillName}" learned successfully.\n\nDescription: ${skill.description}\nCategory: ${skill.category}\nLevel: ${skill.level}\nYou can now use this skill in future operations.`,
            success: true,
            duration: Date.now() - start,
          };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });

    this.register({
      name: 'generate_report',
      description: 'Generate a structured report from gathered data. Creates markdown-formatted reports with sections, findings, and evidence.',
      category: 'utility',
      dangerous: false,
      parameters: [
        { name: 'title', type: 'string', description: 'Report title', required: true },
        { name: 'sections', type: 'array', description: 'Array of sections, each with title and content', required: true },
        { name: 'findings', type: 'array', description: 'Array of findings with severity, description, and evidence', required: false },
        { name: 'outputPath', type: 'string', description: 'File path to save the report (optional)', required: false },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          let report = `# ${args.title}\n\n`;
          report += `Generated: ${new Date().toISOString()}\n`;
          report += `Agent: OpenClaw v2.0\n\n---\n\n`;

          if (args.sections) {
            for (const section of args.sections) {
              report += `## ${section.title}\n\n${section.content}\n\n`;
            }
          }

          if (args.findings && args.findings.length > 0) {
            report += `## Findings\n\n`;
            for (const f of args.findings) {
              report += `### [${f.severity || 'INFO'}] ${f.description}\n\n`;
              if (f.evidence) report += `**Evidence:** ${f.evidence}\n\n`;
              if (f.remediation) report += `**Remediation:** ${f.remediation}\n\n`;
            }
          }

          if (args.outputPath) {
            fs.writeFileSync(args.outputPath, report);
            return { toolCallId: crypto.randomUUID(), output: `Report saved to ${args.outputPath}\n\nPreview:\n${report.slice(0, 2000)}`, success: true, duration: Date.now() - start };
          }

          return { toolCallId: crypto.randomUUID(), output: report, success: true, duration: Date.now() - start };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });

    this.register({
      name: 'hash_crack',
      description: 'Attempt to crack password hashes using dictionary, brute-force, or rule-based attacks. Supports MD5, SHA-256, SHA-512, bcrypt, and NTLM.',
      category: 'crypto',
      dangerous: true,
      parameters: [
        { name: 'hash', type: 'string', description: 'The hash to crack', required: true },
        { name: 'hashType', type: 'string', description: 'Hash type (md5, sha256, sha512, bcrypt, ntlm)', required: true },
        { name: 'wordlist', type: 'string', description: 'Path to wordlist file (optional — uses built-in list if not provided)', required: false },
        { name: 'mode', type: 'string', description: 'Attack mode: dictionary, brute, rules', required: false, default: 'dictionary' },
      ],
      handler: async (args) => {
        const start = Date.now();
        try {
          // Try hashcat first, fall back to Python
          let result: string;
          try {
            await execAsync('which hashcat', { timeout: 3000 });
            const hashFile = `/tmp/oc_hash_${Date.now()}.txt`;
            fs.writeFileSync(hashFile, args.hash);
            const modeMap: Record<string, number> = { md5: 0, sha256: 1400, sha512: 1800, ntlm: 1000, bcrypt: 3200 };
            const m = modeMap[args.hashType] || 0;
            const cmd = args.wordlist
              ? `hashcat -m ${m} ${hashFile} ${args.wordlist} --force -o /dev/stdout 2>/dev/null | head -5`
              : `hashcat -m ${m} ${hashFile} -a 3 '?a?a?a?a?a' --force -o /dev/stdout 2>/dev/null | head -5`;
            const { stdout } = await execAsync(cmd, { timeout: 60000 });
            result = stdout.trim() || 'Hash not cracked';
            try { fs.unlinkSync(hashFile); } catch {}
          } catch {
            // Python fallback
            const code = `
import hashlib
target = "${args.hash}"
htype = "${args.hashType}"
common = ['password', '123456', 'admin', 'letmein', 'welcome', 'monkey', 'dragon', 'master', 'qwerty', 'login', 'princess', 'abc123', 'password1', 'sunshine', 'iloveyou', 'shadow', 'trustno1']
found = False
for w in common:
    if htype == 'md5':
        if hashlib.md5(w.encode()).hexdigest() == target:
            print(f'CRACKED: {w}'); found = True; break
    elif htype == 'sha256':
        if hashlib.sha256(w.encode()).hexdigest() == target:
            print(f'CRACKED: {w}'); found = True; break
    elif htype == 'sha512':
        if hashlib.sha512(w.encode()).hexdigest() == target:
            print(f'CRACKED: {w}'); found = True; break
if not found:
    print('Not cracked with common passwords. Try a larger wordlist or different mode.')
`;
            const tmpScript = `/tmp/oc_crack_${Date.now()}.py`;
            fs.writeFileSync(tmpScript, code);
            const { stdout } = await execAsync(`python3 ${tmpScript}`, { timeout: 30000 });
            result = stdout.trim();
            try { fs.unlinkSync(tmpScript); } catch {}
          }
          return { toolCallId: crypto.randomUUID(), output: result, success: true, duration: Date.now() - start };
        } catch (err: any) {
          return { toolCallId: crypto.randomUUID(), output: err.message, success: false, error: err.message, duration: Date.now() - start };
        }
      },
    });
  }

  // ---- Public API ----
  register(tool: ToolDefinition): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): ToolDefinition | undefined {
    return this.tools.get(name);
  }

  getAll(): ToolDefinition[] {
    return Array.from(this.tools.values());
  }

  getJSON(): object {
    return this.getAll().map(t => ({
      name: t.name,
      description: t.description,
      category: t.category,
      dangerous: t.dangerous,
      parameters: t.parameters.map(p => ({ name: p.name, type: p.type, description: p.description, required: p.required })),
    }));
  }

  async executeTool(name: string, args: Record<string, any>, ctx: ExecutionContext): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      return {
        toolCallId: crypto.randomUUID(),
        output: `Unknown tool: ${name}`,
        success: false,
        error: `Tool "${name}" not found in registry`,
      };
    }
    return tool.handler(args, ctx);
  }
}
