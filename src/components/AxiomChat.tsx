import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, ShieldCheck, Sparkles, Copy, Check, Trash2, BrainCircuit, ChevronDown, ChevronUp, Plus, MessageSquare, RotateCcw, Download, Settings } from 'lucide-react';
import { AISettings } from './AISettings';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import { ChatMessage } from '../types';
import { STARTER_PROMPTS } from '../constants';

interface AxiomChatProps {
  onSendMessage: (msg: string) => Promise<void>;
  messages: ChatMessage[];
  isThinking: boolean;
  onClear?: () => void;
  onNewChat?: () => void;
  onDeleteSession?: () => void;
  sessionTitle?: string;
  sessionCount?: number;
}

export const AxiomChat: React.FC<AxiomChatProps> = ({ onSendMessage, messages, isThinking, onClear, onNewChat, onDeleteSession, sessionTitle, sessionCount }) => {
  const [input, setInput] = useState('');
  const [expandedReasoning, setExpandedReasoning] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isThinking) {
      onSendMessage(input);
      setInput('');
    }
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }
  };

  const exportChat = () => {
    const text = messages.map(m => `[${m.role.toUpperCase()}]\n${m.content}`).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aether-chat-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setShowMenu(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0D0D0D] relative font-display overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:32px_32px]"></div>

      {/* Header - Compact mobile */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-900 shrink-0 bg-[#0D0D0D]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 md:w-10 md:h-10 bg-accent flex items-center justify-center shadow-[0_0_15px_rgba(255,95,31,0.2)]">
            <Bot className="text-black" size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white uppercase tracking-tighter flex items-center gap-2">
              AXIOM CORE
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse"></div>
            </h2>
            <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.15em] hidden sm:block">Neural Output v3.4 | Axiom Build</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings(true)} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-accent transition-colors" title="AI Settings">
            <Settings size={18} />
          </button>
          <button onClick={onNewChat ?? undefined} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
            <Plus size={18} />
          </button>
          <button onClick={exportChat} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors">
            <Download size={18} />
          </button>
          {sessionCount > 1 && (
            <button onClick={onDeleteSession} className="p-2 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 transition-colors">
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-6 pb-12 space-y-6 md:space-y-10 z-0">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center max-w-xl mx-auto text-center space-y-6 px-4">
            <div className="relative">
              <div className="absolute inset-0 bg-accent blur-3xl opacity-5 animate-pulse"></div>
              <BrainCircuit size={50} className="text-zinc-900 relative z-10 md:w-20 md:h-20" />
            </div>
            <div className="space-y-3">
              <h3 className="text-xl md:text-3xl font-black text-white uppercase tracking-tighter">Connection Ready.</h3>
              <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest max-w-sm mx-auto leading-relaxed">
                Analyze, pentest, or execute hardening protocols.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-lg">
              {STARTER_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => onSendMessage(prompt)}
                  disabled={isThinking}
                  className="text-left p-3.5 bg-zinc-900/20 border border-zinc-900 hover:bg-zinc-900/40 hover:border-accent/40 transition-all group overflow-hidden relative disabled:opacity-50 rounded-sm"
                >
                  <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest leading-normal group-hover:text-white transition-colors">{prompt}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={cn(
              "flex gap-3 md:gap-5 max-w-4xl",
              message.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 flex items-center justify-center shrink-0 border-2 rounded-sm",
              message.role === 'assistant'
                ? "bg-black border-zinc-800 text-accent"
                : "bg-accent border-accent text-black"
            )}>
              {message.role === 'assistant' ? <Bot size={16} /> : <User size={16} />}
            </div>

            <div className={cn(
              "flex-1 space-y-3 min-w-0",
              message.role === 'user' ? "text-right" : ""
            )}>
              {/* Reasoning Steps */}
              {message.role === 'assistant' && message.reasoningSteps && (
                <div className="border-l border-dashed border-zinc-800 pl-3 md:pl-5 mb-3">
                  <button
                    onClick={() => setExpandedReasoning(expandedReasoning === i ? null : i)}
                    className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] hover:text-zinc-400 transition-colors"
                  >
                    <Sparkles size={11} className="text-neon-green" />
                    Thought ({message.reasoningSteps.length} steps)
                    {expandedReasoning === i ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                  </button>
                  <AnimatePresence>
                    {expandedReasoning === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="py-3 space-y-1.5">
                          {message.reasoningSteps.map((step, si) => (
                            <div key={si} className="flex gap-3 text-[9px] font-mono">
                              <span className="text-neon-green opacity-40 shrink-0">&#9679;</span>
                              <span className="text-zinc-500 uppercase tracking-widest">{step}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Message Content */}
              <div className={cn(
                "text-xs md:text-sm leading-relaxed",
                message.role === 'assistant'
                  ? "text-zinc-300"
                  : "bg-surface border border-zinc-800 p-3 md:p-5 text-white font-black uppercase tracking-tight rounded-sm"
              )}>
                <div className="markdown-body">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>

                {/* Copy button */}
                {message.role === 'assistant' && (
                  <button
                    onClick={() => copyToClipboard(message.content, i)}
                    className="mt-3 flex items-center gap-1.5 text-[9px] font-black text-zinc-600 hover:text-zinc-300 uppercase tracking-widest transition-colors"
                  >
                    {copiedIndex === i ? <Check size={11} className="text-neon-green" /> : <Copy size={11} />}
                    {copiedIndex === i ? 'Copied' : 'Copy'}
                  </button>
                )}

                {/* Tool Badges */}
                {message.toolsUsed && message.toolsUsed.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {message.toolsUsed.map((tool, ti) => (
                      <span key={ti} className="text-[8px] font-black uppercase bg-black text-accent px-2 py-0.5 border border-accent/20 flex items-center gap-1.5 tracking-widest">
                        <ShieldCheck size={10} className="text-neon-green" />
                        {tool}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {isThinking && (
          <div className="flex gap-3">
            <div className="w-8 h-8 flex items-center justify-center shrink-0 bg-black border border-zinc-800 text-accent rounded-sm">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2 text-[10px] uppercase font-black text-neon-green tracking-[0.3em] animate-pulse">
                Neural Handshake Active
              </div>
              <div className="flex gap-1.5">
                {[...Array(6)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-8 h-1 bg-zinc-900"
                    animate={{ backgroundColor: ['#18181b', '#39FF14', '#18181b'] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input - Larger touch targets for mobile */}
      <div className="p-3 md:p-5 shrink-0 bg-black/40 backdrop-blur-xl border-t border-zinc-900 safe-bottom">
        <form onSubmit={handleSubmit} className="relative group">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            ref={inputRef}
            disabled={isThinking}
            placeholder="Ask Axiom anything..."
            className="w-full bg-black border border-zinc-800 text-white pl-4 pr-14 py-3.5 md:py-4 focus:outline-none focus:border-accent transition-all placeholder:text-zinc-700 font-bold uppercase tracking-tighter text-[14px] md:text-lg rounded-sm"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="absolute right-1.5 top-1.5 bottom-1.5 px-3 md:px-5 bg-accent text-black flex items-center justify-center hover:bg-white transition-colors disabled:opacity-20 disabled:cursor-not-allowed font-black uppercase tracking-widest text-[10px] rounded-sm"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* AI Settings Modal */}
      {showSettings && <AISettings onClose={() => setShowSettings(false)} />}
    </div>
  );
};
