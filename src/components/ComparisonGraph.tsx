import { useState } from 'react';
import { motion } from 'motion/react';
import { Check, TrendingUp } from 'lucide-react';

interface DayData {
  label: string;
  count: number;
  completed: boolean;
}

interface ComparisonGraphProps {
  data: DayData[];
}

export function ComparisonGraph({ data }: ComparisonGraphProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const totalCompleted = data.filter((d) => d.completed).length;
  const completionRate = Math.round((totalCompleted / (data.length || 1)) * 100);
  const chartHeight = 110;

  return (
    <div className="bg-[#14171d] border border-white/[0.07] rounded-2xl p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="text-xs font-medium text-stone-400">
            Weekly Performance
          </span>
          <h3 className="text-lg font-semibold text-white tracking-tight mt-0.5">
            Consistency Trend
          </h3>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1 bg-white/[0.04] border border-white/[0.08] rounded-lg text-xs font-medium text-stone-300">
          <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-mono tabular-nums">{completionRate}%</span>
        </div>
      </div>

      <div className="relative h-44 flex items-end justify-between px-2 pt-6">
        {/* Subtle Hairline Dividers */}
        <div className="absolute inset-x-0 top-6 bottom-8 flex flex-col justify-between pointer-events-none">
          <div className="w-full border-b border-white/[0.04]" />
          <div className="w-full border-b border-white/[0.04]" />
          <div className="w-full border-b border-white/[0.04]" />
        </div>

        {data.map((day, idx) => {
          const barHeight = day.completed ? chartHeight : 18;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={day.label}
              className="flex flex-col items-center flex-1 group relative cursor-pointer"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className="h-32 flex items-end justify-center w-full relative">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${barHeight}px` }}
                  transition={{ type: "spring", stiffness: 120, damping: 16, delay: idx * 0.04 }}
                  className={`w-6 md:w-8 rounded-lg relative transition-all duration-200 flex items-center justify-center ${
                    day.completed
                      ? "bg-emerald-500 shadow-[0_2px_12px_rgba(16,185,129,0.25)]"
                      : "bg-white/[0.06] group-hover:bg-white/[0.1]"
                  }`}
                >
                  {day.completed && (
                    <Check className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                  )}
                </motion.div>

                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-[108%] bg-[#0c0e12] border border-white/15 py-1.5 px-3 rounded-lg z-30 shadow-xl flex flex-col items-center text-center pointer-events-none min-w-[76px]"
                  >
                    <span className="text-[10px] text-stone-400 font-medium">{day.label}</span>
                    <span className={`text-xs font-semibold mt-0.5 ${day.completed ? "text-emerald-400" : "text-stone-400"}`}>
                      {day.completed ? "Done" : "Missed"}
                    </span>
                  </motion.div>
                )}
              </div>

              <span className={`text-xs mt-3 transition-colors ${isHovered ? 'text-white font-medium' : 'text-stone-400'}`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/[0.05] grid grid-cols-2 gap-4 text-xs">
        <div>
          <span className="text-stone-400 block">Completed Days</span>
          <span className="text-sm font-semibold text-white mt-0.5 block font-mono tabular-nums">
            {totalCompleted} of {data.length} registered
          </span>
        </div>
        <div>
          <span className="text-stone-400 block">Weekly Rate</span>
          <span className="text-sm font-semibold text-emerald-400 mt-0.5 block font-mono tabular-nums">
            {completionRate}% success
          </span>
        </div>
      </div>
    </div>
  );
}
