import { motion } from 'motion/react';

interface GooglePayCheckProps {
  size?: number;
  triggerKey?: string | number;
}

export function GooglePayCheck({ size = 112, triggerKey }: GooglePayCheckProps) {
  return (
    <div
      key={triggerKey}
      className="relative flex items-center justify-center select-none pointer-events-none"
      style={{ width: size, height: size }}
    >
      {/* Expanding shockwave ring */}
      <motion.div
        initial={{ scale: 0.85, opacity: 0.7 }}
        animate={{ scale: 1.35, opacity: 0 }}
        transition={{
          delay: 0.42,
          duration: 0.55,
          ease: "easeOut",
        }}
        className="absolute inset-0 rounded-full border border-emerald-400/60 bg-emerald-500/10 pointer-events-none"
      />

      {/* Main SVG Container with Google Pay Spring Pop */}
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        initial={{ scale: 0.9 }}
        animate={{ scale: [0.9, 1.06, 1] }}
        transition={{
          delay: 0.4,
          duration: 0.35,
          ease: [0.25, 1.4, 0.5, 1],
        }}
      >
        {/* Emerald background fill circle */}
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="#059669"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.28,
            delay: 0.12,
            ease: "easeOut",
          }}
        />

        {/* Outer Circular Stroke Tracing 0 to 360 degrees */}
        <motion.circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="#10b981"
          strokeWidth="5.5"
          strokeLinecap="round"
          style={{
            transformOrigin: "50% 50%",
            rotate: "-90deg",
          }}
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            duration: 0.44,
            ease: [0.65, 0, 0.35, 1],
          }}
        />

        {/* Precision-Centered Crisp White Tick Mark (optically and geometrically centered at 50, 50) */}
        <motion.path
          d="M 29.5 50.5 L 43.5 64.5 L 70.5 35.5"
          fill="none"
          stroke="#ffffff"
          strokeWidth="6.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{
            delay: 0.4,
            duration: 0.26,
            ease: [0.25, 1, 0.5, 1],
          }}
        />
      </motion.svg>
    </div>
  );
}
