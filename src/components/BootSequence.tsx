import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Cpu, Wifi, Lock, Database, Radio, Terminal, Eye } from 'lucide-react';

interface BootSequenceProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  { label: 'INITIALIZING NEX.AI KERNEL', icon: Cpu, duration: 400 },
  { label: 'LOADING NEURAL INTERFACE', icon: ShieldCheck, duration: 350 },
  { label: 'MOUNTING TOOL DATABASE (60 MODULES)', icon: Database, duration: 500 },
  { label: 'ESTABLISHING ENCRYPTED CHANNEL', icon: Lock, duration: 300 },
  { label: 'SCANNING NETWORK INTERFACES', icon: Radio, duration: 350 },
  { label: 'CONNECTING TO NEX.AI CORE', icon: Eye, duration: 600 },
  { label: 'CALIBRATING TERMINAL PROTOCOLS', icon: Terminal, duration: 300 },
  { label: 'SYSTEM READY', icon: ShieldCheck, duration: 200 },
];

const TOOL_CATEGORIES = [
  { name: 'RECONNAISSANCE', count: 8 },
  { name: 'SCANNING', count: 7 },
  { name: 'WEB ATTACKS', count: 6 },
  { name: 'WIRELESS', count: 5 },
  { name: 'PASSWORD', count: 5 },
  { name: 'EXPLOITATION', count: 5 },
  { name: 'FORENSICS', count: 4 },
  { name: 'REVERSE ENG', count: 4 },
  { name: 'SYSTEM', count: 5 },
  { name: 'NETWORK', count: 5 },
  { name: 'CRYPTOGRAPHY', count: 4 },
  { name: 'SCRIPTS', count: 6 },
];

export const BootSequence: React.FC<BootSequenceProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [showCategories, setShowCategories] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState(0);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const target = ((currentStep + 1) / BOOT_STEPS.length) * 100;
        if (prev >= target) return prev;
        return Math.min(prev + Math.random() * 3 + 0.5, target);
      });
    }, 30);
    return () => clearInterval(interval);
  }, [currentStep]);

  useEffect(() => {
    if (currentStep >= BOOT_STEPS.length) { setShowCategories(true); return; }
    const timer = setTimeout(() => {
      setProgress(((currentStep + 1) / BOOT_STEPS.length) * 100);
      setCurrentStep(prev => prev + 1);
    }, BOOT_STEPS[currentStep].duration);
    return () => clearTimeout(timer);
  }, [currentStep]);

  useEffect(() => {
    if (!showCategories) return;
    let fadeTimer: ReturnType<typeof setTimeout> | null = null;
    let completeTimer: ReturnType<typeof setTimeout> | null = null;
    const interval = setInterval(() => {
      setVisibleCategories(prev => {
        if (prev >= TOOL_CATEGORIES.length) {
          clearInterval(interval);
          fadeTimer = setTimeout(() => setFadeOut(true), 600);
          completeTimer = setTimeout(() => onComplete(), 1200);
          return prev;
        }
        return prev + 1;
      });
    }, 80);
    return () => {
      clearInterval(interval);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (completeTimer) clearTimeout(completeTimer);
    };
  }, [showCategories, onComplete]);

  const StepIcon = currentStep < BOOT_STEPS.length ? BOOT_STEPS[currentStep].icon : ShieldCheck;

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div initial={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] bg-[#000] flex flex-col items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,255,65,0.04)_0%,transparent_70%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_2px] opacity-30 pointer-events-none" />

          <div className="w-full max-w-2xl px-6 space-y-8 relative z-10">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
              <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase text-white mb-2">
                NEX<span className="text-accent">.AI</span>
              </h1>
              <p className="text-[10px] font-black tracking-[0.5em] text-zinc-600 uppercase">AI-Powered Terminal & Exploit Assistant</p>
            </motion.div>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <motion.div key={currentStep} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="w-8 h-8 border border-accent/40 bg-accent/10 flex items-center justify-center">
                  <StepIcon size={16} className="text-accent" />
                </motion.div>
                <motion.span key={`label-${currentStep}`} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-accent font-mono">
                  {currentStep < BOOT_STEPS.length ? BOOT_STEPS[currentStep].label : 'ALL SYSTEMS NOMINAL'}
                </motion.span>
              </div>

              <div className="relative">
                <div className="h-2 bg-zinc-900 border border-zinc-800 relative overflow-hidden">
                  <motion.div className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-emerald-400"
                    animate={{ width: `${progress}%` }} transition={{ duration: 0.1 }} />
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[8px] font-mono text-zinc-700 uppercase tracking-widest">{currentStep}/{BOOT_STEPS.length} modules</span>
                  <span className="text-[8px] font-mono text-accent uppercase tracking-widest">{Math.floor(progress)}%</span>
                </div>
              </div>

              <div className="bg-black/60 border border-zinc-900 p-3 max-h-32 overflow-y-auto custom-scrollbar">
                <div className="space-y-1">
                  {BOOT_STEPS.slice(0, currentStep).map((step, i) => {
                    const Ic = step.icon;
                    return (
                      <div key={i} className="flex items-center gap-2">
                        <Ic size={10} className="text-accent/60" />
                        <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-widest">
                          [{String(i + 1).padStart(2, '0')}] {step.label}
                        </span>
                        <span className="text-[8px] font-mono text-accent ml-auto">OK</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <AnimatePresence>
              {showCategories && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600">LOADING TOOL MODULES...</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1">
                    {TOOL_CATEGORIES.slice(0, visibleCategories).map((cat, i) => (
                      <motion.div key={cat.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center justify-between bg-black/40 border border-zinc-900 px-2 py-1.5">
                        <span className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-wider truncate">{cat.name}</span>
                        <span className="text-[7px] font-mono text-accent">{cat.count}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="text-center space-y-1 mt-8">
              <p className="text-[8px] font-mono text-zinc-800 uppercase tracking-widest">Moto G Stylus 5G 2024 | Termux Compatible | 30 Features</p>
              <p className="text-[8px] font-mono text-zinc-800 uppercase tracking-widest">Ethical Hacking Only — Authorized Access Required</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
