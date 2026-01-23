
import React, { useState, useMemo } from 'react';
import { generateCard, generateMiniCard } from '../constants';
import { APP_CONFIG } from '../config';

interface AllCardsViewProps {
  onQuickPlay: (cardId: number, mode: 'classic' | 'mini') => void;
}

const AllCardsView: React.FC<AllCardsViewProps> = ({ onQuickPlay }) => {
  const [mode, setMode] = useState<'classic' | 'mini'>('classic');
  const cardIds = Array.from({ length: APP_CONFIG.GAME.TOTAL_CARDS_AVAILABLE }, (_, i) => i + 1);

  const allCards = useMemo(() => {
    return cardIds.map(id => ({
      id,
      grid: mode === 'mini' ? generateMiniCard(id) : generateCard(id)
    }));
  }, [mode]);

  return (
    <div className="min-h-full bg-hb-bg pb-20">
      {/* Minimized Header */}
      <div className="sticky top-0 z-20 bg-hb-bg/90 backdrop-blur-md border-b border-hb-border px-3 py-2">
        <div className="flex items-center justify-between gap-3">
          <div className="shrink-0">
            <h2 className="text-[12px] font-black text-hb-navy uppercase tracking-tight">Gallery</h2>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-lg shrink-0">
             <button 
               onClick={() => setMode('classic')}
               className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase transition-all ${mode === 'classic' ? 'bg-white text-hb-blue shadow-sm' : 'text-hb-muted'}`}
             >
               Classic
             </button>
             <button 
               onClick={() => setMode('mini')}
               className={`px-2.5 py-1 rounded-md text-[8px] font-black uppercase transition-all ${mode === 'mini' ? 'bg-white text-hb-gold shadow-sm' : 'text-hb-muted'}`}
             >
               Mini
             </button>
          </div>
          <div className="relative flex-1 max-w-[120px]">
             <i className="fas fa-search absolute left-2 top-1/2 -translate-y-1/2 text-hb-muted/40 text-[9px]"></i>
             <input 
               type="number" 
               placeholder="Jump to..." 
               className="w-full h-7 pl-6 pr-2 bg-white border border-hb-border rounded-lg text-[9px] font-bold outline-none focus:border-hb-blue/30"
               onChange={(e) => {
                 const val = e.target.value;
                 if (val) {
                   const el = document.getElementById(`card-anchor-${val}`);
                   if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                 }
               }}
             />
          </div>
        </div>
      </div>

      {/* High Density Multi-Column Grid */}
      <div className="p-1.5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
        {allCards.map((card) => (
          <div 
            key={card.id} 
            id={`card-anchor-${card.id}`}
            className="bg-white rounded-xl border border-hb-border shadow-sm p-1.5 hover:shadow-md transition-shadow active:scale-[0.98] flex flex-col"
            onClick={() => onQuickPlay(card.id, mode)}
          >
            <div className="flex justify-between items-center mb-1 px-0.5">
               <span className="text-hb-navy font-black text-[9px] opacity-60">
                 #{card.id}
               </span>
               <i className="fas fa-play text-hb-blue/20 text-[7px]"></i>
            </div>

            <div className={`grid ${mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-0.5`}>
              {card.grid.flat().map((num, i) => (
                <div 
                  key={i} 
                  className={`aspect-square text-[8px] font-extrabold flex items-center justify-center rounded-[2px] border border-hb-border/20
                    ${num === 0 ? 'bg-hb-emerald/10 text-hb-emerald' : 'bg-[#1E1E1E] text-white border-white/5'}`}
                >
                  {num === 0 ? '★' : num}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center py-4 opacity-10">
        <p className="text-[7px] font-black uppercase tracking-[0.3em]">Full Deck Displayed</p>
      </div>
    </div>
  );
};

export default AllCardsView;
