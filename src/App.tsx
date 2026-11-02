import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Grid, Calendar, Flame, Settings, Loader2, AlertCircle, Lock, Menu, X, Check } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
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

  // PIN protection for settings
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isSettingNewPin, setIsSettingNewPin] = useState(false);

  const savedPin = localStorage.getItem("thought-tracker-pin");

  const handleSettingsAttempt = () => {
    setMobileMenuOpen(false);
    if (!savedPin) {
      setIsSettingNewPin(true);
      setPinInput("");
      setPinError(false);
      setIsPinModalOpen(true);
    } else {
      setIsSettingNewPin(false);
      setPinInput("");
      setPinError(false);
      setIsPinModalOpen(true);
    }
  };

  const handlePinSubmit = () => {
    if (isSettingNewPin) {
      if (pinInput.length === 4) {
        localStorage.setItem("thought-tracker-pin", pinInput);
        setIsPinModalOpen(false);
        setPinInput("");
        setIsSettingsOpen(true);
      } else {
        setPinError(true);
      }
    } else {
      if (pinInput === savedPin) {
        setIsPinModalOpen(false);
        setPinInput("");
        setIsSettingsOpen(true);
      } else {
        setPinError(true);
        setPinInput("");
      }
    }
  };

  // Sync API helpers
  const fetchGistData = async (pat: string, id: string): Promise<RecordsMap> => {
    const res = await fetch(`https://api.github.com/gists/${id}`, {
      headers: {
        'Authorization': `token ${pat}`,
        'Accept': 'application/vnd.github.v3+json',
      }
    });
    if (!res.ok) {
      if (res.status === 401) throw new Error("Invalid GitHub Token");
      if (res.status === 404) throw new Error("Gist not found");
      throw new Error(`Sync error (${res.status})`);
    }
    const gist = await res.json();
    const fileName = "thought-tracker-records.json";
    const file = gist.files[fileName];
    if (!file) return {};
    try {
      return JSON.parse(file.content);
    } catch {
      throw new Error("Invalid JSON in Gist");
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
      throw new Error(`Failed to save to Gist (${res.status})`);
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
        updateGistData(pat, id, merged).catch(console.error);
        return merged;
      });
      setSyncStatus('synced');
    } catch (err: any) {
      setSyncStatus('error');
      setSyncErrorMessage(err.message || "Failed to sync");
    }
  };

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
        updateGistData(pat, id, merged).catch(console.error);
      }).catch((err) => {
        setSyncStatus('error');
        setSyncErrorMessage(err.message || "Failed to sync");
      });
    }
  }, []);

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
          setSyncErrorMessage(err.message || "Failed to save");
        });
    }, 2000);
    return () => clearTimeout(timeout);
  }, [pendingSyncData, gitPat, gistId]);

  const toggleToday = () => {
    const todayStr = getLocalDateString(new Date());
    toggleDayComplete(todayStr);
  };

  const toggleDayComplete = (dateStr: string) => {
    setRecords((prev) => {
      const copy = { ...prev };
      const current = copy[dateStr] || { count: 0, completed: false };
      const nextCompleted = !current.completed;
      copy[dateStr] = {
        count: nextCompleted ? 1 : 0,
        completed: nextCompleted,
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
        count: rec.completed ? 1 : 0,
        completed: rec.completed,
      });
    }

    return list;
  };

  const daysList = getDaysList();
  const todayStr = getLocalDateString(new Date());
  const isTodayCompleted = Boolean(records[todayStr]?.completed);
  const totalCompletedDays = daysList.filter((d) => d.completed).length;

  const activeStreak = (() => {
    let streak = 0;
    const today = new Date();
    
    for (let i = 0; i < 60; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = getLocalDateString(d);

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

  const totalRegisteredAllTime = (Object.values(records) as LocalRecord[]).filter((r) => r.completed).length;

  return (
    <div className="bg-[#0c0e12] min-h-screen text-[#f3f4f6] flex flex-col md:flex-row font-sans select-none overflow-hidden relative">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 bg-[#121419] border-r border-white/[0.07] h-screen p-5 shrink-0 z-40 justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-3 px-1 py-1">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white">Daily Tracker</h1>
              <span className="text-[11px] text-stone-400 block">Single-tap habits</span>
            </div>
          </div>

          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab('counter')}
              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                activeTab === 'counter'
                  ? "text-white bg-white/[0.07] border border-white/[0.08]"
                  : "text-stone-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Today Check-in</span>
            </button>
            <button
              onClick={() => setActiveTab('grid')}
              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                activeTab === 'grid'
                  ? "text-white bg-white/[0.07] border border-white/[0.08]"
                  : "text-stone-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <Grid className="w-4 h-4 text-stone-400" />
              <span>Weekly Bento</span>
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`w-full flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer text-xs font-medium transition-colors ${
                activeTab === 'insights'
                  ? "text-white bg-white/[0.07] border border-white/[0.08]"
                  : "text-stone-400 hover:text-white hover:bg-white/[0.03]"
              }`}
            >
              <Calendar className="w-4 h-4 text-stone-400" />
              <span>History & Streaks</span>
            </button>
            <button
              onClick={handleSettingsAttempt}
              className="w-full flex items-center gap-3 py-2.5 px-3 rounded-xl cursor-pointer text-xs font-medium text-stone-400 hover:text-white hover:bg-white/[0.03] transition-colors"
            >
              <Settings className="w-4 h-4 text-stone-400" />
              <span>Cloud Sync</span>
            </button>
          </nav>
        </div>

        {/* Sidebar Footer Widget */}
        <div className="space-y-3 pt-4 border-t border-white/[0.06]">
          <div className="bg-[#181b22] border border-white/[0.06] rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-400">Today</span>
              <span className={isTodayCompleted ? "text-emerald-400 font-medium" : "text-stone-400"}>
                {isTodayCompleted ? "Done" : "Pending"}
              </span>
            </div>
            <button
              onClick={toggleToday}
              className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center justify-center gap-1.5 ${
                isTodayCompleted
                  ? "bg-white/[0.04] text-stone-300 hover:text-white hover:bg-white/[0.08]"
                  : "bg-emerald-500 hover:bg-emerald-400 text-white font-semibold"
              }`}
            >
              {isTodayCompleted ? "Undo check-in" : "Mark as done"}
            </button>
          </div>
          
          <div className="flex items-center justify-between text-xs text-stone-500 px-1">
            <span>Sync</span>
            <span className="flex items-center gap-1.5">
              {syncStatus === 'synced' && <span className="text-emerald-400">Up to date</span>}
              {syncStatus === 'syncing' && <span className="text-stone-400">Syncing...</span>}
              {syncStatus === 'error' && <span className="text-rose-400">Sync error</span>}
              {syncStatus === 'idle' && <span className="text-stone-400">Connected</span>}
              {syncStatus === 'unconfigured' && <span className="text-stone-500">Local storage</span>}
            </span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-hidden flex flex-col relative bg-[#0c0e12]">
        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07] bg-[#121419] z-30">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h1 className="text-sm font-semibold text-white">Daily Tracker</h1>
          </div>
          <button
            onClick={handleSettingsAttempt}
            aria-label="Settings"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-white"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Views */}
        <div className="flex-1 overflow-hidden flex flex-col relative pb-16 md:pb-0">
          <AnimatePresence mode="wait">
            {activeTab === 'counter' ? (
              <motion.div
                key="counter"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col h-full"
              >
                <CounterPage
                  isCompleted={isTodayCompleted}
                  streak={activeStreak}
                  totalCompleted={totalRegisteredAllTime}
                  onToggleToday={toggleToday}
                  onNavigateToGrid={() => setActiveTab('grid')}
                />
              </motion.div>
            ) : activeTab === 'grid' ? (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex-1 flex flex-col h-full overflow-y-auto px-6 py-6 md:px-12 md:py-10 pb-28 md:pb-12 bg-[#0c0e12]"
              >
                <div className="space-y-6 mb-6">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-white">
                        Weekly Overview
                      </h2>
                      <p className="text-xs text-stone-400">
                        Check-in distribution across the last 7 days
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div className="bg-[#14171d] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3.5 col-span-2">
                      <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400 border border-amber-500/20">
                        <Flame className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
                          {activeStreak} {activeStreak === 1 ? "day" : "days"}
                        </div>
                        <div className="text-xs text-stone-400 font-medium">
                          Active streak
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#14171d] border border-white/[0.07] rounded-2xl p-4 flex items-center gap-3.5 col-span-2">
                      <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xl font-bold font-mono tracking-tight text-white tabular-nums">
                          {totalCompletedDays} of 7 days
                        </div>
                        <div className="text-xs text-stone-400 font-medium">
                          Weekly completion
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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
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

        {/* Mobile Fixed Bottom Navigation Bar (Apple HIG 3-tab anchor) */}
        <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-[#121419]/95 backdrop-blur-md border-t border-white/[0.08] h-16 grid grid-cols-3 items-center">
          <button
            onClick={() => setActiveTab('counter')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
              activeTab === 'counter' ? "text-emerald-400" : "text-stone-400 hover:text-white"
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Today</span>
          </button>

          <button
            onClick={() => setActiveTab('grid')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
              activeTab === 'grid' ? "text-emerald-400" : "text-stone-400 hover:text-white"
            }`}
          >
            <Grid className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">Weekly</span>
          </button>

          <button
            onClick={() => setActiveTab('insights')}
            className={`flex flex-col items-center justify-center h-full min-h-[44px] cursor-pointer transition-colors ${
              activeTab === 'insights' ? "text-emerald-400" : "text-stone-400 hover:text-white"
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] font-medium mt-1">History</span>
          </button>
        </nav>
      </main>

      {/* Sync Settings Modal */}
      <AnimatePresence>
        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSettingsOpen(false)}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="bg-[#14171d] border border-white/[0.1] rounded-2xl p-6 w-full max-w-md relative z-10 shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex justify-between items-center mb-5">
                <div>
                  <h3 className="text-lg font-semibold text-white">
                    Cloud Sync
                  </h3>
                  <span className="text-xs text-stone-400">
                    GitHub Gist backup
                  </span>
                </div>
                <button
                  onClick={() => setIsSettingsOpen(false)}
                  className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-stone-400 hover:text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 overflow-y-auto flex-1 pr-1 pb-2">
                <div className="bg-[#101217] border border-white/[0.06] rounded-xl p-3.5 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-400 block text-[11px]">Status</span>
                    <span className="font-medium text-white mt-0.5 block">
                      {syncStatus === 'synced' && "Connected & Synced"}
                      {syncStatus === 'syncing' && "Syncing..."}
                      {syncStatus === 'error' && "Sync Error"}
                      {syncStatus === 'idle' && "Ready to sync"}
                      {syncStatus === 'unconfigured' && "Not configured"}
                    </span>
                  </div>

                  {syncStatus !== 'unconfigured' && (
                    <button
                      onClick={async () => {
                        await triggerSyncPull();
                      }}
                      disabled={syncStatus === 'syncing'}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-xs font-medium text-emerald-400 disabled:opacity-50 cursor-pointer"
                    >
                      Sync Now
                    </button>
                  )}
                </div>

                {syncErrorMessage && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs p-3 rounded-xl">
                    {syncErrorMessage}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-stone-400 block mb-1.5">
                      GitHub Token (PAT)
                    </label>
                    <input
                      type="password"
                      value={gitPat}
                      onChange={(e) => setGitPat(e.target.value)}
                      placeholder="ghp_..."
                      className="w-full bg-[#101217] border border-white/[0.08] rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-stone-400 block mb-1.5">
                      Gist ID
                    </label>
                    <input
                      type="text"
                      value={gistId}
                      onChange={(e) => setGistId(e.target.value)}
                      placeholder="Gist ID"
                      className="w-full bg-[#101217] border border-white/[0.08] rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-stone-600 focus:outline-none focus:border-emerald-500/50 font-mono"
                    />
                  </div>
                </div>

                <div className="bg-[#101217] border border-white/[0.05] rounded-xl p-3.5 space-y-1.5 text-xs text-stone-400">
                  <span className="text-white font-medium block">Setup Instructions</span>
                  <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-relaxed">
                    <li>Generate a GitHub token with the <strong>gist</strong> scope.</li>
                    <li>Create a Secret Gist on gist.github.com named <strong>thought-tracker-records.json</strong> with <code>&#123;&#125;</code> inside.</li>
                    <li>Copy your token and Gist ID here and click Save & Sync.</li>
                  </ol>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06] flex gap-2.5 mt-3">
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
                  className="flex-1 py-2.5 border border-white/[0.08] rounded-xl bg-transparent hover:bg-white/[0.04] text-xs font-medium text-stone-400 hover:text-white transition-colors cursor-pointer"
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
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Save & Sync
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PIN Entry Modal */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => { setIsPinModalOpen(false); setPinInput(""); setPinError(false); }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#14171d] border border-white/[0.1] rounded-2xl p-6 w-full max-w-xs relative z-10 shadow-2xl flex flex-col items-center"
            >
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 text-emerald-400">
                <Lock className="w-5 h-5" />
              </div>

              <h3 className="text-base font-semibold text-white mb-1">
                {isSettingNewPin ? "Create PIN" : "Enter PIN"}
              </h3>
              <p className="text-xs text-stone-400 mb-5 text-center">
                {isSettingNewPin ? "Set a 4-digit PIN for settings." : "Enter your 4-digit PIN."}
              </p>

              {/* PIN Dots */}
              <div className="flex gap-2.5 mb-5">
                {[0, 1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className={`w-3.5 h-3.5 rounded-full border transition-colors ${
                      pinInput.length > i
                        ? pinError ? "bg-rose-500 border-rose-500" : "bg-emerald-400 border-emerald-400"
                        : "border-white/20 bg-transparent"
                    }`}
                  />
                ))}
              </div>

              {pinError && (
                <p className="text-rose-400 text-xs mb-3">
                  {isSettingNewPin ? "PIN must be 4 digits" : "Incorrect PIN"}
                </p>
              )}

              {/* Numpad */}
              <div className="grid grid-cols-3 gap-2 w-full max-w-[210px]">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => { if (pinInput.length < 4) { setPinError(false); setPinInput(prev => prev + String(num)); } }}
                    className="h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-95 text-white text-base font-medium transition-all cursor-pointer"
                  >
                    {num}
                  </button>
                ))}
                <button
                  onClick={() => setPinInput(prev => prev.slice(0, -1))}
                  className="h-12 rounded-xl bg-white/[0.02] hover:bg-white/[0.06] text-stone-400 text-xs font-medium cursor-pointer"
                >
                  DEL
                </button>
                <button
                  onClick={() => { if (pinInput.length < 4) { setPinError(false); setPinInput(prev => prev + "0"); } }}
                  className="h-12 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-white text-base font-medium cursor-pointer"
                >
                  0
                </button>
                <button
                  onClick={handlePinSubmit}
                  className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white text-xs font-semibold cursor-pointer"
                >
                  OK
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
