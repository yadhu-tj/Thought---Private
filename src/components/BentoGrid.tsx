import { motion, AnimatePresence } from 'motion/react';
import { Check, Flame, Trophy, Calendar, Sparkles } from 'lucide-react';

export interface DayRecord {
  dateStr: string;
  label: string;
  fullLabel: string;
  count: number;
  completed: boolean;
}

interface BentoGridProps {
  days: DayRecord[];
  onToggleComplete: (dateStr: string) => void;
}

export function BentoGrid({ days, onToggleComplete }: BentoGridProps) {
  const getCardStyle = (index: number, completed: boolean) => {
    const isSpanned = index === 0 || index === 3 || index === 6;
    if (completed) {
      if (index === 0) {
        return "col-span-2 bg-gradient-to-br from-indigo-950/60 to-purple-950/40 border-indigo-500/30 shadow-[0_0_25px_-5px_rgba(99,102,241,0.15)] text-white";
      }
      if (index === 3) {
        return "col-span-2 bg-gradient-to-br from-pink-950/60 to-purple-950/40 border-pink-500/30 shadow-[0_0_25px_-5px_rgba(236,72,153,0.15)] text-white";
      }
      if (index === 6) {
        return "col-span-2 bg-[#6366f1] border-white/10 shadow-[0_0_30px_-5px_rgba(99,102,241,0.4)] text-white";
      }
      return "col-span-1 bg-white/[0.08] border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.05)] text-white";
    }

    if (isSpanned) {
      return "col-span-2 bg-[#0A0A0A] border-white/5 text-[#F5F5F5] hover:bg-white/[0.02]";
    }
    return "col-span-1 bg-white/[0.03] border-white/15 text-[#F5F5F5] hover:bg-white/[0.05]";
  };

  return (
    <div className="grid grid-cols-2 gap-4 pb-24">
      {days.map((day, idx) => {
        const isSpanned = idx === 0 || idx === 3 || idx === 6;
        return (
          <motion.div
            key={day.dateStr}
            layoutId={`card-${day.dateStr}`}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 110,
              damping: 15,
              delay: idx * 0.04,
            }}
            className={`relative rounded-3xl border p-6 flex flex-col justify-between transition-all duration-300 ${getCardStyle(idx, day.completed)}`}
          >
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] opacity-40">
                    {day.label}
                  </span>
                  {idx === 0 && (
                    <span className="flex h-1 w-1 rounded-full bg-pink-500 animate-pulse" />
                  )}
                </div>
                <h3 className="font-sans font-light text-lg tracking-tight mt-1 opacity-90">
                  {day.fullLabel}
                </h3>
              </div>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onToggleComplete(day.dateStr)}
                className={`relative flex items-center justify-center w-10 h-10 rounded-full border transition-all duration-300 ${
                  day.completed
                    ? "bg-white text-indigo-600 border-transparent shadow-lg"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white"
                }`}
              >
                <AnimatePresence mode="popLayout">
                  {day.completed ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0, rotate: 45 }}
                      transition={{ type: "spring", stiffness: 220, damping: 11 }}
                    >
                      <Check className="w-5 h-5 pointer-events-none" strokeWidth={3} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Calendar className="w-4 h-4 pointer-events-none" />
                    </motion.div>
                  )}
                </AnimatePresence>

                {day.completed && (
                  <motion.span
                    initial={{ scale: 0.8, opacity: 0.5 }}
                    animate={{ scale: 1.8, opacity: 0 }}
                    transition={{ duration: 0.6 }}
                    className="absolute inset-0 border border-white rounded-full pointer-events-none"
                  />
                )}
              </motion.button>
            </div>

            <div className="flex items-end justify-between mt-4">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-wider opacity-40 block">
                  Logged Velocity
                </span>
                <div className="text-3xl font-bold font-sans mt-0.5 tracking-tighter">
                  {day.count}
                </div>
              </div>

              {isSpanned && (
                <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-white/[0.02]">
                  {idx === 0 && <Flame className="w-4 h-4 text-orange-400" />}
                  {idx === 3 && <Sparkles className="w-4 h-4 text-pink-400" />}
                  {idx === 6 && <Trophy className="w-4 h-4 text-yellow-400" />}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
