
import React, { useState, useEffect } from 'react';
import { JournalEntry } from '../types';

const JournalView: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [viewState, setViewState] = useState<'list' | 'edit' | 'create'>('list');
  const [currentEntry, setCurrentEntry] = useState<Partial<JournalEntry>>({});
  
  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem('hb_journal_vault');
    if (saved) {
      try {
        setEntries(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load journal", e);
      }
    }
  }, []);

  // Save to LocalStorage
  const persistEntries = (newEntries: JournalEntry[]) => {
    setEntries(newEntries);
    localStorage.setItem('hb_journal_vault', JSON.stringify(newEntries));
  };

  const handleSave = () => {
    if (!currentEntry.title || !currentEntry.content) {
      alert("Please fill in both title and content.");
      return;
    }

    const now = new Date();
    const entryData: JournalEntry = {
      id: currentEntry.id || Date.now().toString(36),
      title: currentEntry.title,
      content: currentEntry.content,
      mood: currentEntry.mood || 'neutral',
      timestamp: currentEntry.timestamp || Date.now(),
      date: now.toLocaleDateString() + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    let newEntries;
    if (viewState === 'edit') {
      newEntries = entries.map(e => e.id === entryData.id ? entryData : e);
    } else {
      newEntries = [entryData, ...entries];
    }

    persistEntries(newEntries);
    setViewState('list');
    setCurrentEntry({});
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this entry? It cannot be recovered.")) {
      const newEntries = entries.filter(e => e.id !== id);
      persistEntries(newEntries);
    }
  };

  const startEdit = (entry: JournalEntry) => {
    setCurrentEntry(entry);
    setViewState('edit');
  };

  const startCreate = () => {
    setCurrentEntry({ mood: 'neutral' });
    setViewState('create');
  };

  const getMoodIcon = (mood?: string) => {
    switch(mood) {
      case 'lucky': return 'fa-star text-hb-gold';
      case 'tilted': return 'fa-fire text-red-500';
      default: return 'fa-pen-nib text-hb-blue';
    }
  };

  if (viewState === 'create' || viewState === 'edit') {
    return (
      <div className="p-5 min-h-full flex flex-col pb-24">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-black text-hb-gold uppercase italic">
            {viewState === 'create' ? 'New Entry' : 'Edit Entry'}
          </h2>
          <button onClick={() => setViewState('list')} className="w-8 h-8 rounded-full bg-hb-surface text-hb-muted border border-hb-border flex items-center justify-center hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="space-y-4 flex-1">
          <div>
            <label className="text-[10px] font-black uppercase text-hb-muted tracking-widest mb-1 block">Title</label>
            <input 
              value={currentEntry.title || ''}
              onChange={e => setCurrentEntry({...currentEntry, title: e.target.value})}
              placeholder="e.g. Big Win on Card #42"
              className="w-full input-human"
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-hb-muted tracking-widest mb-2 block">Current Mood</label>
            <div className="flex gap-2">
              {[
                { id: 'lucky', icon: 'fa-star', label: 'Lucky' },
                { id: 'neutral', icon: 'fa-meh', label: 'Neutral' },
                { id: 'tilted', icon: 'fa-fire', label: 'Frustrated' }
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setCurrentEntry({...currentEntry, mood: m.id as any})}
                  className={`flex-1 py-3 rounded-xl border transition-all flex flex-col items-center gap-1
                    ${currentEntry.mood === m.id 
                      ? 'border-hb-gold bg-hb-gold/10 text-hb-gold' 
                      : 'border-hb-border bg-hb-surface text-hb-muted grayscale hover:grayscale-0'}`}
                >
                  <i className={`fas ${m.icon}`}></i>
                  <span className="text-[9px] font-bold uppercase">{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-[10px] font-black uppercase text-hb-muted tracking-widest mb-1 block">Log Content</label>
            <textarea 
              value={currentEntry.content || ''}
              onChange={e => setCurrentEntry({...currentEntry, content: e.target.value})}
              placeholder="Record your strategy, wins, or thoughts..."
              className="w-full bg-hb-surface border border-hb-border rounded-xl p-4 text-sm font-medium outline-none focus:border-hb-gold text-white h-64 resize-none shadow-inner"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button 
            onClick={() => setViewState('list')}
            className="flex-1 py-4 rounded-xl font-bold text-hb-muted bg-hb-surface border border-hb-border uppercase text-xs hover:text-white"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="flex-[2] py-4 rounded-xl font-bold text-hb-blueblack bg-hb-gold shadow-[0_0_15px_rgba(255,215,0,0.2)] uppercase text-xs flex items-center justify-center gap-2 active:scale-95 transition-transform hover:brightness-110"
          >
            <i className="fas fa-save"></i> Save Entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5 pb-24 relative min-h-full">
      <div className="bg-gradient-to-r from-hb-surface to-hb-blueblack border border-hb-border p-8 rounded-[2rem] text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-1 italic tracking-tight uppercase text-hb-gold">Secure Journal</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest opacity-70">Encrypted Player Notes</p>
        </div>
        <i className="fas fa-lock absolute -right-6 -bottom-6 text-white/5 text-[9rem] -rotate-12"></i>
      </div>

      {entries.length === 0 ? (
        <div className="text-center py-12 opacity-50">
          <div className="w-16 h-16 bg-hb-surface rounded-full flex items-center justify-center mx-auto mb-4 text-hb-muted text-2xl border border-hb-border">
            <i className="fas fa-book-open"></i>
          </div>
          <p className="text-sm font-bold text-white">No entries yet.</p>
          <p className="text-xs text-hb-muted mt-1">Start documenting your winning streaks!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {entries.map(entry => (
            <div key={entry.id} className="bg-hb-surface p-5 rounded-[1.5rem] border border-hb-border shadow-sm flex flex-col gap-3 group active:scale-[0.99] transition-transform">
              <div className="flex items-start justify-between">
                <div>
                   <h3 className="font-black text-white text-[14px] leading-tight mb-1">{entry.title}</h3>
                   <span className="text-[10px] text-hb-muted font-bold uppercase tracking-wide">{entry.date}</span>
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#121212] flex items-center justify-center border border-hb-border">
                  <i className={`fas ${getMoodIcon(entry.mood)}`}></i>
                </div>
              </div>
              
              <p className="text-[12px] text-hb-muted line-clamp-2 font-medium leading-relaxed">
                {entry.content}
              </p>

              <div className="pt-3 border-t border-hb-border/50 flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => startEdit(entry)} 
                  className="text-[10px] font-bold text-hb-gold uppercase hover:underline"
                >
                  Edit
                </button>
                <button 
                  onClick={() => handleDelete(entry.id)} 
                  className="text-[10px] font-bold text-red-500 uppercase hover:underline"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FAB */}
      <button 
        onClick={startCreate}
        className="fixed bottom-24 right-5 w-14 h-14 bg-hb-gold text-hb-blueblack rounded-full shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center text-xl z-30 border-4 border-hb-surface active:scale-90 transition-transform"
      >
        <i className="fas fa-plus"></i>
      </button>
    </div>
  );
};

export default JournalView;
