
import React from 'react';

interface HomeViewProps {
  onQuickPlay: () => void;
}

const HomeView: React.FC<HomeViewProps> = ({ onQuickPlay }) => {
  return (
    <div className="p-6">
      <div className="bg-gradient-to-br from-hb-surface to-[#000000] rounded-[2rem] p-8 text-white mb-8 shadow-xl border border-hb-border relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-[20px] font-black mb-2 italic tracking-tight uppercase text-hb-gold">Dashboard</h2>
          <p className="text-[13px] text-hb-muted mb-6 leading-relaxed font-medium">Ready to win? Select a table and start your session.</p>
          <div className="inline-flex items-center gap-3 bg-hb-gold/10 px-5 py-2.5 rounded-full text-[12px] font-black uppercase tracking-wider shadow-sm border border-hb-gold/30 text-hb-gold">
            <i className="fas fa-gift"></i> 10,000 ETB Weekly Prize
          </div>
        </div>
        <i className="fas fa-crown absolute -right-6 -top-6 text-hb-gold/5 text-[12rem] rotate-12"></i>
      </div>

      <div className="flex flex-col gap-5">
        <button 
          onClick={onQuickPlay}
          className="w-full bg-hb-surface border border-hb-border p-8 rounded-[2rem] shadow-sm flex items-center justify-between hover:border-hb-gold/30 transition-all active:scale-[0.98] group"
        >
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-[#121212] text-hb-gold rounded-[1.2rem] flex items-center justify-center text-3xl border border-hb-border group-hover:border-hb-gold/50 transition-colors">
              <i className="fas fa-bolt"></i>
            </div>
            <div className="text-left">
              <div className="font-black text-white text-lg">Quick Play</div>
              <div className="text-[12px] text-hb-muted font-bold uppercase tracking-wide">Instant Matchmaking</div>
            </div>
          </div>
          <i className="fas fa-chevron-right text-hb-muted opacity-40 text-xl group-hover:text-hb-gold transition-colors"></i>
        </button>

        <div className="bg-hb-surface border border-hb-border p-8 rounded-[2rem] shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-[12px] font-black text-hb-muted uppercase tracking-widest">Card Explorer</h3>
              <span className="text-[12px] text-hb-gold font-bold px-3 py-1 bg-hb-gold/10 rounded-lg border border-hb-gold/20">1-150 Range</span>
           </div>
           <p className="text-[13px] text-hb-muted opacity-80 mb-6 font-medium leading-relaxed">Select your lucky numbers. Browse the full collection of available cards.</p>
           <button 
             onClick={onQuickPlay}
             className="w-full py-5 bg-[#121212] rounded-[1.5rem] text-[12px] font-black text-hb-muted uppercase hover:text-white hover:border-hb-muted border border-hb-border transition-all shadow-inner"
           >
             View Available Cards
           </button>
        </div>
      </div>
    </div>
  );
};

export default HomeView;
