import React, { useEffect, useMemo, useState } from 'react';

interface NotesMap {
  [date: string]: string;
}

function getLocalDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const STORAGE_KEY = 'thought-notes';

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<NotesMap>({});
  const [selectedDate, setSelectedDate] = useState<string>(getLocalDateString(new Date()));
  const [text, setText] = useState('');
  const [isPreview, setIsPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setNotes(JSON.parse(raw));
      } catch {
        setNotes({});
      }
    }
  }, []);

  useEffect(() => {
    setText(notes[selectedDate] || '');
    setDirty(false);
  }, [selectedDate, notes]);

  // auto-save debounce
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      const copy = { ...notes, [selectedDate]: text };
      if (!text) delete copy[selectedDate];
      setNotes(copy);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
      setDirty(false);
    }, 1200);
    return () => clearTimeout(t);
  }, [dirty, text, selectedDate, notes]);

  const daysList = useMemo(() => {
    const list: string[] = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      list.push(getLocalDateString(d));
    }
    return list;
  }, []);

  const handleSave = () => {
    const copy = { ...notes, [selectedDate]: text };
    if (!text) delete copy[selectedDate];
    setNotes(copy);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    setDirty(false);
  };

  const handleDelete = () => {
    const copy = { ...notes };
    delete copy[selectedDate];
    setNotes(copy);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(copy));
    setText('');
    setDirty(false);
  };

  const simplePreview = (md: string) => {
    // Very small markdown-ish preview: handle headers and line breaks and bold
    let out = md
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/gim, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
    return out;
  };

  return (
    <div className="flex-1 overflow-y-auto h-full bg-[#050505] px-6 py-6 md:px-12 md:py-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-light">Notes</h2>
            <div className="flex items-center gap-2">
              <div className="text-sm text-white/40">{selectedDate}</div>
              <button
                onClick={() => setSelectedDate(getLocalDateString(new Date()))}
                className="px-3 py-2 bg-white/[0.04] rounded-lg text-sm"
              >
                Today
              </button>
              <button
                onClick={() => setIsPreview(p => !p)}
                className="px-3 py-2 bg-white/[0.04] rounded-lg text-sm"
              >
                {isPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>

          <div className="bg-[#0A0A0A] border border-white/6 rounded-2xl p-4 min-h-[360px]">
            {isPreview ? (
              <div className="prose text-white" dangerouslySetInnerHTML={{ __html: simplePreview(text) }} />
            ) : (
              <textarea
                value={text}
                onChange={(e) => { setText(e.target.value); setDirty(true); }}
                className="w-full h-[60vh] bg-transparent resize-none outline-none text-white text-sm font-mono placeholder-white/30"
                placeholder="Write your personal note here..."
              />
            )}

            <div className="flex gap-3 mt-4">
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-600 to-pink-500 text-white text-sm">Save</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-lg bg-white/[0.02] text-sm">Delete</button>
              <button
                onClick={() => { navigator.clipboard?.writeText(text); }}
                className="px-4 py-2 rounded-lg bg-white/[0.02] text-sm"
              >Copy</button>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="bg-[#0A0A0A] border border-white/6 rounded-2xl p-4 h-full">
            <h3 className="text-sm font-mono text-white/40 uppercase mb-3">History</h3>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {daysList.map(d => {
                const content = notes[d] || '';
                return (
                  <button key={d} onClick={() => setSelectedDate(d)} className="w-full text-left p-2 rounded-lg hover:bg-white/[0.02]">
                    <div className="flex justify-between items-center">
                      <div className="text-sm font-mono text-white/60">{d}</div>
                      <div className="text-xs text-white/40">{content ? content.slice(0, 60) : '—'}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};
