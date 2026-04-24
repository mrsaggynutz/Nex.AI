import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Save, Loader2, Check, AlertTriangle, Eye, EyeOff,
  Zap, Globe, Cpu, Wifi, Key, ChevronDown, ExternalLink,
  Server, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

/* ─── Types ─── */

interface ProviderPreset {
  id: string;
  baseUrl: string;
  defaultModel: string;
  models: string[];
  free: boolean;
}

interface AIConfigResponse {
  configured: boolean;
  provider: string;
  baseUrl: string;
  apiKey: string;
  apiKeySet: boolean;
  model: string;
  availableProviders: ProviderPreset[];
}

interface AISettingsProps {
  onClose?: () => void;
  onSaved?: () => void;
}

/* ─── Provider Display Config ─── */

const PROVIDER_DISPLAY: Record<string, { label: string; icon: React.ReactNode; color: string; desc: string; link?: string; free: boolean; setup?: string }> = {
  groq:       { label: 'Groq',       icon: <Zap size={16} />,    color: 'from-orange-500 to-red-500',   desc: 'Ultra-fast inference. FREE — no credit card needed.',                    link: 'https://console.groq.com/keys',    free: true, setup: '1) Open console.groq.com  2) Sign up (free)  3) Copy API Key  4) Paste below' },
  openai:     { label: 'OpenAI',     icon: <Globe size={16} />,  color: 'from-green-500 to-emerald-600', desc: 'GPT-4o, GPT-4o-mini. Paid only.',                                       link: 'https://platform.openai.com/api-keys', free: false },
  openrouter: { label: 'OpenRouter', icon: <Wifi size={16} />,   color: 'from-blue-500 to-violet-500',  desc: 'Multi-provider. Has FREE models.',                                     link: 'https://openrouter.ai/keys',      free: true, setup: '1) Open openrouter.ai  2) Sign up  3) Go to Keys  4) Copy & paste below' },
  together:   { label: 'Together',   icon: <Cpu size={16} />,    color: 'from-cyan-500 to-blue-600',    desc: 'Open-source models. Affordable.',                                       link: 'https://api.together.xyz/settings/api-keys', free: false },
  ollama:     { label: 'Ollama',     icon: <Server size={16} />, color: 'from-zinc-500 to-zinc-700',    desc: 'Local AI. 100% FREE. No signup, no key needed.',                          link: 'https://ollama.com',              free: true, setup: 'pkg install ollama && ollama serve (then select Ollama — no key required!)' },
  custom:     { label: 'Custom',     icon: <Key size={16} />,    color: 'from-purple-500 to-pink-500',  desc: 'Any OpenAI-compatible API endpoint.',                                   link: undefined, free: false },
};

/* ─── Component ─── */

