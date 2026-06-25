import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Grid, Calendar, Flame, Trophy, Sparkles, Settings, Loader2, AlertCircle } from 'lucide-react';
import { CounterPage } from './components/CounterPage';
import { BentoGrid, DayRecord } from './components/BentoGrid';
import { InsightsPage } from './components/InsightsPage';

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
  const [activeTab, setActiveTab] = useState<'counter' | 'grid' | 'insights'>('counter');
  const [records, setRecords] = useState<RecordsMap>({});
  
  // Gist synchronization states
  const [gitPat, setGitPat] = useState(() => localStorage.getItem("thought-tracker-git-pat") || "");
  const [gistId, setGistId] = useState(() => localStorage.getItem("thought-tracker-gist-id") || "");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error' | 'unconfigured'>(() => {
    const pat = localStorage.getItem("thought-tracker-git-pat");
    const id = localStorage.getItem("thought-tracker-gist-id");
    return (pat && id) ? 'idle' : 'unconfigured';
  });
  const [syncErrorMessage, setSyncErrorMessage] = useState("");
  const [pendingSyncData, setPendingSyncData] = useState<RecordsMap | null>(null);

  // Sync API helpers
  const fetchGistData = async (pat: string, id: string): Promise<RecordsMap> => {
    const res = await fetch(`https://api.github.com/gists/${id}`, {
      headers: {
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Invalid GitHub Token (Unauthorized)");
      if (res.status === 404) throw new Error("Gist not found. Check the Gist ID");
      throw new Error(`Failed to fetch Gist (${res.status})`);
    }
    const gist = await res.json();
    const fileName = "thought-tracker-records.json";
    const file = gist.files[fileName];
    if (!file) {
      return {};
    }
    try {
      return JSON.parse(file.content);
    } catch {
      throw new Error("Gist file contains invalid JSON data");
    }
  };

  const updateGistData = async (pat: string, id: string, data: RecordsMap) => {
    const fileName = "thought-tracker-records.json";
    const res = await fetch(`https://api.github.com/gists/${id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        files: {
          [fileName]: {
            content: JSON.stringify(data, null, 2)
          }
        }
      })
    });
    if (!res.ok) {
      throw new Error(`Failed to write to Gist (${res.status})`);
    }
  };

  const mergeRecords = (local: RecordsMap, remote: RecordsMap): RecordsMap => {
    const merged: RecordsMap = { ...remote };
    Object.entries(local).forEach(([date, localRec]) => {
      const remoteRec = remote[date];
      if (remoteRec) {
        merged[date] = {
          count: Math.max(localRec.count, remoteRec.count),
          completed: localRec.completed || remoteRec.completed,
        };
      } else {
        merged[date] = localRec;
      }
    });
    return merged;
  };

  const triggerSyncPull = async (pat = gitPat, id = gistId) => {
    if (!pat || !id) return;
    setSyncStatus('syncing');
    setSyncErrorMessage("");
    try {
      const remoteData = await fetchGistData(pat, id);
      setRecords((prev) => {
        const merged = mergeRecords(prev, remoteData);
        localStorage.setItem("thought-tracker-records", JSON.stringify(merged));
        
        updateGistData(pat, id, merged).catch(err => {
          console.error("Auto push on merge failed", err);
        });
        
        return merged;
      });
      setSyncStatus('synced');
    } catch (err: any) {
      setSyncStatus('error');
      setSyncErrorMessage(err.message || "Failed to sync");
    }
  };

  // Load records and trigger pull on mount
  useEffect(() => {
    const raw = localStorage.getItem("thought-tracker-records");
    let localData: RecordsMap = {};
    if (raw) {
      try {
        localData = JSON.parse(raw);
        setRecords(localData);
      } catch {
        setRecords({});
      }
    }
    
    const pat = localStorage.getItem("thought-tracker-git-pat");
    const id = localStorage.getItem("thought-tracker-gist-id");
    if (pat && id) {
      setSyncStatus('syncing');
      fetchGistData(pat, id).then((remoteData) => {
        const merged = mergeRecords(localData, remoteData);
        setRecords(merged);
        localStorage.setItem("thought-tracker-records", JSON.stringify(merged));
        setSyncStatus('synced');
        updateGistData(pat, id, merged).catch(e => console.error(e));
      }).catch((err) => {
        setSyncStatus('error');
        setSyncErrorMessage(err.message || "Failed to sync");
      });
    }
  }, []);

  // Debounced push effect on record changes
  useEffect(() => {
    if (!gitPat || !gistId || !pendingSyncData) return;
    
    const timeout = setTimeout(() => {
      setSyncStatus('syncing');
      updateGistData(gitPat, gistId, pendingSyncData)
        .then(() => {
          setSyncStatus('synced');
          setPendingSyncData(null);
        })
        .catch((err) => {
          setSyncStatus('error');
          setSyncErrorMessage(err.message || "Failed to save records");
        });
    }, 2000);

    return () => clearTimeout(timeout);
  }, [pendingSyncData, gitPat, gistId]);

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
      if (gitPat && gistId) {
        setPendingSyncData(copy);
      }
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
      if (gitPat && gistId) {
        setPendingSyncData(copy);
      }
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
    <div className="bg-[#050505] min-h-screen text-[#F5F5F5] flex flex-col md:flex-row font-sans select-none overflow-hidden relative selection:bg-indigo-500/30">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-72 bg-[#0A0A0A] border-r border-white/5 h-screen p-6 shrink-0 z-40 justify-between">
        <div className="space-y-8">
          <div className="flex items-center gap-3 px-2">
            <div className="p-2.5 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/15">
              <Brain className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Thought Tracker</h1>
              <span className="text-[9px] font-mono text-indigo-400 font-semibold tracking-widest block uppercase">V.1.0 // ACTIVE</span>
            </div>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveTab('counter')}
              className={`w-full flex items-center gap-3.5 py-3.5 px-4 rounded-2xl relative cursor-pointer text-xs uppercase tracking-wider font-mono font-semibold transition-all duration-200 ${
                activeTab === 'counter' ? "text-white bg-white/[0.04] border border-white/10 shadow-md" : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
              }`}
            >
              <Brain className="w-4 h-4 text-indigo-400" />
              <span>Counter</span>
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`w-full flex items-center gap-3.5 py-3.5 px-4 rounded-2xl relative cursor-pointer text-xs uppercase tracking-wider font-mono font-semibold transition-all duration-200 ${
                activeTab === 'grid' ? "text-white bg-white/[0.04] border border-white/10 shadow-md" : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
              }`}
            >
              <Grid className="w-4 h-4 text-pink-400" />
              <span>Weekly</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`w-full flex items-center gap-3.5 py-3.5 px-4 rounded-2xl relative cursor-pointer text-xs uppercase tracking-wider font-mono font-semibold transition-all duration-200 ${
                activeTab === 'insights' ? "text-white bg-white/[0.04] border border-white/10 shadow-md" : "text-white/40 hover:text-white/80 hover:bg-white/[0.02]"
              }`}
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Insights</span>
            </button>
            
            {/* Sync Settings Tab Button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-full flex items-center gap-3.5 py-3.5 px-4 rounded-2xl cursor-pointer text-xs uppercase tracking-wider font-mono font-semibold text-white/40 hover:text-white/80 hover:bg-white/[0.02] transition-all duration-200"
            >
              <Settings className="w-4 h-4 text-indigo-400/80" />
              <span>Sync Settings</span>
            </button>
          </nav>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono text-white/40">
              <span>TODAY'S INTENSITY</span>
              <span className="text-white font-bold">{currentTodayCount}</span>
            </div>
            <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-gradient-to-r from-indigo-500 to-pink-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${Math.min((currentTodayCount / 15) * 100, 100)}%` }}
              />
            </div>
          </div>
          
          <div className="flex items-center justify-between text-[9px] font-mono text-white/30 px-1">
            <span>System Status</span>
            <span className="flex items-center gap-1 font-semibold uppercase">
              {syncStatus === 'synced' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-emerald-500">Synced</span>
                </>
              )}
              {syncStatus === 'syncing' && (
                <>
                  <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
                  <span className="text-indigo-400">Syncing</span>
                </>
              )}
              {syncStatus === 'error' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="text-rose-500">Err</span>
                </>
              )}
              {syncStatus === 'idle' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <span className="text-amber-500">Connected</span>
                </>
              )}
              {syncStatus === 'unconfigured' && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                  <span className="text-white/40">Local</span>
                </>
              )}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative bg-[#050505]">
        {/* Mobile Settings Gear Trigger */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="md:hidden absolute top-6 right-6 z-45 w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-[#050505]/60 backdrop-blur-md hover:bg-white/[0.04] cursor-pointer text-white/50 hover:text-white transition-all shadow-lg active:scale-95 hover:scale-105"
        >
          <Settings className="w-4 h-4" />
        </button>

        <div className="flex-1 overflow-hidden flex flex-col relative">
          <AnimatePresence mode="wait">
            {activeTab === 'counter' ? (
              <motion.div
                key="counter"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="flex-1 flex flex-col h-full"
              >
                <CounterPage
                  count={currentTodayCount}
                  onIncrement={incrementTodayCount}
                  onNavigateToGrid={() => setActiveTab('grid')}
                />
              </motion.div>
            ) : activeTab === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-6 md:px-12 md:py-10 pb-28 md:pb-12 bg-[#0A0A0A]"
              >
                <div className="space-y-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-3xl md:text-4xl font-light tracking-tight text-[#F5F5F5]">
                        Weekly Velocity
                      </h2>
                      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-indigo-400">
                        Metrics & Distribution
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveTab('insights')}
                      className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-[#050505] hover:bg-white/[0.04] cursor-pointer"
                    >
                      <Calendar className="w-4 h-4 text-indigo-400" />
                    </motion.button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex items-center gap-4 col-span-2 md:col-span-2">
                      <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400 border border-indigo-500/15">
                        <Flame className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold font-sans tracking-tight">{totalWeeklyThoughts}</div>
                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">
                          Frequency
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/[0.03] border border-white/10 rounded-3xl p-5 flex items-center gap-4 col-span-2 md:col-span-2">
                      <div className="p-2.5 bg-pink-500/10 rounded-xl text-pink-400 border border-pink-500/15">
                        <Trophy className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xl md:text-2xl font-bold font-sans tracking-tight">{totalCompletedDays}/7</div>
                        <div className="text-[9px] text-white/40 font-bold uppercase tracking-widest font-mono">
                          Distribution
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <BentoGrid days={daysList} onToggleComplete={toggleDayComplete} />
              </motion.div>
            ) : (
              <motion.div
                key="insights"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ type: "spring", stiffness: 240, damping: 22 }}
                className="flex-1 flex flex-col h-full"
              >
                <InsightsPage
                  records={records}
                  daysList={daysList}
                  onToggleDayComplete={toggleDayComplete}
                  onNavigateToCounter={() => setActiveTab('counter')}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mobile Navigation Pill */}
        <div className="md:hidden absolute bottom-6 left-6 right-6 z-40 bg-[#050505]/80 backdrop-blur-xl border border-white/10 rounded-2xl py-2 px-4 flex justify-around items-center shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <button
            onClick={() => setActiveTab('counter')}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-4 rounded-xl relative cursor-pointer ${
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
            className={`flex flex-col items-center gap-1.5 py-1.5 px-4 rounded-xl relative cursor-pointer ${
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

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex flex-col items-center gap-1.5 py-1.5 px-4 rounded-xl relative cursor-pointer ${
              activeTab === 'insights' ? "text-white" : "text-white/40 hover:text-white/60"
            }`}
          >
            {activeTab === 'insights' && (
              <motion.div
                layoutId="navPill"
                className="absolute inset-0 bg-white/[0.03] border border-white/10 rounded-xl"
                transition={{ type: "spring", stiffness: 350, damping: 25 }}
              />
            )}
            <Calendar className="w-4 h-4 relative z-10" />
            <span className="text-[8px] uppercase font-mono tracking-[0.2em] font-bold relative z-10">
              Insights
            </span>
          </button>
        </div>
      </main>

      {/* Sync Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            
            {/* Modal card */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", stiffness: 350, damping: 26 }}
              className="bg-[#0D0D0D]/90 border border-white/10 rounded-[32px] p-6 w-full max-w-md relative z-10 shadow-[0_30px_70px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />

              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-light tracking-tight text-white flex items-center gap-2">
                    <Settings className="w-5 h-5 text-indigo-400" />
                    Cloud Sync
                  </h3>
                  <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest block mt-0.5">
                    GitHub Gist Integration
                  </span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center hover:bg-white/5 cursor-pointer text-white/60 hover:text-white text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-5 overflow-y-auto flex-1 pr-1 pb-4">
                {/* Status Indicator */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-mono text-white/40 uppercase tracking-wider">Sync Connection</div>
                    <div className="text-xs font-mono font-semibold flex items-center gap-1.5 mt-1">
                      {syncStatus === 'synced' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-emerald-400">Connected & Synced</span>
                        </>
                      )}
                      {syncStatus === 'syncing' && (
                        <>
                          <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                          <span className="text-indigo-400">Synchronizing...</span>
                        </>
                      )}
                      {syncStatus === 'error' && (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span className="text-rose-400">Connection Error</span>
                        </>
                      )}
                      {syncStatus === 'idle' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                          <span className="text-amber-400">Ready to Sync</span>
                        </>
                      )}
                      {syncStatus === 'unconfigured' && (
                        <>
                          <span className="w-2 h-2 rounded-full bg-white/20" />
                          <span className="text-white/40">Not Configured</span>
                        </>
                      )}
                    </div>
                  </div>

                  {syncStatus !== 'unconfigured' && (
                    <button
                      onClick={async () => {
                        await triggerSyncPull();
                      }}
                      disabled={syncStatus === 'syncing'}
                      className="px-3 py-1.5 rounded-lg border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/25 text-[10px] font-mono font-semibold text-indigo-400 disabled:opacity-40 cursor-pointer"
                    >
                      Sync Now
                    </button>
                  )}
                </div>

                {syncErrorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-mono p-3.5 rounded-xl leading-relaxed">
                    {syncErrorMessage}
                  </div>
                )}

                {/* Form Fields */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block px-1">
                      GitHub Personal Access Token (PAT)
                    </label>
                    <input
                      type="password"
                      value={gitPat}
                      onChange={(e) => setGitPat(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxx"
                      className="w-full bg-[#141414] border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 font-mono transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block px-1">
                      Gist ID
                    </label>
                    <input
                      type="text"
                      value={gistId}
                      onChange={(e) => setGistId(e.target.value)}
                      placeholder="32-character hex Gist ID"
                      className="w-full bg-[#141414] border border-white/10 rounded-2xl py-3 px-4 text-sm text-white placeholder-white/20 focus:outline-none focus:border-indigo-500/50 font-mono transition-colors"
                    />
                  </div>
                </div>

                {/* Setup Instructions */}
                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-2 text-[10px] font-sans text-white/40 leading-relaxed">
                  <span className="font-mono text-white/60 font-semibold block uppercase tracking-wider">
                    How to Set Up:
                  </span>
                  <ol className="list-decimal pl-4 space-y-1">
                    <li>Go to your GitHub Account Settings &gt; Developer settings &gt; Personal access tokens &gt; **Tokens (classic)**.</li>
                    <li>Generate a new token with the **gist** scope checkbox checked, then copy it.</li>
                    <li>Go to [gist.github.com](https://gist.github.com) and create a **Secret Gist**.</li>
                    <li>Name the file **thought-tracker-records.json** and put `{}` as the initial content.</li>
                    <li>Create the gist, then copy the **Gist ID** (the long code at the end of the gist URL).</li>
                    <li>Paste both values above and hit Save!</li>
                  </ol>
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3 mt-4">
                <button
                  onClick={() => {
                    localStorage.removeItem("thought-tracker-git-pat");
                    localStorage.removeItem("thought-tracker-gist-id");
                    setGitPat("");
                    setGistId("");
                    setSyncStatus('unconfigured');
                    setSyncErrorMessage("");
                    setIsSettingsOpen(false);
                  }}
                  className="flex-1 py-3 border border-white/10 rounded-2xl bg-transparent hover:bg-white/5 font-mono text-xs uppercase tracking-wider text-white/60 hover:text-white transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
                <button
                  onClick={() => {
                    const cleanPat = gitPat.trim();
                    const cleanId = (() => {
                      const id = gistId.trim();
                      const match = id.match(/(?:gist\.github\.com\/)(?:[a-zA-Z0-9_-]+\/)?([a-fA-F0-9]+)/i);
                      return match ? match[1] : id;
                    })();
                    setGistId(cleanId);
                    setGitPat(cleanPat);
                    localStorage.setItem("thought-tracker-git-pat", cleanPat);
                    localStorage.setItem("thought-tracker-gist-id", cleanId);
                    triggerSyncPull(cleanPat, cleanId);
                    setIsSettingsOpen(false);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-pink-500 text-white font-mono text-xs uppercase tracking-wider font-semibold transition-all hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] cursor-pointer"
                >
                  Save & Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
