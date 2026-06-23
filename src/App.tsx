import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Grid, Wifi, Battery, Signal, Flame, Trophy, Sparkles } from 'lucide-react';
import { CounterPage } from './components/CounterPage';
import { BentoGrid, DayRecord } from './components/BentoGrid';

interface LocalRecord {
  count: number;
  completed: boolean;
}

type RecordsMap = Record<string, LocalRecord>;

function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'counter' | 'grid'>('counter');
  const [records, setRecords] = useState<RecordsMap>({});
  const [timeString, setTimeString] = useState('12:00');

  useEffect(() => {
    const handleResize = () => {};
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem("thought-tracker-records");
    if (raw) {
      try {
        setRecords(JSON.parse(raw));
      } catch {
        setRecords({});
      }
    } else {
      setRecords({});
    }
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let hh = String(now.getHours() % 12 || 12);
      let mm = String(now.getMinutes()).padStart(2, '0');
      setTimeString(`${hh}:${mm}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const incrementTodayCount = () => {
    const todayStr = getLocalDateString(new Date());
    setRecords((prev) => {
      const copy = { ...prev };
      const current = copy[todayStr] || { count: 0, completed: false };
      copy[todayStr] = {
        ...current,
        count: current.count + 1,
      };
      localStorage.setItem("thought-tracker-records", JSON.stringify(copy));
      return copy;
    });
  };

  const toggleDayComplete = (dateStr: string) => {
    setRecords((prev) => {
      const copy = { ...prev };
      const current = copy[dateStr] || { count: 0, completed: false };
      copy[dateStr] = {
        ...current,
        completed: !current.completed,
      };
      localStorage.setItem("thought-tracker-records", JSON.stringify(copy));
      return copy;
    });
  };

  const getDaysList = (): DayRecord[] => {
    const list: DayRecord[] = [];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);

      let label = "";
      let fullLabel = "";

      if (i === 0) {
        label = "Today";
        fullLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      } else if (i === 1) {
        label = "Yesterday";
        fullLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      } else {
        label = d.toLocaleDateString('en-US', { weekday: 'short' });
        fullLabel = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      }

      const rec = records[dateStr] || { count: 0, completed: false };

      list.push({
        dateStr,
        label,
        fullLabel,
        count: rec.count,
        completed: rec.completed,
      });
    }

    return list;
  };

  const daysList = getDaysList();
  const currentTodayCount = records[getLocalDateString(new Date())]?.count || 0;
  const totalWeeklyThoughts = daysList.reduce((acc, d) => acc + d.count, 0);
  const totalCompletedDays = daysList.filter((d) => d.completed).length;

  return (
    <div className="bg-[#050505] min-h-screen text-[#F5F5F5] flex flex-col items-center justify-center p-0 md:p-6 font-sans select-none overflow-hidden relative selection:bg-indigo-500/30">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md h-screen md:h-[840px] md:rounded-[40px] md:border-8 md:border-[#1A1A1A] bg-[#050505] md:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.91),0_0_100px_-20px_rgba(99,102,241,0.06)] overflow-hidden relative flex flex-col">
        <div className="h-12 bg-[#050505]/60 backdrop-blur-md px-6 flex items-center justify-between z-50 text-[10px] border-b border-white/5 font-mono">
          <span className="font-semibold text-[#F5F5F5] tracking-wider">
            {timeString}
          </span>
          <div className="flex items-center gap-1.5 text-white/55">
            <Signal className="w-3 h-3" />
            <Wifi className="w-3 h-3" />
            <Battery className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex flex-col relative bg-[#050505]">
          <AnimatePresence mode="wait">
            {activeTab === 'counter' ? (
              <motion.div
                key="counter"
                initial={{ opacity: 0, x: -65 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 65 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="flex-1 flex flex-col h-full"
              >
                <CounterPage
                  count={currentTodayCount}
                  onIncrement={incrementTodayCount}
                  onNavigateToGrid={() => setActiveTab('grid')}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0, x: 65 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -65 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="flex-1 flex flex-col h-full overflow-y-auto px-6 pt-6 pb-24 bg-[#0A0A0A]"
              >
                <div className="space-y-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-3xl font-light tracking-tight text-[#F5F5F5]">
                        Weekly Velocity
                      </h2>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-400">
                        Metrics & Distribution
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('counter')}
                      className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-[#050505] hover:bg-white/[0.04]"
                    >
                      <div className="w-2 h-2 bg-pink-500 rounded-full" />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex items-center gap-4">
                      <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/15">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xl font-bold font-sans tracking-tight">{totalWeeklyThoughts}</div>
                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">
                          Frequency
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex items-center gap-4">
                      <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/15">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xl font-bold font-sans tracking-tight">{totalCompletedDays}/7</div>
                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">
                          Distribution
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <BentoGrid days={daysList} onToggleComplete={toggleDayComplete} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="absolute bottom-6 left-6 right-6 z-40 bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-2xl py-2 px-6 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <button
            onClick={() => setActiveTab('counter')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl relative ${
              activeTab === 'counter' ? "text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {activeTab === 'counter' && (
              <motion.div
                layoutId="navPill"
                className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-xl"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <Brain className="w-4 h-4 relative z-10" />
            <span className="text-[8px] uppercase font-mono tracking-[0.2em] font-bold relative z-10">
              Counter
            </span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`flex flex-col items-center gap-1.5 py-1 px-3.5 rounded-xl relative ${
              activeTab === 'grid' ? "text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {activeTab === 'grid' && (
              <motion.div
                layoutId="navPill"
                className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-xl"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <Grid className="w-4 h-4 relative z-10" />
            <span className="text-[8px] uppercase font-mono tracking-[0.2em] font-bold relative z-10">
              Weekly
            </span>
          </button>
        </div>

        <div className="h-6 bg-[#050505] flex items-center justify-center z-50">
          <div className="w-28 h-1 bg-white/10 rounded-full" />
        </div>
      </div>
    </div>
  );
}
