import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Calendar, TrendingUp } from 'lucide-react';

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

  const maxCount = Math.max(...data.map(d => d.count), 5);
  const totalCounts = data.reduce((acc, d) => acc + d.count, 0);
  const avgCounts = parseFloat((totalCounts / data.length).toFixed(1));

  const chartHeight = 120;

  return (
    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-indigo-400">
            Cognitive Distribution
          </span>
          <h3 className="font-sans font-light text-xl tracking-tight text-[#F5F5F5] mt-1">
            Weekly Intensity
          </h3>
        </div>
        <div className="flex items-center gap-2 bg-white/[0.03] border border-white/5 rounded-xl py-1 px-3 text-[10px] font-mono text-white/50">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          <span>Avg: {avgCounts} / day</span>
        </div>
      </div>

      <div className="relative h-44 flex items-end justify-between px-2 pt-6">
        <div className="absolute inset-x-0 top-6 bottom-0 flex flex-col justify-between pointer-events-none">
          <div className="w-full border-b border-white/[0.02]" />
          <div className="w-full border-b border-white/[0.02]" />
          <div className="w-full border-b border-white/[0.02]" />
          <div className="w-full border-b border-white/[0.02]" />
        </div>

        {data.map((day, idx) => {
          const barHeight = maxCount > 0 ? (day.count / maxCount) * chartHeight : 0;
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
                  animate={{ height: `${Math.max(barHeight, 4)}px` }}
                  transition={{ type: "spring", stiffness: 100, damping: 15, delay: idx * 0.05 }}
                  className={`w-4 md:w-5 rounded-t-full relative transition-all duration-300 ${
                    day.completed
                      ? "bg-gradient-to-t from-indigo-600 via-purple-600 to-pink-500 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                      : "bg-white/10 group-hover:bg-white/20"
                  }`}
                />

                {isHovered && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="absolute bottom-[105%] bg-slate-950/90 backdrop-blur-md border border-white/10 py-1.5 px-2.5 rounded-xl z-30 shadow-xl flex flex-col items-center text-center pointer-events-none min-w-[70px]"
                  >
                    <span className="text-[9px] font-mono font-bold uppercase text-white/50">{day.label}</span>
                    <span className="text-sm font-bold text-white mt-0.5">{day.count} logged</span>
                    {day.completed && (
                      <span className="text-[8px] text-pink-400 font-semibold mt-0.5 uppercase tracking-wide">
                        Completed
                      </span>
                    )}
                  </motion.div>
                )}
              </div>

              <span className={`text-[10px] font-mono mt-3 transition-colors duration-200 ${isHovered ? 'text-white font-bold' : 'text-white/40'}`}>
                {day.label}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" />
          <div>
            <div className="text-xs text-white/50 font-mono">HIGHEST LOG</div>
            <div className="text-sm font-bold text-white">{maxCount} thoughts</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
          <div>
            <div className="text-xs text-white/50 font-mono">TOTAL LOGGED</div>
            <div className="text-sm font-bold text-white">{totalCounts} thoughts</div>
          </div>
        </div>
      </div>
    </div>
  );
}
