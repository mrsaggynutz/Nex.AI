// ============================================================
// OpenClaw Autonomous AI Agent — Type Definitions
// ============================================================

export interface AgentConfig {
  model: string;
  apiKey: string;
  apiBase: string;
  maxIterations: number;
  temperature: number;
  verbose: boolean;
}

export interface AgentMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: number;
  toolCall?: ToolCall;
  toolResult?: ToolResult;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, any>;
}

export interface ToolResult {
  toolCallId: string;
  output: string;
  success: boolean;
  error?: string;
  duration?: number;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: ToolCategory;
  parameters: ToolParameter[];
  handler: (args: Record<string, any>, ctx: ExecutionContext) => Promise<ToolResult>;
  dangerous: boolean;
  requiresConfirmation?: boolean;
}

export interface ToolParameter {
  name: string;
  type: string;
  description: string;
  required: boolean;
  default?: any;
  enum?: string[];
}

export type ToolCategory =
  | 'recon'
  | 'exploit'
  | 'post-exploit'
  | 'network'
  | 'web'
  | 'crypto'
  | 'social'
  | 'system'
  | 'intelligence'
  | 'utility';

export interface ExecutionContext {
  workingDirectory: string;
  sessionId: string;
  timestamp: number;
  skillTree: SkillTree;
  learnedSkills: Map<string, Skill>;
  environment: Record<string, string>;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  level: 1 | 2 | 3 | 4 | 5;
  prerequisites: string[];
  tools: string[];
  knowledge: string[];
  learned: boolean;
  learnedAt?: number;
  source: 'builtin' | 'discovered' | 'learned' | 'user-taught';
  usageCount: number;
  successRate: number;
  codeTemplate?: string;
}

export interface SkillTree {
  skills: Map<string, Skill>;
  categories: Record<ToolCategory, string[]>;
  rootSkills: string[];
  discoveredPaths: string[];
}

export interface AgentPlan {
  id: string;
  goal: string;
  steps: PlanStep[];
  currentStep: number;
  status: 'planning' | 'executing' | 'iterating' | 'completed' | 'failed' | 'stopped';
  createdAt: number;
  completedAt?: number;
}

export interface PlanStep {
  id: string;
  description: string;
  tool?: string;
  arguments?: Record<string, any>;
  status: 'pending' | 'executing' | 'completed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  duration?: number;
  iterationCount: number;
  requiresNewSkill?: string;
}

export interface AgentSession {
  id: string;
  status: 'idle' | 'planning' | 'executing' | 'iterating' | 'stopped';
  prompt: string;
  plan: AgentPlan | null;
  messages: AgentMessage[];
  history: ExecutionRecord[];
  skills: Skill[];
  iterations: number;
  createdAt: number;
  updatedAt: number;
}

export interface ExecutionRecord {
  timestamp: number;
  toolName: string;
  arguments: Record<string, any>;
  output: string;
  success: boolean;
  duration: number;
  skillUsed?: string;
  newSkillLearned?: string;
}

export interface AgentEvent {
  type: 'plan' | 'step_start' | 'step_output' | 'step_complete' | 'step_error' |
        'skill_learned' | 'skill_discovered' | 'iteration' | 'complete' |
        'error' | 'log' | 'status_change' | 'thinking';
  data: any;
  timestamp: number;
}
