import { motion } from 'motion/react';

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  size: number;
}

interface ParticleEffectProps {
  particles: Particle[];
  onComplete: (id: string) => void;
}

export function ParticleEffect({ particles, onComplete }: ParticleEffectProps) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-10">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: "50%",
            top: "50%",
            backgroundColor: p.color,
            width: p.size,
            height: p.size,
            boxShadow: `0 0 12px ${p.color}`,
          }}
          initial={{ x: "-50%", y: "-50%", scale: 1, opacity: 1 }}
          animate={{
            x: `calc(-50% + ${p.x}px)`,
            y: `calc(-50% + ${p.y}px)`,
            scale: 0,
            opacity: 0,
          }}
          transition={{
            type: "spring",
            stiffness: 60,
            damping: 15,
            restDelta: 0.5,
          }}
          onAnimationComplete={() => onComplete(p.id)}
        />
      ))}
    </div>
  );
}
