import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface LocalRecord {
  count: number;
  completed: boolean;
}

type RecordsMap = Record<string, LocalRecord>;

interface StreakCalendarProps {
  records: RecordsMap;
  onToggleDayComplete: (dateStr: string) => void;
}

export function StreakCalendar({ records, onToggleDayComplete }: StreakCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const firstDayIndex = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const daysArray: { dayNum: number | null; dateStr: string }[] = [];
  
  for (let i = 0; i < firstDayIndex; i++) {
    daysArray.push({ dayNum: null, dateStr: "" });
  }

  for (let d = 1; d <= totalDays; d++) {
    const formattedDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    daysArray.push({ dayNum: d, dateStr: formattedDate });
  }

  const weeks: { dayNum: number | null; dateStr: string }[][] = [];
  let currentWeek: { dayNum: number | null; dateStr: string }[] = [];

  daysArray.forEach((item, index) => {
    currentWeek.push(item);
    if (currentWeek.length === 7 || index === daysArray.length - 1) {
      while (currentWeek.length < 7) {
        currentWeek.push({ dayNum: null, dateStr: "" });
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  const getDayStatus = (dateStr: string) => {
    if (!dateStr) return { completed: false };
    const rec = records[dateStr];
    return {
      completed: Boolean(rec?.completed),
    };
  };

  const getStreakType = (weekIdx: number, dayInWeekIdx: number, dateStr: string) => {
    if (!dateStr) return 'none';
    const currentStatus = getDayStatus(dateStr);
    if (!currentStatus.completed) return 'none';

    const prevDayStr = weeks[weekIdx][dayInWeekIdx - 1]?.dateStr;
    const nextDayStr = weeks[weekIdx][dayInWeekIdx + 1]?.dateStr;

    const hasPrev = prevDayStr ? getDayStatus(prevDayStr).completed : false;
    const hasNext = nextDayStr ? getDayStatus(nextDayStr).completed : false;

    if (hasPrev && hasNext) return 'middle';
    if (hasPrev && !hasNext) return 'end';
    if (!hasPrev && hasNext) return 'start';
    return 'standalone';
  };

  const todayStr = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;

  return (
    <div className="bg-[#14171d] border border-white/[0.07] rounded-2xl p-6 relative">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold text-base text-white">
          {monthNames[month]} {year}
        </h3>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            aria-label="Previous month"
            className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextMonth}
            aria-label="Next month"
            className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-stone-400 hover:text-white hover:bg-white/[0.04] transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-y-2 gap-x-1 text-center relative">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-xs font-medium text-stone-500 pb-2">
            {day}
          </div>
        ))}

        {weeks.map((week, wIdx) => {
          return (
            <div key={wIdx} className="col-span-7 grid grid-cols-7 gap-x-1 relative h-9 items-center">
              {week.map((item, dIdx) => {
                const { dayNum, dateStr } = item;
                if (!dayNum) return <div key={dIdx} className="h-9" />;

                const status = getDayStatus(dateStr);
                const streakType = getStreakType(wIdx, dIdx, dateStr);
                const isToday = dateStr === todayStr;

                return (
                  <div
                    key={dIdx}
                    className="relative h-9 flex items-center justify-center cursor-pointer select-none"
                    onClick={() => onToggleDayComplete(dateStr)}
                  >
                    {/* Continuous streak connector */}
                    {streakType === 'start' && (
                      <div className="absolute left-1 right-0 h-8 bg-emerald-950/80 border-y border-l border-emerald-500/40 rounded-l-lg z-0" style={{ right: '-4px' }} />
                    )}
                    {streakType === 'middle' && (
                      <div className="absolute left-0 right-0 h-8 bg-emerald-950/80 border-y border-emerald-500/40 z-0" style={{ left: '-4px', right: '-4px' }} />
                    )}
                    {streakType === 'end' && (
                      <div className="absolute left-0 right-1 h-8 bg-emerald-950/80 border-y border-r border-emerald-500/40 rounded-r-lg z-0" style={{ left: '-4px' }} />
                    )}
                    {streakType === 'standalone' && (
                      <div className="absolute w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 z-0" />
                    )}

                    {/* Today indicator if not completed */}
                    {isToday && streakType === 'none' && (
                      <div className="absolute w-8 h-8 rounded-lg border border-white/30 z-0" />
                    )}

                    <span
                      className={`relative z-10 text-xs font-mono tabular-nums ${
                        status.completed
                          ? "text-emerald-300 font-semibold"
                          : isToday
                          ? "text-white font-semibold"
                          : "text-stone-400 hover:text-white"
                      }`}
                    >
                      {dayNum}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-white/[0.05] flex items-center justify-between text-xs text-stone-400">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-emerald-500 rounded" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 border border-white/30 rounded" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-stone-500">Tap date to edit</span>
        </div>
      </div>
    </div>
  );
}
