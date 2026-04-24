// ============================================================
// OpenClaw — Express API Routes
// Add these to your existing server.ts
// ============================================================

import { Router, Request, Response } from 'express';
import { OpenClawAgent } from '../openclaw/agent-engine.js';

const router = Router();

// Agent instance (singleton per server)
let agent: OpenClawAgent | null = null;

function getAgent(): OpenClawAgent {
  if (!agent) {
    agent = new OpenClawAgent({
      model: process.env.OPENCLAW_MODEL || 'llama-3.3-70b-versatile',
      apiKey: process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY || '',
      apiBase: process.env.OPENCLAW_API_BASE || 'https://api.groq.com/openai/v1',
      maxIterations: 50,
      temperature: 0.7,
      verbose: true,
    });
  }
  return agent;
}

// ---- AI Configuration ----

// POST /api/openclaw/config
router.post('/config', async (req: Request, res: Response) => {
  try {
    const agent = getAgent();
    agent.updateConfig(req.body);
    res.json({ success: true, config: agent.getConfig() });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/openclaw/config
router.get('/config', (_req: Request, res: Response) => {
  const agent = getAgent();
  res.json({ success: true, config: agent.getConfig() });
});

// ---- Session Management ----

// POST /api/openclaw/execute
router.post('/execute', async (req: Request, res: Response) => {
  try {
    const { prompt, config } = req.body;
    if (!prompt) {
      return res.status(400).json({ success: false, error: 'Prompt is required' });
    }

    const agent = getAgent();

    // Check if there's an active session
    const active = agent.getActiveSession();
    if (active) {
      return res.status(409).json({
        success: false,
        error: 'An agent is already executing',
        activeSession: active.id,
      });
    }

    // Execute asynchronously — return session ID immediately
    const session = agent.createSession(prompt);
    agent.execute(prompt, config).then(() => {
      // Execution completed — clients should poll or use events
    }).catch(err => {
      console.error('[OpenClaw] Execution error:', err.message);
    });

    res.json({
      success: true,
      sessionId: session.id,
      message: 'Agent execution started',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/openclaw/status
router.get('/status', (_req: Request, res: Response) => {
  const agent = getAgent();
  const active = agent.getActiveSession();
  const allSessions = agent.getAllSessions();

  res.json({
    success: true,
    active: active ? {
      id: active.id,
      status: active.status,
      prompt: active.prompt,
      currentStep: active.plan?.currentStep || 0,
      totalSteps: active.plan?.steps.length || 0,
      iterations: active.iterations,
    } : null,
    sessions: allSessions.map(s => ({
      id: s.id,
      status: s.status,
      prompt: s.prompt.slice(0, 100),
      iterations: s.iterations,
      createdAt: s.createdAt,
      updatedAt: s.updatedAt,
    })),
    stats: agent.getStats(),
  });
});

// GET /api/openclaw/session/:id
router.get('/session/:id', (req: Request, res: Response) => {
  const agent = getAgent();
  const session = agent.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }
  res.json({ success: true, session });
});

// GET /api/openclaw/session/:id/events
router.get('/session/:id/events', (req: Request, res: Response) => {
  const agent = getAgent();
  const session = agent.getSession(req.params.id);
  if (!session) {
    return res.status(404).json({ success: false, error: 'Session not found' });
  }

  // Return session history as events
  const events = session.history.map((h, i) => ({
    index: i,
    type: h.success ? 'step_complete' : 'step_error',
    tool: h.toolName,
    output: h.output.slice(0, 2000),
    success: h.success,
    duration: h.duration,
    timestamp: h.timestamp,
  }));

  res.json({ success: true, events });
});

// POST /api/openclaw/stop
router.post('/stop', async (_req: Request, res: Response) => {
  try {
    const agent = getAgent();
    await agent.stop();
    res.json({ success: true, message: 'Agent stopped' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- Skill Tree ----

// GET /api/openclaw/skills
router.get('/skills', (_req: Request, res: Response) => {
  const agent = getAgent();
  res.json({
    success: true,
    skills: agent.getSkills(),
    available: agent.getAvailableSkills().length,
    total: agent.getSkills().length,
  });
});

// GET /api/openclaw/skills/tree
router.get('/skills/tree', (_req: Request, res: Response) => {
  const agent = getAgent();
  res.json({ success: true, tree: agent.getSkillTree() });
});

// POST /api/openclaw/skills/learn
router.post('/skills/learn', async (req: Request, res: Response) => {
  try {
    const { skillId, knowledge } = req.body;
    const agent = getAgent();
    const result = await agent.getToolRegistry().executeTool('learn_skill', {
      skillName: skillId,
      context: knowledge || 'User-requested learning',
    }, {
      workingDirectory: process.cwd(),
      sessionId: 'manual',
      timestamp: Date.now(),
      skillTree: (agent as any).skillTree,
      learnedSkills: new Map(),
      environment: {},
    });
    res.json({ success: result.success, output: result.output });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- Tools ----

// GET /api/openclaw/tools
router.get('/tools', (_req: Request, res: Response) => {
  const agent = getAgent();
  res.json({ success: true, tools: agent.getTools() });
});

// POST /api/openclaw/tools/execute
router.post('/tools/execute', async (req: Request, res: Response) => {
  try {
    const { tool, args } = req.body;
    if (!tool) {
      return res.status(400).json({ success: false, error: 'Tool name is required' });
    }
    const agent = getAgent();
    const result = await agent.getToolRegistry().executeTool(tool, args || {}, {
      workingDirectory: process.cwd(),
      sessionId: 'manual',
      timestamp: Date.now(),
      skillTree: (agent as any).skillTree,
      learnedSkills: new Map(),
      environment: {},
    });
    res.json({ success: true, result });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ---- Stats & Info ----

// GET /api/openclaw/stats
router.get('/stats', (_req: Request, res: Response) => {
  const agent = getAgent();
  res.json({ success: true, ...agent.getStats() });
});

export default router;
