import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, HelpCircle } from 'lucide-react';

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
    if (!dateStr) return { completed: false, count: 0 };
    const rec = records[dateStr];
    return {
      completed: rec?.completed || false,
      count: rec?.count || 0
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
    <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handlePrevMonth}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
        </motion.button>

        <h3 className="font-sans font-medium text-base tracking-wider text-[#F5F5F5]">
          {monthNames[month]} {year}
        </h3>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={handleNextMonth}
          className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:border-white/20 transition-all cursor-pointer"
        >
          <ChevronRight className="w-4 h-4" />
        </motion.button>
      </div>

      <div className="grid grid-cols-7 gap-y-3.5 gap-x-1 text-center relative">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div key={day} className="text-[11px] font-mono font-medium text-white/30 uppercase tracking-widest pb-2">
            {day}
          </div>
        ))}

        {weeks.map((week, wIdx) => {
          return (
            <div key={wIdx} className="col-span-7 grid grid-cols-7 gap-x-1 relative h-10 items-center">
              {week.map((item, dIdx) => {
                const { dayNum, dateStr } = item;
                if (!dayNum) return <div key={dIdx} className="h-10" />;

                const status = getDayStatus(dateStr);
                const streakType = getStreakType(wIdx, dIdx, dateStr);
                const isToday = dateStr === todayStr;

                let cellBgClass = "";
                let cellTextClass = "text-[#F5F5F5]/40 hover:text-white/80";

                if (status.count > 0 && !status.completed) {
                  cellTextClass = "text-amber-500 font-bold";
                }

                if (isToday) {
                  cellBgClass = "bg-white/10 border border-white/20 rounded-full w-9 h-9 mx-auto flex items-center justify-center";
                  cellTextClass = "text-white font-bold";
                }

                return (
                  <div
                    key={dIdx}
                    className="relative h-10 flex items-center justify-center cursor-pointer select-none"
                    onClick={() => onToggleDayComplete(dateStr)}
                  >
                    {streakType === 'start' && (
                      <div className="absolute left-0 right-0 h-9 bg-gradient-to-r from-orange-500 to-amber-500 rounded-l-full border-t border-b border-l border-amber-400 z-10" style={{ right: '-4px' }}>
                        <div className="absolute top-1 left-2.5 w-1 h-1 bg-white/40 rotate-45" />
                      </div>
                    )}
                    {streakType === 'middle' && (
                      <div className="absolute left-0 right-0 h-9 bg-gradient-to-r from-orange-500 to-amber-500 border-t border-b border-amber-400 z-10" style={{ left: '-4px', right: '-4px' }} />
                    )}
                    {streakType === 'end' && (
                      <div className="absolute left-0 right-0 h-9 bg-gradient-to-r from-orange-500 to-amber-500 rounded-r-full border-t border-b border-r border-amber-400 z-10" style={{ left: '-4px' }}>
                        <div className="absolute bottom-1 right-2.5 w-1 h-1 bg-white/40 rotate-45" />
                      </div>
                    )}

                    {streakType === 'standalone' && (
                      <div className="absolute z-20 flex flex-col items-center justify-center">
                        <svg viewBox="0 0 36 42" className="w-9 h-11 text-[#38bdf8] fill-current drop-shadow-[0_4px_10px_rgba(56,189,248,0.35)] animate-[bounce_2s_infinite]">
                          <path d="M18 0C8.06 0 0 8.06 0 18c0 10 18 24 18 24s18-14 18-24C36 8.06 27.94 0 18 0z" />
                        </svg>
                        <span className="absolute text-slate-950 font-bold text-xs font-sans top-2.5">
                          {dayNum}
                        </span>
                      </div>
                    )}

                    {streakType !== 'standalone' && (
                      <span className={`relative z-20 text-xs font-medium ${streakType !== 'none' ? 'text-slate-950 font-bold' : cellTextClass} ${isToday && streakType === 'none' ? cellBgClass : ''}`}>
                        {streakType === 'none' && isToday ? (
                          <span className="flex items-center justify-center w-full h-full">{dayNum}</span>
                        ) : (
                          dayNum
                        )}
                      </span>
                    )}

                    {status.count > 0 && streakType === 'none' && !isToday && (
                      <span className="absolute bottom-1.5 w-1 h-1 rounded-full bg-amber-500" />
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/40">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-gradient-to-r from-orange-500 to-amber-500 border border-amber-400 rounded-full" />
          <span>Active Streak</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-sky-400 rounded-full" />
          <span>Completed Days</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
          <span>Thoughts Logged</span>
        </div>
      </div>
    </div>
  );
}
