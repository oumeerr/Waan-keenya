
import React, { useEffect, useState } from 'react';
import { generateCard, generateMiniCard } from '../constants';
import { supabase } from '../services/supabase';
import { GameHistoryItem } from '../types';

const HistoryView: React.FC = () => {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from('game_history')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        if (data) setHistory(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-hb-brand-grey italic tracking-tight uppercase">Activity Logs</h2>
          <p className="text-[11px] text-hb-muted font-bold uppercase tracking-widest mt-1">Detailed Match History</p>
        </div>
        <div className="bg-hb-bg border border-hb-border px-3 py-1.5 rounded-xl text-[10px] font-black text-hb-blueblack uppercase shadow-sm">
          Last 10 Games
        </div>
      </div>

      <div className="space-y-8">
        {loading ? (
          <div className="text-center py-10 text-hb-muted font-bold">Loading records...</div>
        ) : history.length === 0 ? (
          <div className="text-center py-10 text-hb-muted font-bold">No game history found. Play a match!</div>
        ) : (
          history.map((h, i) => {
            // Visualize the first card played in that match for context
            const mainCardId = h.card_ids[0] || 1;
            const grid = h.game_mode === 'mini' ? generateMiniCard(mainCardId) : generateCard(mainCardId);
            const flatGrid = grid.flat();
            const calledSet = new Set(h.called_numbers || []);
            
            return (
              <div key={h.id} className="bg-white rounded-[2.5rem] border border-hb-border overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {/* Header Info */}
                <div className="p-5 flex items-center justify-between bg-hb-bg/40 border-b border-hb-border">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[10px] font-black text-hb-navy tracking-tight">#{h.id.slice(0, 8)}</span>
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-md uppercase border ${h.game_mode === 'mini' ? 'bg-hb-gold/10 text-hb-gold border-hb-gold/20' : 'bg-hb-blue/10 text-hb-blue border-hb-blue/20'}`}>
                        {h.game_mode}
                      </span>
                    </div>
                    <span className="text-[9px] text-hb-muted font-bold uppercase tracking-wider">{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                  <div className="text-right">
                    <div className={`text-[18px] font-black leading-none mb-1 ${h.status === 'won' ? 'text-hb-emerald' : 'text-red-500'}`}>
                      {h.status === 'won' ? `+${h.payout} ETB` : `-${h.stake} ETB`}
                    </div>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${h.status === 'won' ? 'bg-hb-emerald/10 text-hb-emerald' : 'bg-red-50 text-red-400'}`}>
                      {h.status}
                    </span>
                  </div>
                </div>
                
                {/* Vertical Side-by-Side: Cartela vs Call Log */}
                <div className="p-5 grid grid-cols-12 gap-6">
                  
                  {/* Left: The Cartela Grid (History Stage) */}
                  <div className="col-span-7">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[9px] font-black text-hb-muted uppercase tracking-widest">Played Card #{mainCardId}</span>
                    </div>
                    <div className={`grid ${h.game_mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-1 bg-hb-bg p-2 rounded-2xl border border-hb-border shadow-inner`}>
                      {flatGrid.map((num, idx) => {
                        const isMarked = num === 0 || calledSet.has(num);
                        return (
                          <div 
                            key={idx} 
                            className={`aspect-square flex items-center justify-center text-[10px] font-black rounded-lg border transition-all
                              ${isMarked 
                                  ? 'bg-hb-navy text-white border-hb-navy' 
                                  : 'bg-white text-hb-navy/40 border-hb-border/50'}`}
                          >
                            {num === 0 ? '★' : num}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right: Vertical Call History Log */}
                  <div className="col-span-5 flex flex-col">
                    <div className="flex items-center justify-between mb-3 px-1">
                      <span className="text-[9px] font-black text-hb-muted uppercase tracking-widest">Call Log</span>
                    </div>
                    <div className="flex-1 bg-slate-50 border border-hb-border/50 rounded-2xl overflow-hidden flex flex-col max-h-[160px]">
                      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
                        {h.called_numbers && h.called_numbers.length > 0 ? h.called_numbers.map((num, idx) => (
                          <div 
                            key={idx} 
                            className="flex items-center gap-2 p-1.5 rounded-xl border transition-all bg-white text-hb-navy border-hb-border shadow-sm"
                          >
                            <span className="w-5 h-5 shrink-0 rounded-lg flex items-center justify-center text-[8px] font-black border bg-hb-bg border-hb-border text-hb-muted">
                              {idx + 1}
                            </span>
                            <span className="text-[11px] font-black tracking-tight">
                              {num === 0 ? 'FREE' : `Ball ${num}`}
                            </span>
                          </div>
                        )) : (
                          <div className="p-2 text-[10px] text-hb-muted">No numbers called.</div>
                        )}
                      </div>
                      <div className="p-2 bg-hb-bg/80 border-t border-hb-border/50 text-center">
                        <span className="text-[8px] font-black text-hb-muted uppercase tracking-tighter">End of Session</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Footer */}
                <div className="px-5 pb-5 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-hb-muted uppercase">Cards</span>
                      <span className="text-[11px] font-black text-hb-navy">{h.card_ids.length}</span>
                    </div>
                    <div className="w-px h-6 bg-hb-border"></div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-black text-hb-muted uppercase">Total Stake</span>
                      <span className="text-[11px] font-black text-hb-navy">{h.stake} ETB</span>
                    </div>
                  </div>
                  {h.status === 'won' && (
                    <div className="flex items-center gap-1.5 bg-hb-emerald/10 text-hb-emerald px-3 py-1 rounded-lg border border-hb-emerald/20">
                      <i className="fas fa-crown text-[10px]"></i>
                      <span className="text-[10px] font-black uppercase tracking-tight">Pot Claimed</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 p-8 bg-slate-50 rounded-[2.5rem] border border-hb-border border-dashed text-center">
        <i className="fas fa-receipt text-hb-brand-grey/20 text-4xl mb-4"></i>
        <h4 className="text-[13px] font-black text-hb-brand-grey uppercase mb-2">Immutable Ledger</h4>
        <p className="text-[11px] text-hb-muted font-bold leading-relaxed px-4">
          Match logs are securely stored. For dispute resolution or technical assistance, contact HB Support.
        </p>
      </div>
    </div>
  );
};

export default HistoryView;
