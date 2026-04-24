import React, { useState } from 'react';
import { KeyRound, Copy, Check, RefreshCw, Shield, ShieldAlert, ShieldCheck, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

export const PasswordGenerator: React.FC = () => {
  const [length, setLength] = useState(16);
  const [useUpper, setUseUpper] = useState(true);
  const [useLower, setUseLower] = useState(true);
  const [useNumbers, setUseNumbers] = useState(true);
  const [useSymbols, setUseSymbols] = useState(false);
  const [password, setPassword] = useState('');
  const [strength, setStrength] = useState({ label: '', entropy: 0, level: '' });
  const [copied, setCopied] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  const generate = async () => {
    try {
      const params = new URLSearchParams({
        length: String(length),
        uppercase: String(useUpper),
        lowercase: String(useLower),
        numbers: String(useNumbers),
        symbols: String(useSymbols),
      });
      const res = await fetch(`/api/tools/password?${params}`);
      const data = await res.json();
      setPassword(data.password);
      setStrength({ label: data.strength, entropy: data.entropy, level: data.strength });
      setHistory(prev => [data.password, ...prev.slice(0, 9)]);
    } catch {
      // Fallback client-side generation
      const chars = [
        ...(useLower ? 'abcdefghijklmnopqrstuvwxyz' : ''),
        ...(useUpper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : ''),
        ...(useNumbers ? '0123456789' : ''),
        ...(useSymbols ? '!@#$%^&*()_+-=[]{}|;:,.<>?' : ''),
      ].join('') || 'abcdefghijklmnopqrstuvwxyz0123456789';
      const arr = new Uint32Array(length);
      crypto.getRandomValues(arr);
      const pw = Array.from(arr, v => chars[v % chars.length]).join('');
      setPassword(pw);
      setHistory(prev => [pw, ...prev.slice(0, 9)]);
    }
  };

  React.useEffect(() => { generate(); }, []);

  const copyPassword = () => {
    navigator.clipboard.writeText(password).catch(() => {
      // Fallback for clipboard permission denied (common on mobile)
      try {
        const ta = document.createElement('textarea');
        ta.value = password;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch { /* ignore */ }
    });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const strengthColor: Record<string, string> = {
    'weak': 'text-red-500',
    'fair': 'text-amber-400',
    'strong': 'text-emerald-400',
    'very strong': 'text-neon-green',
    'excellent': 'text-neon-green',
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-900 shrink-0">
        <h2 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
          <KeyRound size={14} className="text-accent" />
          PASSWORD GENERATOR
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
        {/* Generated Password */}
        <div className="bg-black border border-zinc-900 p-4 relative">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Generated Password</p>
          <div className="font-mono text-lg text-white break-all leading-relaxed pr-10">{password || '...'}</div>
          <button onClick={copyPassword} className="absolute top-3 right-3 p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
            {copied ? <Check size={14} className="text-neon-green" /> : <Copy size={14} />}
          </button>
          <div className="mt-3 flex items-center gap-2">
            <span className={cn("text-[9px] font-black uppercase", strengthColor[strength.label] || 'text-zinc-500')}>
              {strength.label || '---'}
            </span>
            <span className="text-[9px] text-zinc-600 font-mono">{strength.entropy} bits entropy</span>
          </div>
        </div>

        {/* Options */}
        <div className="bg-black border border-zinc-900 p-4 space-y-3">
          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Options</p>

          {/* Length slider */}
          <div>
            <div className="flex justify-between mb-1">
              <span className="text-[9px] text-zinc-400 uppercase">Length</span>
              <span className="text-[9px] text-white font-mono">{length}</span>
            </div>
            <input type="range" min={4} max={128} value={length} onChange={e => setLength(Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 appearance-none cursor-pointer accent-accent" />
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'A-Z Uppercase', value: useUpper, setter: setUseUpper },
              { label: 'a-z Lowercase', value: useLower, setter: setUseLower },
              { label: '0-9 Numbers', value: useNumbers, setter: setUseNumbers },
              { label: '!@# Symbols', value: useSymbols, setter: setUseSymbols },
            ].map(opt => (
              <button key={opt.label} onClick={() => opt.setter(!opt.value)}
                className={cn("p-2 border text-[9px] font-black uppercase tracking-widest transition-all",
                  opt.value ? "bg-accent/10 border-accent/40 text-accent" : "bg-black border-zinc-800 text-zinc-600"
                )}>
                {opt.value ? '[X]' : '[ ]'} {opt.label}
              </button>
            ))}
          </div>

          <button onClick={generate} className="w-full py-2.5 bg-accent text-black font-black uppercase tracking-widest text-[10px] hover:bg-white transition-colors flex items-center justify-center gap-2">
            <RefreshCw size={12} /> Generate New
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="bg-black border border-zinc-900 p-4">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3">Recent ({history.length})</p>
            <div className="space-y-1">
              {history.map((pw, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 hover:bg-zinc-900 group cursor-pointer" onClick={() => { navigator.clipboard.writeText(pw); }}>
                  <span className="text-[9px] text-zinc-600 font-mono flex-shrink-0">{i + 1}</span>
                  <pre className="text-[9px] text-zinc-400 font-mono whitespace-pre-wrap break-all flex-1 group-hover:text-white">{pw}</pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
