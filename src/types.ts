export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  reasoningSteps?: string[];
  toolsUsed?: string[];
  securityAdvisory?: string;
}

export interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
}

export interface FileItem {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  permissions: string;
  modified: string;
}

export interface GitStatus {
  branch: string | null;
  files: Array<{ file: string; status: string; staged: boolean }>;
  error?: string;
}

export interface GitCommit {
  hash: string;
  author: string;
  email: string;
  date: string;
  message: string;
}

export interface GitBranch {
  name: string;
  current: boolean;
  remote: boolean;
}

export type ExecuteFn = (command: string, timeout?: number) => Promise<string | null>;
export type RunInTerminalFn = (command: string) => void;
