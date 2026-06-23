import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Brain, Sparkles, ChevronRight } from 'lucide-react';
import { RollingNumber } from './RollingNumber';
import { ParticleEffect, Particle } from './ParticleEffect';

interface CounterPageProps {
  count: number;
  onIncrement: () => void;
  onNavigateToGrid: () => void;
}

export function CounterPage({ count, onIncrement, onNavigateToGrid }: CounterPageProps) {
  const [particles, setParticles] = useState<Particle[]>([]);

  const handlePress = () => {
    if (typeof window !== 'undefined' && window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(15);
    }
    onIncrement();
    const countParticles = 14;
    const newParticles = Array.from({ length: countParticles }).map((_, i) => {
      const angle = (i / countParticles) * 2 * Math.PI + (Math.random() - 0.5) * 0.4;
      const distance = 80 + Math.random() * 90;
      const palette = ["#6366f1", "#a855f7", "#ec4899", "#38bdf8", "#f43f5e"];
      return {
        id: `${Date.now()}-${i}-${Math.random()}`,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        color: palette[Math.floor(Math.random() * palette.length)],
        size: 5 + Math.random() * 7,
      };
    });
    setParticles((prev) => [...prev, ...newParticles]);
  };

  const handleParticleComplete = (id: string) => {
    setParticles((prev) => prev.filter((p) => p.id !== id));
  };

  const getRandomPhrase = () => {
    if (count === 0) return "Quiet mind. Ready to capture.";
    if (count <= 3) return "A spark of clarity. Keep capturing.";
    if (count <= 8) return "Flow state active. Thoughts taking shape.";
    return "Exceptional alignment. Your mind is wide awake.";
  };

  return (
    <div className="flex flex-col items-center justify-between flex-1 px-6 pt-10 pb-20 overflow-y-auto bg-[#050505]">
      <div className="text-center space-y-3 mt-4 w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/[0.03] border border-white/10 rounded-md">
          <Brain className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span className="text-[10px] font-mono text-indigo-400 font-semibold uppercase tracking-[0.25em]">
            MIND_LOG / V.1.0
          </span>
        </div>
        <h2 className="text-[#F5F5F5] font-light tracking-tight text-3xl font-sans mt-2">
          Daily Intensity
        </h2>
      </div>

      <div className="my-6">
        <RollingNumber value={count} />
      </div>

      <div className="relative flex items-center justify-center my-8">
        <div className="absolute w-[350px] h-[350px] bg-indigo-600/10 rounded-full blur-[90px] pointer-events-none" />

        <div className="absolute w-72 h-72 rounded-full border border-white/5 animate-[spin_40s_linear_infinite]" />
        <div className="absolute w-56 h-56 rounded-full border border-dashed border-white/10 animate-[spin_25s_linear_infinite_reverse]" />

        <div className="relative z-10 group">
          <div className="absolute inset-0 bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.90, y: 7 }}
            transition={{
              type: "spring",
              stiffness: 450,
              damping: 15,
              mass: 0.5,
            }}
            onClick={handlePress}
            className="relative flex items-center justify-center w-52 h-52 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-[0_0_60px_-15px_rgba(99,102,241,0.5)] focus:outline-none cursor-pointer"
          >
            <div className="w-full h-full rounded-full bg-[#050505] flex flex-col items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-white/[0.04]" />
              <Plus className="w-12 h-12 text-[#F5F5F5] relative z-10" strokeWidth={1.5} />
              <div className="text-[9px] uppercase tracking-[0.25em] font-mono text-white/40 mt-2 relative z-10">
                LOG ENTRY
              </div>
            </div>
          </motion.button>
        </div>

        <ParticleEffect particles={particles} onComplete={handleParticleComplete} />
      </div>

      <div className="w-full max-w-sm space-y-8 mt-4">
        <div className="border-b border-white/10 pb-4 flex justify-between text-[10px] font-mono tracking-tighter opacity-70">
          <div>
            Current Session<br />
            <span className="text-white font-bold opacity-100 uppercase tracking-widest">{getRandomPhrase()}</span>
          </div>
          <div className="text-right">
            Daily System<br />
            <span className="text-white font-bold opacity-100 uppercase tracking-widest">Active State</span>
          </div>
        </div>

        <motion.button
          whileHover={{ x: 4, scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={onNavigateToGrid}
          className="w-full py-4 px-6 rounded-3xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between text-[#F5F5F5] font-mono text-xs uppercase tracking-wider transition-colors duration-200"
        >
          <div className="flex items-center gap-3">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>Weekly Velocity</span>
          </div>
          <ChevronRight className="w-4 h-4 text-white/40" />
        </motion.button>
      </div>
    </div>
  );
}
