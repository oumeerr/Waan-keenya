
import React, { useState } from 'react';
import { generateCard, generateMiniCard } from '../constants';
import { APP_CONFIG } from '../config';

interface CardSelectionViewProps {
  betAmount: number;
  mode: 'classic' | 'mini';
  onSelectCard: (ids: number[]) => void;
}

const CardSelectionView: React.FC<CardSelectionViewProps> = ({ betAmount, mode, onSelectCard }) => {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [previewId, setPreviewId] = useState<number | null>(null);
  const cards = Array.from({ length: APP_CONFIG.GAME.TOTAL_CARDS_AVAILABLE }, (_, i) => i + 1);

  const toggleSelection = (id: number) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      if (newSet.size >= APP_CONFIG.GAME.MAX_CARDS_PER_SESSION) {
        alert(`Limit Reached! Maximum ${APP_CONFIG.GAME.MAX_CARDS_PER_SESSION} cards allowed.`);
        return;
      }
      newSet.add(id);
    }
    setSelectedIds(newSet);
    setPreviewId(null);
  };

  const getGrid = (id: number) => {
    return mode === 'mini' ? generateMiniCard(id) : generateCard(id);
  };

  const totalStake = selectedIds.size * betAmount;

  return (
    <div className="p-4 pb-28">
      {/* Minimized Hero Section */}
      <div className="bg-hb-navy p-5 rounded-[20px] text-white mb-4 shadow-md relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[16px] font-bold italic tracking-tight mb-2 uppercase">
            {mode === 'mini' ? 'Mini Arena' : 'Classic Arena'}
          </h2>
          
          <div className="flex gap-2 items-center">
            <div className="bg-white/10 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border border-white/5">
              Stake: {betAmount} ETB
            </div>
            <div className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase border border-white/10 ${selectedIds.size === APP_CONFIG.GAME.MAX_CARDS_PER_SESSION ? 'bg-red-500 text-white' : 'bg-hb-gold/80 text-hb-blueblack'}`}>
              {selectedIds.size} / {APP_CONFIG.GAME.MAX_CARDS_PER_SESSION} Selected
            </div>
          </div>
        </div>
        <i className="fas fa-th absolute -right-4 -top-4 text-white/5 text-6xl"></i>
      </div>

      {/* Compact Winning Tip */}
      {selectedIds.size < 2 && (
        <div className="bg-blue-50/50 border border-blue-100 p-2.5 rounded-xl flex items-center gap-3 mb-4 animate-in fade-in slide-in-from-top-1">
          <div className="w-6 h-6 rounded-full bg-hb-blue text-white flex items-center justify-center font-black text-[10px] shadow-sm">!</div>
          <p className="text-[10px] font-bold text-hb-blue/70 uppercase tracking-tight">Pro Tip: Select 2-3 cards for higher odds</p>
        </div>
      )}

      {/* Minimized Number Grid (8 columns) */}
      <div className="grid grid-cols-8 gap-1.5 bg-white/40 p-3 rounded-[20px] border border-hb-border shadow-inner justify-items-center">
        {cards.map(id => (
          <button
            key={id}
            onClick={() => setPreviewId(id)}
            className={`w-[36px] h-[36px] rounded-lg flex items-center justify-center font-black text-[14px] tracking-tighter active:scale-90 transition-all border
              ${selectedIds.has(id) 
                ? 'bg-hb-gold text-hb-blueblack border-hb-gold shadow-md' 
                : 'bg-white text-hb-navy border-hb-border hover:border-hb-blue/20'}`}
          >
            {id}
          </button>
        ))}
      </div>

      {/* Compact Preview Modal */}
      {previewId && (
        <div className="fixed inset-0 bg-hb-navy/60 backdrop-blur-sm z-[60] flex items-center justify-center p-6" onClick={() => setPreviewId(null)}>
          <div className="bg-hb-bg rounded-[24px] w-full max-w-[280px] overflow-hidden shadow-2xl animate-in zoom-in duration-150" onClick={e => e.stopPropagation()}>
            <div className="bg-hb-navy p-4 text-center text-white font-black text-[14px] uppercase flex justify-between items-center px-5">
              <span className="italic">Preview #{previewId}</span>
              <button onClick={() => setPreviewId(null)} className="w-6 h-6 flex items-center justify-center rounded-full bg-white/10">
                <i className="fas fa-times text-[10px]"></i>
              </button>
            </div>
            <div className="p-5">
               <div className={`grid ${mode === 'mini' ? 'grid-cols-3' : 'grid-cols-5'} gap-1 mb-5 bg-white p-3 rounded-xl border border-hb-border`}>
                  {getGrid(previewId).flat().map((num, i) => (
                    <div 
                      key={i} 
                      className={`aspect-square mini-card-cell border border-hb-border/50
                        ${num === 0 ? 'bg-hb-emerald/10 text-hb-emerald' : 'bg-[#1E1E1E] text-white border-white/5'}`}
                    >
                      {num === 0 ? '★' : num}
                    </div>
                  ))}
               </div>
               <button onClick={() => toggleSelection(previewId)} 
                className={`w-full h-12 rounded-xl font-black uppercase text-[12px] shadow-lg transition-all active:scale-[0.98] ${selectedIds.has(previewId) ? 'bg-red-500 text-white' : 'bg-hb-gold text-hb-blueblack'}`}
              >
                 {selectedIds.has(previewId) ? 'Deselect' : 'Stake Card'}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 w-full max-w-[320px] px-4 animate-in slide-in-from-bottom-4">
          <button 
            onClick={() => onSelectCard(Array.from(selectedIds))}
            className="w-full h-14 bg-hb-blueblack text-white px-5 rounded-2xl shadow-xl flex items-center justify-between group active:scale-[0.98] transition-all border border-white/10"
          >
            <div className="text-left">
              <div className="text-[14px] font-black text-hb-gold leading-none">{totalStake.toLocaleString()} <span className="text-[10px]">ETB</span></div>
              <div className="text-[8px] font-black uppercase opacity-60 tracking-widest mt-0.5">Total Stake</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase">Enter Arena</span>
              <i className="fas fa-arrow-right text-[10px]"></i>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default CardSelectionView;
