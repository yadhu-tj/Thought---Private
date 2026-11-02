import { motion, AnimatePresence } from 'motion/react';
import { Calendar, Check } from 'lucide-react';

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
    const isPrimary = index === 0;
    const isWeekend = index === 3 || index === 6;

    if (completed) {
      if (isPrimary) {
        return "col-span-2 md:col-span-2 lg:col-span-2 bg-[#12221b] border-emerald-500/35 shadow-[0_4px_24px_-8px_rgba(16,185,129,0.2)]";
      }
      if (isWeekend) {
        return "col-span-2 md:col-span-2 lg:col-span-2 bg-[#101b17] border-emerald-500/25";
      }
      return "col-span-1 bg-[#101b17] border-emerald-500/25";
    }

    if (isPrimary) {
      return "col-span-2 md:col-span-2 lg:col-span-2 bg-[#14171d] border-white/[0.09] hover:border-white/[0.16]";
    }
    if (isWeekend) {
      return "col-span-2 md:col-span-2 lg:col-span-2 bg-[#14171d] border-white/[0.07] hover:border-white/[0.14]";
    }
    return "col-span-1 bg-[#14171d] border-white/[0.07] hover:border-white/[0.14]";
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pb-24 md:pb-8">
      {days.map((day, idx) => {
        return (
          <motion.div
            key={day.dateStr}
            layoutId={`card-${day.dateStr}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              type: "spring",
              stiffness: 140,
              damping: 18,
              delay: idx * 0.03,
            }}
            onClick={() => onToggleComplete(day.dateStr)}
            className={`relative rounded-2xl border p-5 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none min-h-[140px] ${getCardStyle(
              idx,
              day.completed
            )}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-stone-400">
                    {day.label}
                  </span>
                  {idx === 0 && (
                    <span className="text-[10px] text-emerald-400 font-medium">
                      (Current)
                    </span>
                  )}
                </div>
                <h3 className="text-base font-semibold text-white tracking-tight mt-1">
                  {day.fullLabel}
                </h3>
              </div>

              {/* Check Action Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleComplete(day.dateStr);
                }}
                className={`w-9 h-9 rounded-xl border flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                  day.completed
                    ? "bg-emerald-500 border-emerald-400 text-white shadow-[0_2px_10px_rgba(16,185,129,0.3)]"
                    : "bg-white/[0.04] border-white/[0.1] text-stone-400 hover:text-white hover:border-white/20"
                }`}
              >
                <AnimatePresence mode="popLayout">
                  {day.completed ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0.8 }}
                      animate={{ scale: [0.8, 1.15, 1] }}
                      exit={{ scale: 0 }}
                      transition={{ duration: 0.28, ease: "easeOut" }}
                      className="flex items-center justify-center w-full h-full pointer-events-none"
                    >
                      <svg viewBox="0 0 40 40" className="w-5 h-5">
                        <motion.circle
                          cx="20"
                          cy="20"
                          r="15"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.2"
                          strokeLinecap="round"
                          style={{ transformOrigin: "20px 20px", rotate: "-90deg" }}
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ duration: 0.32, ease: "easeOut" }}
                        />
                        <motion.path
                          d="M 12 20.5 L 17.5 26 L 28 15"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          initial={{ pathLength: 0 }}
                          animate={{ pathLength: 1 }}
                          transition={{ delay: 0.22, duration: 0.2, ease: "easeOut" }}
                        />
                      </svg>
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
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 mt-2 border-t border-white/[0.05]">
              <span className="text-xs text-stone-400">
                Status
              </span>
              <span
                className={`text-xs font-medium flex items-center gap-1.5 ${
                  day.completed ? "text-emerald-400" : "text-stone-400"
                }`}
              >
                {day.completed ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    Done
                  </>
                ) : (
                  "Pending"
                )}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
