import { motion } from 'motion/react';
import { Sparkles, Calendar, TrendingUp, Flame, Trophy, Activity, Info } from 'lucide-react';
import { StreakCalendar } from './StreakCalendar';
import { ComparisonGraph } from './ComparisonGraph';

interface LocalRecord {
  count: number;
  completed: boolean;
}

type RecordsMap = Record<string, LocalRecord>;

interface DayData {
  label: string;
  count: number;
  completed: boolean;
}

interface InsightsPageProps {
  records: RecordsMap;
  daysList: { dateStr: string; label: string; count: number; completed: boolean }[];
  onToggleDayComplete: (dateStr: string) => void;
  onNavigateToCounter: () => void;
}

export function InsightsPage({
  records,
  daysList,
  onToggleDayComplete,
  onNavigateToCounter
}: InsightsPageProps) {
  const reversedDaysList = [...daysList].reverse();

  const graphData = reversedDaysList.map((d) => ({
    label: d.label,
    count: d.count,
    completed: d.completed,
  }));

  const activeStreak = (() => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayNum = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayNum}`;

      const rec = records[dateStr];
      if (rec?.completed) {
        streak++;
      } else if (i === 0) {
        continue;
      } else {
        break;
      }
    }
    return streak;
  })();

  const totalCompleted = Object.values(records).filter((r) => r.completed).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 pt-6 pb-28 bg-[#050505]">
      <div className="space-y-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-3xl font-light tracking-tight text-[#F5F5F5]">
              Cognitive Insights
            </h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-400">
              Streak & Analysis Systems
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onNavigateToCounter}
            className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-[#0A0A0A] hover:bg-white/[0.04] cursor-pointer"
          >
            <Activity className="w-4 h-4 text-pink-500 animate-pulse" />
          </motion.button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex items-center gap-4">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/15">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold font-sans tracking-tight">{activeStreak} Days</div>
              <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">
                Current Streak
              </div>
            </div>
          </div>

          <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex items-center gap-4">
            <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/15">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xl font-bold font-sans tracking-tight">{totalCompleted} Total</div>
              <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">
                Check-ins
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest px-1">
            Streak Calendar
          </h3>
          <StreakCalendar records={records} onToggleDayComplete={onToggleDayComplete} />
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-mono text-white/40 uppercase tracking-widest px-1">
            Comparison & Velocity
          </h3>
          <ComparisonGraph data={graphData} />
        </div>

        <div className="bg-white/[0.01] border border-white/5 rounded-3xl p-5 flex gap-3 items-start">
          <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed text-white/40 font-sans">
            Your streak indicator maps consecutive check-ins. Stanadalone completed days are highlighted in blue droplets, while streaks are wrapped in an energetic orange gradient pill. Keep up the high concentration flow!
          </p>
        </div>
      </div>
    </div>
  );
}
