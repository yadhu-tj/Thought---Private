import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Check, ChevronRight, CheckCircle2 } from 'lucide-react';
import { ParticleEffect, Particle } from './ParticleEffect';
import { GooglePayCheck } from './GooglePayCheck';

interface CounterPageProps {
  isCompleted: boolean;
  streak: number;
  totalCompleted: number;
  onToggleToday: () => void;
  onNavigateToGrid: () => void;
}

export function CounterPage({
  isCompleted,
  streak,
  totalCompleted,
  onToggleToday,
  onNavigateToGrid
}: CounterPageProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [animKey, setAnimKey] = useState(0);

  const playSuccessChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const now = ctx.currentTime;

      // Note 1 (A5) right as tick starts
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(783.99, now + 0.38);
      osc1.frequency.exponentialRampToValueAtTime(880, now + 0.44);
      gain1.gain.setValueAtTime(0.09, now + 0.38);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now + 0.38);
      osc1.stop(now + 0.75);

      // Note 2 (E6) right on tick close
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.44);
      gain2.gain.setValueAtTime(0.08, now + 0.44);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.44);
      osc2.stop(now + 1.0);
    } catch {
      // AudioContext unavailable
    }
  };

  const handlePress = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(25);
    }

    if (!isCompleted) {
      setAnimKey((prev) => prev + 1);
      playSuccessChime();

      // Subtle, refined micro-spark celebration
      const countParticles = 18;
      const newParticles = Array.from({ length: countParticles }).map((_, i) => {
        const angle = (i / countParticles) * 2 * Math.PI + (Math.random() - 0.5) * 0.3;
        const distance = 85 + Math.random() * 85;
        const palette = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#ffffff"];
        return {
          id: `${Date.now()}-${i}-${Math.random()}`,
          x: Math.cos(angle) * distance,
          y: Math.sin(angle) * distance,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: 4 + Math.random() * 5,
        };
      });
      setParticles((prev) => [...prev, ...newParticles]);
    }

    onToggleToday();
  };

  const handleParticleComplete = (id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });

  return (
    <div className="flex flex-col items-center justify-between flex-1 px-6 py-8 md:px-12 md:py-12 overflow-y-auto bg-[#0c0e12] w-full min-h-full">
      {/* Top Header - Clean, unboxed typography */}
      <div className="text-center space-y-1.5 mt-1 w-full max-w-md">
        <div className="text-xs font-medium text-stone-400 tracking-wide">
          <span>Today</span>
          <span className="mx-2 text-stone-600">·</span>
          <span>{todayFormatted}</span>
        </div>
        <h2 className="text-[#f4f4f5] text-3xl md:text-4xl font-semibold tracking-tight">
          Daily Check-in
        </h2>
        <p className="text-xs text-stone-400">
          {isCompleted ? "Your day is recorded and locked in" : "Tap once to register today's completion"}
        </p>
      </div>

      {/* Main Dial / Button Container */}
      <div className="flex flex-col items-center justify-center my-6 shrink-0">
        <div className="relative flex items-center justify-center">
          {/* Subtle ambient glow behind button */}
          <div
            className={`absolute w-72 h-72 rounded-full blur-[70px] pointer-events-none transition-opacity duration-700 ${
              isCompleted ? "bg-emerald-500/15 opacity-100" : "bg-white/[0.02] opacity-50"
            }`}
          />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.95 }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 22,
              mass: 0.4,
            }}
            onClick={handlePress}
            className={`relative flex items-center justify-center w-56 h-56 rounded-full transition-all duration-300 focus:outline-none cursor-pointer ${
              isCompleted
                ? "border border-emerald-500/40 shadow-[0_12px_40px_-10px_rgba(16,185,129,0.25)]"
                : "border border-white/[0.1] hover:border-white/[0.18] shadow-[0_12px_36px_-10px_rgba(0,0,0,0.6)]"
            }`}
          >
            {/* Tactile Surface Plate */}
            <div
              className={`w-full h-full rounded-full flex items-center justify-center relative overflow-hidden transition-colors duration-500 ${
                isCompleted
                  ? "bg-gradient-to-b from-[#0e271d] to-[#071610]"
                  : "bg-gradient-to-b from-[#191c23] via-[#14161c] to-[#0f1116]"
              }`}
            >
              {/* Subtle top specular sheen */}
              <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-white/[0.05] to-transparent pointer-events-none rounded-t-full" />

              {/* Perfectly centered inner icon container */}
              <AnimatePresence mode="wait">
                {isCompleted ? (
                  <motion.div
                    key={`completed-${animKey}`}
                    initial={{ opacity: 0, scale: 0.85 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.85 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className="flex items-center justify-center relative z-10"
                  >
                    {/* Google Pay Completed Circle & Tick - Aligned dead center in circle */}
                    <GooglePayCheck size={112} triggerKey={animKey} />
                  </motion.div>
                ) : (
                  <motion.div
                    key="pending"
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.85, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="flex items-center justify-center relative z-10"
                  >
                    {/* Idle Affordance Ring - Aligned dead center in circle */}
                    <div className="w-24 h-24 rounded-full border border-white/15 flex items-center justify-center group-hover:border-emerald-400/50 transition-colors">
                      <Check className="w-9 h-9 text-white/40 group-hover:text-white/80 transition-colors stroke-[2.2]" />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.button>

          {/* Particles */}
          <ParticleEffect particles={particles} onComplete={handleParticleComplete} />
        </div>

        {/* Text Container Placed Cleanly Below the Main Circle */}
        <div className="mt-5 text-center min-h-[44px] flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {isCompleted ? (
              <motion.div
                key="text-completed"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5"
              >
                <div className="text-emerald-400 font-semibold text-base tracking-tight">
                  Completed
                </div>
                <button
                  type="button"
                  onClick={handlePress}
                  className="text-xs text-stone-400 hover:text-stone-200 transition-colors cursor-pointer"
                >
                  Tap to undo
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="text-pending"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="space-y-0.5"
              >
                <div className="text-white font-medium text-base tracking-tight">
                  Mark as Done
                </div>
                <div className="text-xs text-stone-400">
                  Tap circle to register today
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Metrics Strip - Refined, unboxed, linear-grade cards */}
      <div className="w-full max-w-md space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#14171d] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
                {streak} {streak === 1 ? "day" : "days"}
              </div>
              <div className="text-xs text-stone-400 font-medium">
                Current streak
              </div>
            </div>
          </div>

          <div className="bg-[#14171d] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3.5">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
                {totalCompleted}
              </div>
              <div className="text-xs text-stone-400 font-medium">
                Total completed
              </div>
            </div>
          </div>
        </div>

        {/* Navigation to Weekly Bento */}
        <button
          onClick={onNavigateToGrid}
          className="w-full py-3.5 px-5 rounded-2xl bg-[#14171d] hover:bg-[#1a1e26] border border-white/[0.07] flex items-center justify-between text-stone-300 text-xs font-medium transition-colors cursor-pointer md:hidden"
        >
          <span>View weekly overview</span>
          <ChevronRight className="w-4 h-4 text-stone-400" />
        </button>
      </div>
    </div>
  );
}