export const AISettings: React.FC<AISettingsProps> = ({ onClose, onSaved }) => {
  const handleClose = onClose || (() => {});
  const [config, setConfig] = useState<AIConfigResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [inputModel, setInputModel] = useState('');
  const [inputBaseUrl, setInputBaseUrl] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('groq');
  const [saved, setSaved] = useState(false);
  const [showProviders, setShowProviders] = useState(false);

  /* Load current config */
  const loadConfig = useCallback(async () => {
    try {
      const res = await fetch('/api/ai/config');
      const data: AIConfigResponse = await res.json();
      setConfig(data);
      setSelectedProvider(data.provider);
      setInputModel(data.model);
      setInputBaseUrl(data.baseUrl);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { loadConfig(); }, [loadConfig]);

  /* Handle provider select */
  const handleProviderSelect = (providerId: string) => {
    setSelectedProvider(providerId);
    const preset = config?.availableProviders.find(p => p.id === providerId);
    if (preset) {
      setInputBaseUrl(preset.baseUrl);
      setInputModel(preset.defaultModel);
    }
    setShowProviders(false);
  };

  /* Save config */
  const handleSave = async () => {
    setSaving(true);
    setTestResult(null);
    const trimmedKey = inputKey.trim(); // auto-trim whitespace
    if (trimmedKey && trimmedKey.length < 10) {
      setTestResult({ success: false, msg: 'Key too short — this doesn\'t look like a real API key. Get one from the link above.' });
      setSaving(false);
      return;
    }
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          baseUrl: inputBaseUrl,
          apiKey: trimmedKey,
          model: inputModel,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        onSaved?.();
        // Reload to get masked key
        await loadConfig();
        setInputKey('');
      }
    } catch { /* ignore */ }
    setSaving(false);
  };

  /* Test connection */
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/ai/test', { method: 'POST' });
      const data = await res.json();
      let msg = data.success ? `Connected! Model: ${data.model || 'unknown'}` : (data.error || 'Failed');
      // Friendly error messages
      if (!data.success) {
        const errLower = (data.error || '').toLowerCase();
        if (errLower.includes('401') || errLower.includes('invalid_api_key') || errLower.includes('invalid key') || errLower.includes('unauthorized')) {
          msg = `Invalid API key. This key was rejected by ${selectedProvider.toUpperCase()}. Please get a fresh key from the link above — the Key Forge generates fake keys, you need a real one from the provider.`;
        } else if (errLower.includes('403') || errLower.includes('forbidden')) {
          msg = `Access denied (403). Your key may be expired or disabled. Get a new key from ${display.link || 'your provider.'}`;
        } else if (errLower.includes('timed out') || errLower.includes('timeout')) {
          msg = 'Connection timed out. Check your internet connection.';
        } else if (errLower.includes('not configured')) {
          msg = 'No API key set. Enter your key above and click Save first.';
        }
      }
      setTestResult({ success: data.success, msg });
    } catch {
      setTestResult({ success: false, msg: 'Cannot reach server.' });
    }
    setTesting(false);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
        <Loader2 size={32} className="text-accent animate-spin" />
      </div>
    );
  }

  const display = PROVIDER_DISPLAY[selectedProvider] || PROVIDER_DISPLAY.custom;
  const needsKey = selectedProvider !== 'ollama';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="absolute inset-x-3 bottom-3 top-20 max-w-lg mx-auto bg-[#0D0D0D] border border-zinc-800 rounded-lg overflow-hidden shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent/20 border border-accent/30 flex items-center justify-center">
              <Shield size={16} className="text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-tighter">AI Settings</h3>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-[0.15em]">
                {config?.configured ? 'Connected' : 'Not Configured'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">

          {/* Status Banner */}
          {config?.configured ? (
            <div className="bg-neon-green/5 border border-neon-green/20 p-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse"></div>
              <p className="text-[9px] text-neon-green font-black uppercase tracking-widest">
                AI Active — {config.provider} / {config.model}
              </p>
            </div>
          ) : (
            <div className="bg-amber-500/5 border border-amber-500/20 p-3 flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-[9px] text-amber-400 font-black uppercase tracking-widest">AI Not Configured</p>
                <p className="text-[8px] text-zinc-500 mt-0.5">You need a FREE API key. Select Groq below, get a key, paste & save!</p>
              </div>
            </div>
          )}

          {/* FREE Options Banner */}
          {!config?.configured && (
            <div className="bg-neon-green/5 border border-neon-green/15 p-3">
              <p className="text-[8px] text-neon-green font-black uppercase tracking-widest mb-2">Free AI Providers (No Credit Card)</p>
              <div className="space-y-1.5">
                <button onClick={() => handleProviderSelect('groq')} className="w-full flex items-center gap-2 p-2 bg-black/50 border border-neon-green/10 hover:border-neon-green/30 transition-colors">
                  <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-gradient-to-br from-orange-500 to-red-500 text-white"><Zap size={10} /></div>
                  <div className="text-left">
                    <p className="text-[9px] text-white font-bold">Groq — Recommended</p>
                    <p className="text-[7px] text-zinc-500">Fastest free AI. Sign up at console.groq.com</p>
                  </div>
                  <span className="ml-auto text-[6px] font-black px-1.5 py-0.5 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-sm uppercase">Free</span>
                </button>
                <button onClick={() => handleProviderSelect('openrouter')} className="w-full flex items-center gap-2 p-2 bg-black/50 border border-zinc-800 hover:border-neon-green/30 transition-colors">
                  <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-gradient-to-br from-blue-500 to-violet-500 text-white"><Wifi size={10} /></div>
                  <div className="text-left">
                    <p className="text-[9px] text-white font-bold">OpenRouter</p>
                    <p className="text-[7px] text-zinc-500">Multiple free models including Llama 3.3 70B</p>
                  </div>
                  <span className="ml-auto text-[6px] font-black px-1.5 py-0.5 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-sm uppercase">Free</span>
                </button>
                <button onClick={() => handleProviderSelect('ollama')} className="w-full flex items-center gap-2 p-2 bg-black/50 border border-zinc-800 hover:border-neon-green/30 transition-colors">
                  <div className="w-5 h-5 flex items-center justify-center rounded-sm bg-gradient-to-br from-zinc-500 to-zinc-700 text-white"><Server size={10} /></div>
                  <div className="text-left">
                    <p className="text-[9px] text-white font-bold">Ollama (Local)</p>
                    <p className="text-[7px] text-zinc-500">Runs on your device. No key, no signup at all!</p>
                  </div>
                  <span className="ml-auto text-[6px] font-black px-1.5 py-0.5 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-sm uppercase">Free</span>
                </button>
              </div>
            </div>
          )}

          {/* Provider Selector */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Provider</label>
            <button
              onClick={() => setShowProviders(!showProviders)}
              className="w-full flex items-center justify-between p-3 bg-black border border-zinc-800 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <div className={cn("w-7 h-7 flex items-center justify-center rounded-sm bg-gradient-to-br text-white", display.color)}>
                  {display.icon}
                </div>
                <div className="text-left">
                  <p className="text-[11px] font-black text-white uppercase">{display.label}</p>
                  <p className="text-[8px] text-zinc-600">{display.desc.slice(0, 50)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {display.free && (
                  <span className="text-[7px] font-black px-1.5 py-0.5 bg-neon-green/10 text-neon-green border border-neon-green/20 rounded-sm uppercase">Free</span>
                )}
                <ChevronDown size={14} className={cn("text-zinc-600 transition-transform", showProviders && "rotate-180")} />
              </div>
            </button>

            {/* Provider Dropdown */}
            <AnimatePresence>
              {showProviders && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border border-zinc-800 bg-black"
                >
                  {Object.entries(PROVIDER_DISPLAY).map(([id, p]) => (
                    <button
                      key={id}
                      onClick={() => handleProviderSelect(id)}
                      className={cn(
                        "w-full flex items-center gap-3 p-3 text-left transition-colors border-b border-zinc-900 last:border-0",
                        selectedProvider === id ? "bg-accent/10" : "hover:bg-zinc-900"
                      )}
                    >
                      <div className={cn("w-7 h-7 flex items-center justify-center rounded-sm bg-gradient-to-br text-white shrink-0", p.color)}>
                        {p.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-[10px] font-black text-white uppercase">{p.label}</p>
                          {p.free && <span className="text-[6px] font-black px-1 py-0.5 bg-neon-green/10 text-neon-green rounded-sm uppercase">Free</span>}
                        </div>
                        <p className="text-[8px] text-zinc-600 truncate">{p.desc}</p>
                      </div>
                      {p.link && (
                        <ExternalLink size={10} className="text-zinc-700 shrink-0" />
                      )}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Get API Key Link / Setup Guide */}
          {display.link && needsKey && (
            <a
              href={display.link}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "flex items-center gap-2 p-2.5 border transition-colors",
                display.free
                  ? "bg-neon-green/5 border-neon-green/20 hover:border-neon-green/40"
                  : "bg-accent/5 border-accent/20 hover:border-accent/40"
              )}
            >
              <ExternalLink size={12} className={display.free ? "text-neon-green" : "text-accent"} />
              <div>
                <p className={cn("text-[9px] font-bold", display.free ? "text-neon-green" : "text-accent")}>
                  {display.free ? `Get FREE ${display.label} Key` : `Get ${display.label} API Key`}
                </p>
                {display.free && (
                  <p className="text-[7px] text-zinc-500 mt-0.5">No credit card required</p>
                )}
              </div>
            </a>
          )}

          {/* Setup Steps for Free Providers */}
          {display.free && display.setup && !config?.configured && (
            <div className="bg-neon-green/5 border border-neon-green/20 p-3 space-y-2">
              <p className="text-[8px] text-neon-green font-black uppercase tracking-widest">Quick Setup ({display.label})</p>
              <div className="space-y-1">
                {display.setup.split('  ').map((step, i) => (
                  <p key={i} className="text-[8px] text-zinc-400 font-mono">{step}</p>
                ))}
              </div>
            </div>
          )}

          {/* API Key Input */}
          {needsKey && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">API Key</label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={inputKey}
                  onChange={e => setInputKey(e.target.value)}
                  placeholder={config?.apiKeySet ? `Current: ${config.apiKey}` : 'Enter API key...'}
                  className="w-full bg-black border border-zinc-800 text-white text-[11px] font-mono pl-3 pr-10 py-2.5 focus:outline-none focus:border-accent placeholder:text-zinc-800 transition-colors"
                />
                <button
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {config?.apiKeySet && !inputKey && (
                <p className="text-[7px] text-zinc-700 font-mono">Leave blank to keep current key</p>
              )}
            </div>
          )}

          {/* Base URL (editable for custom) */}
          {selectedProvider === 'custom' && (
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Base URL</label>
              <input
                type="text"
                value={inputBaseUrl}
                onChange={e => setInputBaseUrl(e.target.value)}
                placeholder="https://your-api.example.com/v1"
                className="w-full bg-black border border-zinc-800 text-white text-[11px] font-mono pl-3 pr-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-zinc-800 transition-colors"
              />
            </div>
          )}

          {/* Model Input */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Model</label>
            <input
              type="text"
              value={inputModel}
              onChange={e => setInputModel(e.target.value)}
              placeholder="model-name"
              className="w-full bg-black border border-zinc-800 text-white text-[11px] font-mono pl-3 pr-3 py-2.5 focus:outline-none focus:border-accent placeholder:text-zinc-800 transition-colors"
            />
            {/* Model suggestions */}
            {config?.availableProviders.find(p => p.id === selectedProvider)?.models && (
              <div className="flex flex-wrap gap-1">
                {config.availableProviders.find(p => p.id === selectedProvider)!.models.slice(0, 5).map(m => (
                  <button
                    key={m}
                    onClick={() => setInputModel(m)}
                    className={cn(
                      "text-[7px] font-mono px-2 py-0.5 border rounded-sm transition-colors",
                      inputModel === m
                        ? "border-accent text-accent bg-accent/10"
                        : "border-zinc-900 text-zinc-600 hover:text-zinc-400 hover:border-zinc-700"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Test Result */}
          <AnimatePresence>
            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className={cn(
                  "p-3 border",
                  testResult.success
                    ? "bg-neon-green/5 border-neon-green/20"
                    : "bg-red-500/5 border-red-500/20"
                )}
              >
                <p className={cn("text-[9px] font-black", testResult.success ? "text-neon-green" : "text-red-400")}>
                  {testResult.msg}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-900 shrink-0 flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-colors rounded-sm disabled:opacity-50"
          >
            {testing ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
            {testing ? 'Testing...' : 'Test'}
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "flex-1 flex items-center justify-center gap-1.5 py-2.5 text-black text-[10px] font-black uppercase tracking-widest transition-colors rounded-sm disabled:opacity-50",
              saved ? "bg-neon-green" : "bg-accent hover:bg-white"
            )}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : saved ? <Check size={12} /> : <Save size={12} />}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
