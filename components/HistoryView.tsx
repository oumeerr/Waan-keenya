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
    <div className="p-5 pb-32">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-3xl font-black text-hb-navy italic tracking-tighter uppercase">Activity Logs</h2>
          <p className="text-[11px] text-hb-muted font-bold uppercase tracking-widest mt-1">Immutable Match Ledger</p>
        </div>
        <div className="bg-hb-surface border border-hb-border px-4 py-2 rounded-2xl text-[10px] font-black text-white uppercase shadow-lg">
          Recent 10
        </div>
      </div>

      <div className="space-y-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-10 h-10 border-4 border-hb-blue border-t-hb-gold rounded-full animate-spin"></div>
            <span className="text-hb-muted font-black text-xs uppercase tracking-widest">Decrypting Records...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-20 bg-hb-surface rounded-[2.5rem] border border-hb-border border-dashed">
            <i className="fas fa-ghost text-4xl text-hb-muted/20 mb-4"></i>
            <p className="text-hb-muted font-bold uppercase text-xs tracking-widest">No match records found</p>
          </div>
        ) : (
          history.map((h) => {
            const mainCardId = h.card_ids[0] || 1;
            const grid = h.game_mode === 'mini' ? generateMiniCard(mainCardId) : generateCard(mainCardId);
            const flatGrid = grid.flat();
            const calledSet = new Set(h.called_numbers || []);
            const isWin = h.status === 'won';
            
            return (
              <div 
                key={h.id} 
                className={`bg-white rounded-[2.5rem] border-l-[6px] shadow-xl overflow-hidden transition-all hover:scale-[1.01] 
                  ${isWin ? 'border-hb-emerald shadow-emerald-500/5' : 'border-red-500 shadow-red-500/5'}`}
              >
                {/* Status Summary Banner */}
                <div className={`px-6 py-3 flex items-center justify-between border-b border-hb-border/10 
                  ${isWin ? 'bg-hb-emerald/5' : 'bg-red-500/5'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-hb-emerald animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`text-[11px] font-black uppercase tracking-[0.15em] ${isWin ? 'text-hb-emerald' : 'text-red-500'}`}>
                      {isWin ? 'Match Victory' : 'House Win'}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-hb-navy/30 uppercase font-mono">ID: {h.id.slice(0, 8)}</span>
                </div>

                <div className="p-6">
                  {/* Header Outcome Section */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg uppercase border-2 
                          ${h.game_mode === 'mini' ? 'bg-hb-gold/10 text-hb-gold border-hb-gold/20' : 'bg-hb-blue/10 text-hb-blue border-hb-blue/20'}`}>
                          {h.game_mode} Room
                        </span>
                        <span className="text-[10px] text-hb-muted font-bold uppercase tracking-wider">
                          {new Date(h.created_at).toLocaleDateString()} • {new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <h3 className="text-[18px] font-black text-hb-navy uppercase tracking-tight italic">
                        {isWin ? `Won: +${h.payout} ETB` : `Lost: -${h.stake} ETB`}
                      </h3>
                    </div>
                    <div className="w-14 h-14 bg-hb-bg rounded-2xl flex items-center justify-center border border-hb-border shadow-inner">
                       <i className={`fas ${isWin ? 'fa-crown text-hb-gold' : 'fa-skull text-red-400'} text-xl`}></i>
                    </div>
                  </div>
                  
                  {/* Visual Components */}
                  <div className="grid grid-cols-12 gap-8 items-start">
                    
                    {/* Left: Cartela Preview */}
                    <div className="col-span-7">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black text-hb-muted uppercase tracking-[0.2em] italic">Carte #{mainCardId}</span>
                        <span className="text-[8px] font-bold text-hb-muted opacity-40 uppercase">Board View</span>
                      </div>
                      <div className={`grid ${h.game_mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-1 bg-hb-bg p-2.5 rounded-2xl border border-hb-border/50 shadow-inner`}>
                        {flatGrid.map((num, idx) => {
                          const isMarked = num === 0 || calledSet.has(num);
                          return (
                            <div 
                              key={idx} 
                              className={`aspect-square flex items-center justify-center text-[9px] font-black rounded-lg border transition-all
                                ${isMarked 
                                    ? 'bg-hb-navy text-hb-gold border-hb-gold/30 shadow-sm' 
                                    : 'bg-white text-hb-navy/10 border-hb-border/20'}`}
                            >
                              {num === 0 ? '★' : num}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right: Vertical Call History Log */}
                    <div className="col-span-5 flex flex-col h-full">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-[9px] font-black text-hb-muted uppercase tracking-[0.2em] italic">Call Feed</span>
                        <span className="text-[8px] font-bold text-hb-muted opacity-40 uppercase">{h.called_numbers?.length || 0} Total</span>
                      </div>
                      <div className="flex-1 bg-slate-50 border border-hb-border/50 rounded-2xl overflow-hidden flex flex-col min-h-[140px] max-h-[140px]">
                        <div className="flex-1 overflow-y-auto p-2.5 space-y-1.5 no-scrollbar">
                          {h.called_numbers && h.called_numbers.length > 0 ? h.called_numbers.map((num, idx) => (
                            <div 
                              key={idx} 
                              className="flex items-center gap-2 p-1.5 rounded-xl border bg-white text-hb-navy border-hb-border/50 shadow-sm"
                            >
                              <span className="w-5 h-5 shrink-0 rounded-lg flex items-center justify-center text-[8px] font-black border bg-hb-bg border-hb-border text-hb-muted">
                                {idx + 1}
                              </span>
                              <span className="text-[11px] font-black tracking-tighter">
                                {num === 0 ? 'FREE' : `Ball ${num}`}
                              </span>
                            </div>
                          )) : (
                            <div className="flex items-center justify-center h-full text-[10px] text-hb-muted uppercase font-black italic opacity-40">No numbers</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* High Level Stats Footer */}
                  <div className="mt-8 pt-5 border-t border-hb-border/10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-hb-muted uppercase tracking-widest mb-0.5">Cards Handled</span>
                        <span className="text-[12px] font-black text-hb-navy">{h.card_ids.length} Cartella</span>
                      </div>
                      <div className="w-px h-6 bg-hb-border/50"></div>
                      <div className="flex flex-col">
                        <span className="text-[8px] font-black text-hb-muted uppercase tracking-widest mb-0.5">Net Impact</span>
                        <span className={`text-[12px] font-black ${isWin ? 'text-hb-emerald' : 'text-red-500'}`}>
                          {isWin ? `+${h.payout - h.stake} ETB` : `-${h.stake} ETB`}
                        </span>
                      </div>
                    </div>
                    
                    {isWin && (
                      <div className="bg-hb-emerald text-white text-[9px] font-black px-4 py-2 rounded-xl shadow-lg shadow-hb-emerald/20 uppercase tracking-[0.1em] italic flex items-center gap-2">
                        <i className="fas fa-trophy"></i> Champion
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-20 p-10 bg-hb-surface rounded-[3rem] border border-hb-border border-dashed text-center relative overflow-hidden group">
        <i className="fas fa-shield-alt absolute -right-4 -bottom-4 text-white/5 text-[8rem] group-hover:scale-110 transition-transform"></i>
        <i className="fas fa-history text-hb-muted/20 text-5xl mb-6"></i>
        <h4 className="text-[15px] font-black text-white uppercase mb-3 tracking-widest italic">Encrypted Ledger Active</h4>
        <p className="text-[11px] text-hb-muted font-bold leading-relaxed px-6 max-w-sm mx-auto">
          Your match data is hashed and stored on the Beteseb Bet server. For detailed support queries, use your Unique Build ID: <span className="text-hb-gold">WKB-2024-PRO</span>
        </p>
      </div>
    </div>
  );
};

export default HistoryView;