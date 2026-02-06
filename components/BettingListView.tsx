import React, { useState, useEffect } from 'react';
import { BET_AMOUNTS, MINI_BET_AMOUNTS } from '../constants';
import { APP_CONFIG } from '../config';

interface BettingListViewProps {
  mode: 'classic' | 'mini';
  onModeChange: (mode: 'classic' | 'mini') => void;
  onSelectBet: (amount: number) => void;
}

const BettingListView: React.FC<BettingListViewProps> = ({ mode, onModeChange, onSelectBet }) => {
  const currentAmounts = mode === 'mini' ? MINI_BET_AMOUNTS : BET_AMOUNTS;
  const [globalCountdown, setGlobalCountdown] = useState(0);

  useEffect(() => {
    const updateCountdown = () => {
      const now = Date.now();
      const nextRound = Math.ceil(now / APP_CONFIG.GAME.GLOBAL_ROUND_INTERVAL_MS) * APP_CONFIG.GAME.GLOBAL_ROUND_INTERVAL_MS;
      setGlobalCountdown(Math.ceil((nextRound - now) / 1000));
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="p-5">
      {/* Global Sync Header */}
      <div className="bg-hb-surface border border-hb-gold/30 p-4 rounded-[2rem] mb-6 flex items-center justify-between shadow-lg animate-in fade-in zoom-in duration-500">
         <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-2xl bg-hb-gold/10 flex items-center justify-center">
             <i className="fas fa-clock text-hb-gold animate-pulse"></i>
           </div>
           <div>
             <span className="text-[10px] font-black text-hb-muted uppercase tracking-widest block mb-0.5">Next Live Arena</span>
             <span className="text-[18px] font-black text-white italic">ROUND STARTING</span>
           </div>
         </div>
         <div className="bg-hb-navy px-5 py-2 rounded-2xl border border-hb-border flex flex-col items-center min-w-[80px]">
           <span className="text-[16px] font-black text-hb-gold tabular-nums leading-none">{globalCountdown}s</span>
           <span className="text-[8px] font-black text-hb-muted uppercase tracking-tighter mt-1">Syncing...</span>
         </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-hb-blue mb-1.5 italic tracking-tight uppercase">
            {mode === 'mini' ? 'Mini Bingo' : 'Classic Bingo'}
          </h2>
          <p className="text-[11px] text-hb-muted font-bold uppercase tracking-widest">
            {mode === 'mini' ? 'Fast Games, Low Risk' : 'Standard Rooms, Big Wins'}
          </p>
        </div>
        
        <button 
          onClick={() => onModeChange(mode === 'classic' ? 'mini' : 'classic')}
          className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all shadow-sm border-2 ${mode === 'mini' ? 'bg-hb-blue text-white border-hb-blue' : 'bg-white text-hb-gold border-hb-gold/20'}`}
        >
          {mode === 'classic' ? 'Play Mini' : 'Play Classic'}
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {currentAmounts.map(amt => (
          <button 
            key={amt}
            onClick={() => onSelectBet(amt)}
            className="group flex items-center justify-between bg-white border border-hb-border p-5 rounded-[2.5rem] shadow-sm hover:shadow-md hover:border-hb-blue/10 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-sm font-black transition-colors ${mode === 'mini' ? 'bg-orange-50 text-hb-gold' : 'bg-blue-50 text-hb-blue group-hover:bg-hb-blue group-hover:text-white'}`}>
                {amt >= 1000 ? (amt / 1000) + 'K' : amt}
              </div>
              <div className="text-left">
                <div className="font-black text-hb-navy text-sm">{amt} ETB Entry Fee</div>
                <div className="text-[10px] text-hb-muted font-bold uppercase tracking-wide">{amt < 20 ? 'Fast Play' : amt < 100 ? 'Regular Room' : 'High Roller'}</div>
              </div>
            </div>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform ${mode === 'mini' ? 'bg-hb-blue text-white' : 'bg-hb-gold text-hb-blueblack'}`}>
              <i className="fas fa-play ml-0.5 text-[10px]"></i>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 bg-blue-50/50 p-6 rounded-[2.5rem] border border-blue-100/50 text-center">
        <h4 className="text-hb-blue font-black text-[12px] mb-2 uppercase tracking-widest italic">
          {mode === 'classic' ? 'Mini Mode Highlights' : 'Classic Mode Highlights'}
        </h4>
        <p className="text-[11px] text-hb-blue/60 font-medium leading-relaxed">
          {mode === 'classic' 
            ? '3x3 Grids • 1-30 Pool • Instant Wins' 
            : '5x5 Grids • 1-75 Pool • Massive Pots'}
        </p>
      </div>
    </div>
  );
};

export default BettingListView;