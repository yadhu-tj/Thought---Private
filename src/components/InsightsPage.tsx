import { motion } from 'motion/react';
import { Flame, Trophy, Info, Calendar } from 'lucide-react';
import { StreakCalendar } from './StreakCalendar';
import { ComparisonGraph } from './ComparisonGraph';

interface LocalRecord {
  count: number;
  completed: boolean;
}

type RecordsMap = Record<string, LocalRecord>;

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
    
    for (let i = 0; i < 60; i++) {
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

  const totalCompleted = (Object.values(records) as LocalRecord[]).filter((r) => r.completed).length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-6 md:px-12 md:py-10 pb-28 md:pb-12 bg-[#0c0e12]">
      <div className="space-y-6 mb-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
              History & Insights
            </h2>
            <p className="text-xs text-stone-400">
              Overview of your consistency and active habit streaks
            </p>
          </div>
          <button
            onClick={onNavigateToCounter}
            className="px-3 py-1.5 border border-white/[0.08] rounded-lg text-xs font-medium text-stone-300 hover:text-white hover:bg-white/[0.04] cursor-pointer md:hidden"
          >
            Check In
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-[#14171d] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {activeStreak} {activeStreak === 1 ? "Day" : "Days"}
              </div>
              <div className="text-xs text-stone-400 font-medium">
                Active Streak
              </div>
            </div>
          </div>

          <div className="bg-[#14171d] border border-white/[0.07] rounded-2xl p-5 flex items-center gap-4">
            <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-2xl font-bold font-mono tracking-tight text-white tabular-nums">
                {totalCompleted}
              </div>
              <div className="text-xs text-stone-400 font-medium">
                Total Check-ins
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-stone-400 px-1">
              Monthly Calendar
            </h3>
            <StreakCalendar records={records} onToggleDayComplete={onToggleDayComplete} />
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-medium text-stone-400 px-1">
              Weekly Consistency
            </h3>
            <ComparisonGraph data={graphData} />
          </div>
        </div>

        <div className="bg-[#14171d] border border-white/[0.06] rounded-2xl p-4 flex gap-3 items-start">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-stone-400">
            Streaks represent consecutive completed days. Tap any date on the calendar to mark or unmark it retroactively if you forgot to check in.
          </p>
        </div>
      </div>
    </div>
  );
}
