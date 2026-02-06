import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { User } from '../types';
import { generateCard, generateMiniCard } from '../constants';
import { APP_CONFIG } from '../config';
import { supabase } from '../services/supabase';

interface GameViewProps {
  cardIds: number[];
  betAmount: number;
  mode: 'classic' | 'mini';
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
  matchStartTime: number;
  onClose: () => void;
}

const GameView: React.FC<GameViewProps> = ({ cardIds, betAmount, mode, user, setUser, matchStartTime, onClose }) => {
  const [gameState, setGameState] = useState<'matchmaking' | 'playing' | 'finished'>('matchmaking');
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  
  // Deterministic remaining time calculation (Synchronized across all players)
  const getRemainingTime = useCallback(() => {
    const now = Date.now();
    const diff = Math.ceil((matchStartTime - now) / 1000);
    return Math.max(0, diff);
  }, [matchStartTime]);

  const [countdown, setCountdown] = useState(getRemainingTime());
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [markedByCard, setMarkedByCard] = useState<Record<number, Set<number>>>(
    cardIds.reduce((acc, id) => ({ ...acc, [id]: new Set([0]) }), {})
  );
  const [winner, setWinner] = useState<string | null>(null);
  const [winningCardIds, setWinningCardIds] = useState<number[]>([]);
  const [winnings, setWinnings] = useState(0);
  
  // Players "Stacked" Logic: Start with 1 (the current user)
  const [stackedPlayers, setStackedPlayers] = useState(1);
  const stackedPlayersRef = useRef(1);

  // Generate hard combinations on load
  const allCardsData = useRef<Record<number, number[][]>>(
    cardIds.reduce((acc, id) => ({ ...acc, [id]: mode === 'mini' ? generateMiniCard(id) : generateCard(id) }), {})
  );
  
  const callInterval = useRef<number | null>(null);

  // --- Core Game Logic ---

  const sessionPot = useMemo(() => {
    // Pot scales with the number of stacked players
    const totalRawStake = betAmount * cardIds.length * stackedPlayers;
    return Math.floor(totalRawStake * (1 - APP_CONFIG.GAME.HOUSE_FEE_PERCENT));
  }, [betAmount, cardIds.length, stackedPlayers]);

  const checkWinForCard = useCallback((id: number, currentMarked: Set<number>) => {
    const grid = allCardsData.current[id];
    const isMarked = (n: number) => currentMarked.has(n);
    const size = mode === 'mini' ? 3 : 5;

    for (let r = 0; r < size; r++) if (grid[r].every(num => isMarked(num))) return true;
    
    for (let c = 0; c < size; c++) {
      let colMarked = true;
      for (let r = 0; r < size; r++) if (!isMarked(grid[r][c])) colMarked = false;
      if (colMarked) return true;
    }

    let d1 = true, d2 = true;
    for (let i = 0; i < size; i++) {
      if (!isMarked(grid[i][i])) d1 = false;
      if (!isMarked(grid[i][size - 1 - i])) d2 = false;
    }
    if (d1 || d2) return true;

    if (mode === 'classic') {
      const topLeft = isMarked(grid[0][0]);
      const topRight = isMarked(grid[0][4]);
      const bottomLeft = isMarked(grid[4][0]);
      const bottomRight = isMarked(grid[4][4]);
      if (topLeft && topRight && bottomLeft && bottomRight) return true;
    }
    return false;
  }, [mode]);

  const winningCardsList = cardIds.filter(id => checkWinForCard(id, markedByCard[id]));
  const isAnyWinning = winningCardsList.length > 0;

  const completeGameSession = async (status: 'won' | 'lost' | 'abandoned', payout: number, winCards: number[] = []) => {
    if (callInterval.current) clearInterval(callInterval.current);
    
    const userStake = betAmount * cardIds.length;
    const newBalance = user.balance + payout;
    const newWins = status === 'won' ? user.wins + 1 : user.wins;

    setWinnings(payout);
    setWinningCardIds(winCards);
    setWinner(status === 'won' ? user.username : (status === 'abandoned' ? 'SURRENDER' : 'HOUSE'));
    setGameState('finished');
    
    if (status === 'won') {
       setUser(prev => ({ ...prev, balance: newBalance, wins: newWins }));
    }

    if (user.id !== 'guest') {
       try {
         if (status === 'won') {
           await supabase.from('profiles').update({ balance: newBalance, wins: newWins }).eq('id', user.id);
         }
         await supabase.from('game_history').insert({
            user_id: user.id,
            game_mode: mode,
            card_ids: cardIds,
            stake: userStake,
            payout: payout,
            status: status,
            called_numbers: drawnNumbers
         });
       } catch (err) {
         console.error("Failed to save game history:", err);
       }
    }
  };

  const handleCallBingo = useCallback(async () => {
    if (!isAnyWinning) {
      completeGameSession('lost', 0);
      return;
    }
    completeGameSession('won', sessionPot, winningCardsList);
  }, [isAnyWinning, sessionPot, winningCardsList, drawnNumbers]);

  const handleLeaveMatch = async () => {
     await completeGameSession('abandoned', 0);
     onClose();
  };

  // Matchmaking Timer Sync with "At least 2 players" requirement
  useEffect(() => {
    if (gameState === 'matchmaking') {
      const initialRemaining = getRemainingTime();
      setCountdown(initialRemaining);

      const timer = setInterval(() => {
        const remaining = getRemainingTime();
        setCountdown(remaining);
        
        // Simulate players joining the stack
        const roll = Math.random();
        if (stackedPlayersRef.current < 2 && roll > 0.8) {
          stackedPlayersRef.current += 1;
          setStackedPlayers(stackedPlayersRef.current);
        } else if (stackedPlayersRef.current >= 2 && stackedPlayersRef.current < 400 && roll > 0.6) {
          stackedPlayersRef.current += Math.floor(Math.random() * 3) + 1;
          setStackedPlayers(stackedPlayersRef.current);
        }

        // CRITICAL: Match only starts if time is up AND at least 2 players are stacked
        if (remaining <= 0 && stackedPlayersRef.current >= APP_CONFIG.GAME.MIN_PLAYERS_TO_START) {
          clearInterval(timer);
          setGameState('playing');
        }
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState, getRemainingTime]);

  // Auto-Play Logic
  useEffect(() => {
    if (gameState === 'playing' && isAutoPlay) {
      setMarkedByCard(prev => {
        const next = { ...prev };
        let hasChanges = false;
        cardIds.forEach(id => {
          const cardGrid = allCardsData.current[id].flat();
          const currentMarks = next[id];
          const missingMarks = drawnNumbers.filter(n => n !== 0 && cardGrid.includes(n) && !currentMarks.has(n));
          if (missingMarks.length > 0) {
            next[id] = new Set([...currentMarks, ...missingMarks]);
            hasChanges = true;
          }
        });
        return hasChanges ? next : prev;
      });

      if (isAnyWinning) {
        handleCallBingo();
      }
    }
  }, [gameState, isAutoPlay, drawnNumbers, isAnyWinning, handleCallBingo, cardIds]);

  // Game Loop
  useEffect(() => {
    if (gameState === 'playing') {
      const poolSize = mode === 'mini' ? 30 : 75;
      const pool = Array.from({ length: poolSize }, (_, i) => i + 1);
      const shuffled = [...pool].sort(() => Math.random() - 0.5);
      let idx = 0;
      const intervalMs = mode === 'mini' ? APP_CONFIG.GAME.CALL_INTERVAL_MINI_MS : APP_CONFIG.GAME.CALL_INTERVAL_CLASSIC_MS;

      callInterval.current = window.setInterval(() => {
        if (idx >= poolSize) {
          if (callInterval.current) clearInterval(callInterval.current);
          completeGameSession('lost', 0);
          return;
        }
        const num = shuffled[idx++];
        setDrawnNumbers(prev => [...prev, num]);
      }, intervalMs);

      return () => {
        if (callInterval.current) clearInterval(callInterval.current);
      };
    }
  }, [gameState, mode]);

  const handleManualDaub = (cardId: number, num: number) => {
    if (num === 0 || !drawnNumbers.includes(num)) return;
    setMarkedByCard(prev => {
      const currentMarks = prev[cardId];
      if (currentMarks.has(num)) return prev;
      return { ...prev, [cardId]: new Set([...currentMarks, num]) };
    });
  };

  const getCardProgress = (id: number) => {
    const grid = allCardsData.current[id];
    const marked = markedByCard[id];
    const size = mode === 'mini' ? 3 : 5;
    let max = 0;
    for (let r = 0; r < size; r++) {
      const count = grid[r].filter(n => marked.has(n)).length;
      if (count > max) max = count;
    }
    for (let c = 0; c < size; c++) {
      let count = 0;
      for (let r = 0; r < size; r++) if (marked.has(grid[r][c])) count++;
      if (count > max) max = count;
    }
    return { current: max, total: size };
  };

  return (
    <div className="min-h-full flex flex-col items-center pt-4 px-2 pb-20 w-full max-w-md mx-auto">
      {gameState === 'matchmaking' && (
        <div className="w-full flex flex-col items-center animate-in fade-in duration-500 px-4">
          <div className="bg-white p-6 rounded-[2rem] shadow-2xl flex flex-col items-center justify-center text-center w-full border-2 border-hb-border/10 mb-6">
            <div className="flex items-center gap-4 mb-8">
               <div className={`w-12 h-12 border-[5px] rounded-full animate-spin transition-all duration-500 ${stackedPlayers < 2 ? 'border-red-500 border-t-transparent' : 'border-hb-blue border-t-hb-gold'}`}></div>
               <div className="text-left">
                  <h3 className="text-[18px] font-black text-hb-navy uppercase tracking-tight leading-none italic">Arena Matchmaking</h3>
                  <p className={`text-[10px] font-black uppercase mt-1.5 tracking-widest ${stackedPlayers < 2 ? 'text-red-500 animate-pulse' : 'text-hb-emerald'}`}>
                    {stackedPlayers < 2 ? '⚠️ Waiting for Opponents' : '✅ Match Ready to Start'}
                  </p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 w-full mb-8">
              <div className="bg-hb-bg p-4 rounded-3xl border border-hb-border flex flex-col items-center shadow-inner">
                <span className="text-[9px] font-black text-hb-muted uppercase tracking-tighter mb-1.5">Launch Time</span>
                <span className={`text-[28px] font-black tabular-nums leading-none ${countdown <= 0 ? 'text-hb-emerald' : 'text-hb-gold'}`}>{countdown}s</span>
              </div>
              <div className={`p-4 rounded-3xl border flex flex-col items-center transition-all shadow-inner ${stackedPlayers < 2 ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'}`}>
                <span className={`text-[9px] font-black uppercase tracking-tighter mb-1.5 ${stackedPlayers < 2 ? 'text-red-400' : 'text-hb-blue'}`}>Players Stacked</span>
                <span className={`text-[28px] font-black tabular-nums leading-none ${stackedPlayers < 2 ? 'text-red-600' : 'text-hb-blue'}`}>{stackedPlayers}</span>
              </div>
            </div>

            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden mb-3 shadow-inner p-0.5">
               <div 
                 className={`h-full transition-all duration-1000 rounded-full ${stackedPlayers < 2 ? 'bg-gradient-to-r from-red-400 to-red-600' : 'bg-gradient-to-r from-hb-emerald to-green-400'}`}
                 style={{ width: `${Math.min(100, (stackedPlayers / 2) * 100)}%` }}
               ></div>
            </div>
            <div className="flex items-center gap-2 mb-2">
               <i className={`fas ${stackedPlayers < 2 ? 'fa-user-clock text-red-400' : 'fa-users text-hb-emerald'}`}></i>
               <p className="text-[10px] font-black text-hb-muted uppercase tracking-[0.1em]">
                 {stackedPlayers < 2 ? 'Need 1 more player to unlock arena' : 'Global Pool Active • Ready to roll'}
               </p>
            </div>
          </div>
          
          <div className="w-full mb-2">
             <div className="flex items-center justify-between mb-4 px-3">
                <div className="flex items-center gap-2">
                   <div className="w-1.5 h-1.5 bg-hb-gold rounded-full animate-ping"></div>
                   <span className="text-[10px] font-black uppercase text-hb-muted tracking-widest italic">Live Pool Overview</span>
                </div>
                <span className="text-[10px] font-black uppercase text-hb-emerald px-2 py-0.5 bg-hb-emerald/10 rounded-md">Validated</span>
             </div>
             <div className="grid grid-cols-2 gap-3 w-full max-h-[40vh] overflow-y-auto no-scrollbar pb-10 px-1">
               {cardIds.map(id => (
                  <div key={id} className="bg-white p-3 rounded-2xl border border-hb-border shadow-sm relative overflow-hidden group">
                     <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black text-hb-navy bg-hb-bg px-2 py-1 rounded-lg border border-hb-border">CARTELLA #{id}</span>
                        <i className="fas fa-lock text-hb-emerald/40 text-[9px]"></i>
                     </div>
                     <div className={`grid ${mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-1 opacity-50 group-hover:opacity-100 transition-opacity`}>
                        {allCardsData.current[id].flat().map((n, i) => (
                           <div key={i} className={`aspect-square flex items-center justify-center text-[8px] font-black rounded-md ${n===0 ? 'bg-hb-emerald/10 text-hb-emerald' : 'bg-[#1E1E1E] text-white border border-white/5'}`}>
                             {n===0 ? '★' : n}
                           </div>
                        ))}
                     </div>
                  </div>
               ))}
             </div>
          </div>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="w-full max-w-[440px] animate-in slide-in-from-bottom-5 duration-500 px-3">
          <div className="flex justify-between items-center mb-6 bg-white px-6 py-5 rounded-[2.5rem] shadow-xl border border-hb-border/10">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-hb-muted uppercase tracking-widest mb-1.5">Live Arena Pot</span>
              <span className="text-[26px] font-black text-hb-emerald leading-none tracking-tighter">
                {sessionPot.toLocaleString()} <span className="text-[14px] opacity-60 ml-0.5">ETB</span>
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[8px] font-black text-hb-muted uppercase tracking-tighter bg-slate-100 px-2 py-0.5 rounded-full">
                  {stackedPlayers} Competitors
                </span>
              </div>
            </div>
            <div className="bg-hb-navy text-white px-5 py-2.5 rounded-2xl flex items-center gap-3 shadow-2xl border border-hb-border/50">
               <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
               <span className="text-[12px] font-black uppercase tracking-widest italic">Live Feed</span>
            </div>
          </div>

          <div className="flex items-center gap-3 mb-10 justify-center h-[70px]">
             {drawnNumbers.length > 0 ? (
               <div className="flex flex-col items-center animate-in zoom-in-50 duration-300">
                  <div className="text-[38px] font-black text-hb-blueblack px-10 py-3 bg-hb-gold rounded-[2rem] border-[4px] border-white shadow-2xl scale-110 relative bingo-ball-3d">
                    {drawnNumbers[drawnNumbers.length - 1]}
                    <div className="absolute -top-3 -right-3 w-7 h-7 bg-hb-blue text-white text-[11px] font-black rounded-full flex items-center justify-center border-2 border-white shadow-xl">
                      {drawnNumbers.length}
                    </div>
                  </div>
                  <div className="text-[10px] font-black text-hb-muted uppercase tracking-[0.4em] mt-5 opacity-40 italic">Next Call in {mode === 'mini' ? '1.5s' : '2.0s'}</div>
               </div>
             ) : (
               <div className="flex flex-col items-center gap-3">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 bg-hb-gold rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-3 h-3 bg-hb-gold rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-3 h-3 bg-hb-gold rounded-full animate-bounce"></div>
                  </div>
                  <span className="text-hb-muted italic text-[14px] uppercase tracking-[0.3em] font-black opacity-30">Seeding Arena Feed...</span>
               </div>
             )}
          </div>

          <div className="px-1 mb-4 flex items-center justify-between">
            <span className="text-[12px] font-black text-hb-navy uppercase tracking-widest italic opacity-80">Battle Deck</span>
            <button 
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`flex items-center gap-3 px-5 py-2.5 rounded-2xl border-2 transition-all shadow-md active:scale-95 ${isAutoPlay ? 'bg-hb-emerald text-white border-hb-emerald' : 'bg-white text-hb-muted border-hb-border'}`}
            >
              <i className={`fas ${isAutoPlay ? 'fa-robot' : 'fa-hand-pointer'} text-[13px]`}></i>
              <span className="text-[11px] font-black uppercase tracking-tight">{isAutoPlay ? 'Auto-Daub On' : 'Manual Mode'}</span>
            </button>
          </div>

          <div className={`grid ${cardIds.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            {cardIds.map((id) => {
              const progress = getCardProgress(id);
              const isWinning = checkWinForCard(id, markedByCard[id]);
              return (
                <div key={id} className={`bg-white p-3.5 rounded-[2.5rem] border transition-all duration-500 shadow-xl relative overflow-hidden flex flex-col h-fit
                  ${isWinning ? 'ring-4 ring-hb-gold scale-[1.04] border-hb-gold z-10 shadow-[0_20px_40px_rgba(255,215,0,0.2)]' : 'border-hb-border/10 opacity-100'}`}>
                  <div className="flex justify-between items-center mb-3 px-1.5">
                    <span className="text-[11px] font-black text-hb-navy tracking-tighter uppercase opacity-40">Cartella #{id}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-2 bg-slate-100 rounded-full overflow-hidden shadow-inner p-0.5">
                        <div 
                          className="h-full bg-hb-emerald rounded-full transition-all duration-700" 
                          style={{ width: `${(progress.current / progress.total) * 100}%` }}
                        />
                      </div>
                      <span className="text-[9px] font-black text-hb-muted">{progress.current}/{progress.total}</span>
                    </div>
                  </div>
                  <div className={`grid ${mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-1.5 justify-items-center`}>
                    {allCardsData.current[id].flat().map((num, i) => (
                      <div 
                        key={i} 
                        onClick={() => handleManualDaub(id, num)}
                        className={`aspect-square w-full flex items-center justify-center rounded-xl font-black text-[12px] transition-all duration-300 cursor-pointer select-none
                        ${num === 0 ? 'bg-hb-emerald/10 text-hb-emerald border-2 border-hb-emerald/10' : 
                          markedByCard[id].has(num) 
                            ? 'bg-red-600 text-white border-2 border-red-800 shadow-xl scale-110' 
                            : 'bg-[#1E1E1E] text-white border border-white/10 hover:border-hb-gold/50 active:scale-90'}`}
                      >
                        {num === 0 ? '★' : num}
                      </div>
                    ))}
                  </div>
                  {isWinning && (
                    <div className="absolute inset-0 bg-hb-gold/30 flex items-center justify-center pointer-events-none backdrop-blur-[1px] animate-in fade-in zoom-in duration-300">
                       <div className="bg-hb-gold text-hb-blueblack text-[14px] font-black px-6 py-2.5 rounded-full shadow-2xl uppercase tracking-[0.2em] border-2 border-white animate-bounce">
                         WINNER!
                       </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-12 px-2 flex flex-col gap-5">
            <button 
              onClick={handleCallBingo}
              disabled={isAutoPlay && isAnyWinning} 
              className={`w-full h-[84px] rounded-[2.5rem] font-black text-[28px] shadow-2xl transition-all uppercase tracking-tighter border-b-[8px] flex items-center justify-center gap-5 active:scale-95 bg-hb-gold border-[#d97706] text-hb-blueblack hover:brightness-110 ${isAutoPlay && isAnyWinning ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            >
              <i className="fas fa-crown text-[24px]"></i>
              {isAutoPlay && isAnyWinning ? 'Processing...' : 'BINGO!'}
            </button>
            <button onClick={handleLeaveMatch} className="text-[11px] font-black text-hb-muted uppercase tracking-[0.4em] hover:text-red-500 py-4 transition-colors">Surrender Arena</button>
          </div>
        </div>
      )}

      {gameState === 'finished' && (
        <div className="fixed inset-0 z-[100] bg-hb-navy flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
           <div className="w-36 h-36 mb-10 bg-gradient-to-br from-hb-gold to-orange-500 rounded-full flex items-center justify-center text-[64px] shadow-[0_0_60px_rgba(249,115,22,0.5)] relative border-4 border-white/20">
             {winner === user.username ? '🏆' : '💀'}
             <div className="absolute -top-5 -right-5 bg-white text-hb-navy text-[13px] font-black px-5 py-2 rounded-2xl border-4 border-hb-gold uppercase shadow-2xl">
               {winner === user.username ? 'Arena King' : 'House Win'}
             </div>
           </div>
           
           <div className="mb-12 text-white px-4">
             <h2 className="text-[48px] font-black italic tracking-tighter uppercase leading-none drop-shadow-2xl">
               {winner === user.username ? 'SUPREME VICTORY' : 'DEFEATED'}
             </h2>
             <div className="text-[20px] font-black text-hb-gold mt-4 uppercase tracking-[0.3em] bg-white/5 py-2 rounded-xl border border-white/5">{winner}</div>
           </div>

           <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 w-full max-w-[360px] shadow-2xl mb-12 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-hb-gold/5 blur-3xl rounded-full"></div>
              <div className="text-[12px] font-black text-white/40 uppercase tracking-[0.4em] mb-8 border-b border-white/10 pb-4 italic">Match Receipt</div>
              <div className="flex justify-between items-center mb-8">
                 <span className="text-[15px] font-bold text-white/60">Cartellas:</span>
                 <div className="flex gap-2">
                    {winningCardIds.length > 0 ? winningCardIds.map(id => (
                      <span key={id} className="bg-hb-gold text-hb-blueblack text-[12px] font-black px-4 py-2 rounded-2xl shadow-xl">#{id}</span>
                    )) : <span className="text-red-400 font-black text-[12px] uppercase tracking-widest bg-red-400/10 px-4 py-2 rounded-2xl">NO WINNERS</span>}
                 </div>
              </div>
              <div className="flex justify-between items-center pt-2">
                 <span className="text-[15px] font-bold text-white/60">Final Payout:</span>
                 <span className={`${winner === user.username ? 'text-hb-emerald' : 'text-white/40'} text-[36px] font-black tracking-tighter`}>
                   {winnings.toLocaleString()} <span className="text-[14px] ml-1">ETB</span>
                 </span>
              </div>
           </div>

           <button onClick={onClose} className="w-full max-w-[300px] h-[72px] bg-white text-hb-navy font-black rounded-[2rem] shadow-2xl active:scale-95 uppercase tracking-[0.2em] text-[18px] hover:bg-hb-gold hover:text-white transition-all border-b-[6px] border-slate-200 hover:border-orange-600">
             Back to Lobby
           </button>
        </div>
      )}
    </div>
  );
};

export default GameView;