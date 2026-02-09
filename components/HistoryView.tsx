
import React, { useEffect, useState } from 'react';
import { generateCard, generateMiniCard } from '../constants';
import { supabase } from '../services/supabase';
import { GameHistoryItem, User } from '../types';

interface HistoryViewProps {
  user: User;
}

const HistoryView: React.FC<HistoryViewProps> = ({ user }) => {
  const [history, setHistory] = useState<GameHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchHistory = async () => {
      if (user.id === 'guest') {
        setLoading(false);
        return;
      }
      try {
        const { data, error } = await supabase
          .from('game_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20);
        
        if (error) throw error;
        if (data) setHistory(data);
      } catch (err) {
        console.error("Error fetching history:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // 2. Real-time Subscription
    if (user.id !== 'guest') {
      const channel = supabase
        .channel('game_history_updates')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'game_history',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            const newEntry = payload.new as GameHistoryItem;
            setHistory((prev) => [newEntry, ...prev]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user.id]);

  return (
    <div className="p-5 pb-32">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-black text-hb-navy italic tracking-tighter uppercase">Activity Logs</h2>
          <p className="text-[11px] text-hb-muted font-bold uppercase tracking-widest mt-1">Immutable Match Ledger</p>
        </div>
        <div className="bg-hb-surface border border-hb-border px-3 py-1.5 rounded-xl text-[9px] font-black text-white uppercase shadow-lg flex items-center gap-2">
          <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
          Live Feed
        </div>
      </div>

      <div className="flex flex-col gap-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="w-8 h-8 border-4 border-hb-blue border-t-hb-gold rounded-full animate-spin"></div>
            <span className="text-hb-muted font-black text-[10px] uppercase tracking-widest">Loading...</span>
          </div>
        ) : history.length === 0 ? (
          <div className="text-center py-16 bg-white/50 rounded-[2rem] border-2 border-dashed border-hb-border/30">
            <i className="fas fa-ghost text-3xl text-hb-muted/30 mb-3"></i>
            <p className="text-hb-muted font-bold uppercase text-[10px] tracking-widest">No match records found</p>
          </div>
        ) : (
          history.map((h) => {
            const mainCardId = h.card_ids[0] || 1;
            const grid = h.game_mode === 'mini' ? generateMiniCard(mainCardId) : generateCard(mainCardId);
            const flatGrid = grid.flat();
            const calledSet = new Set(h.called_numbers || []);
            const isWin = h.status === 'won';
            
            // Explicit Status Summary string as requested
            const statusSummary = isWin 
                ? `WON: +${h.payout.toLocaleString()} ETB` 
                : `LOST: -${h.stake.toLocaleString()} ETB`;
            
            return (
              <div 
                key={h.id} 
                className={`bg-white rounded-[2rem] border-l-[6px] shadow-lg overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] animate-in slide-in-from-bottom-2 duration-500
                  ${isWin ? 'border-hb-emerald shadow-emerald-500/10' : 'border-red-500 shadow-red-500/10'}`}
              >
                {/* Status Summary Banner */}
                <div className={`px-5 py-3 flex items-center justify-between border-b border-hb-border/5 
                  ${isWin ? 'bg-hb-emerald/10' : 'bg-red-500/5'}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${isWin ? 'bg-hb-emerald animate-pulse' : 'bg-red-500'}`}></div>
                    <span className={`text-[11px] font-black uppercase tracking-wider ${isWin ? 'text-hb-emerald' : 'text-red-500'}`}>
                      {statusSummary}
                    </span>
                  </div>
                  <span className="text-[9px] font-black text-hb-muted/40 uppercase font-mono">#{h.id.slice(0, 6)}</span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded text-white uppercase tracking-wide
                          ${h.game_mode === 'mini' ? 'bg-hb-blue' : 'bg-hb-gold text-hb-blueblack'}`}>
                          {h.game_mode}
                        </span>
                        <span className="text-[9px] text-hb-muted font-bold">
                          {new Date(h.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-[16px] font-black text-hb-navy uppercase tracking-tight">
                        {isWin ? 'Payout Claimed' : 'Stake Forfeited'}
                      </h3>
                    </div>
                    {isWin && <i className="fas fa-trophy text-hb-gold text-xl drop-shadow-sm"></i>}
                  </div>
                  
                  {/* Compact Grid Preview for Visual Context */}
                   <div className="flex gap-4">
                      <div className="shrink-0">
                         <div className="text-[8px] font-black text-hb-muted uppercase tracking-wider mb-1">Card #{mainCardId}</div>
                         <div className={`grid ${h.game_mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-0.5 bg-hb-bg p-1.5 rounded-lg w-fit border border-hb-border/20`}>
                            {flatGrid.map((num, idx) => {
                              const isMarked = num === 0 || calledSet.has(num);
                              return (
                                <div 
                                  key={idx} 
                                  className={`w-3 h-3 flex items-center justify-center rounded-[1px]
                                    ${isMarked ? 'bg-hb-gold' : 'bg-white/10'}`}
                                />
                              );
                            })}
                         </div>
                      </div>
                      <div className="flex-1 flex flex-col justify-end items-end text-right">
                         <span className="text-[9px] font-bold text-hb-muted uppercase">Numbers Called</span>
                         <span className="text-[14px] font-black text-hb-navy">{h.called_numbers?.length || 0}</span>
                         <div className="mt-2 text-[10px] font-black uppercase tracking-widest text-hb-blue/60">
                            {h.card_ids.length > 1 ? `+${h.card_ids.length - 1} More Cards` : 'Single Entry'}
                         </div>
                      </div>
                   </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="mt-12 text-center">
         <p className="text-[10px] text-hb-muted font-bold opacity-40 uppercase tracking-widest">End of History</p>
      </div>
    </div>
  );
};

export default HistoryView;
