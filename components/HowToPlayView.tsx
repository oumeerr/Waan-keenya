
import React from 'react';

const HowToPlayView: React.FC = () => {
  return (
    <div className="p-6 pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-hb-blue mb-1 italic tracking-tight uppercase">Master Guide</h2>
        <p className="text-[11px] text-hb-muted font-bold uppercase tracking-widest">Master the Waan Keenya Bingo Engine</p>
      </div>
      
      <div className="space-y-8">
        <div className="space-y-6">
          <Step 
            num="1" 
            title="High-Entropy Selection" 
            desc="Select cards from the 1-150 deck. Our new Entropy Engine ensures every card is mathematically distinct and hard to win early." 
          />
          <Step 
            num="2" 
            title="Arena Stakes" 
            desc="Confirm your stake (5 - 1000 ETB). Once the countdown begins, the game is guaranteed to start instantly." 
          />
          <Step 
            num="3" 
            title="The 15-Ball Rule" 
            desc="Due to our hard combinations, wins typically occur after ball 15. Track your progress bars on each card." 
          />
          <Step 
            num="4" 
            title="Diagonal Mastery" 
            desc="Hit any diagonal pattern corner-to-corner and tap BINGO to claim the pot. Auto-play mode is available!" 
          />
        </div>
        
        <div className="pt-8 border-t border-hb-border">
          <h3 className="text-xs font-black text-hb-brand-grey uppercase mb-6 tracking-[0.2em] italic flex items-center gap-2">
            <i className="fas fa-star text-hb-gold"></i> Valid Winning Patterns
          </h3>
          
          <div className="space-y-8">
            <PatternCard 
              name="Main Diagonal" 
              definition="Complete line from top-left to bottom-right or top-right to bottom-left."
              pattern={[
                [1, 0, 0, 0, 0],
                [0, 1, 0, 0, 0],
                [0, 0, 1, 0, 0],
                [0, 0, 0, 1, 0],
                [0, 0, 0, 0, 1]
              ]}
            />

            <PatternCard 
              name="Horizontal Row" 
              definition="Any single complete row of 5 numbers marked from left to right."
              pattern={[
                [1, 1, 1, 1, 1],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0]
              ]}
            />
            
            <PatternCard 
              name="Vertical Column" 
              definition="Any single complete column of 5 numbers marked from top to bottom."
              pattern={[
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0],
                [1, 0, 0, 0, 0]
              ]}
            />

            <PatternCard 
              name="Four Corners" 
              definition="Specifically marking the 4 extreme outer corners of your card."
              pattern={[
                [1, 0, 0, 0, 1],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [0, 0, 0, 0, 0],
                [1, 0, 0, 0, 1]
              ]}
            />
          </div>
        </div>
      </div>

      <div className="mt-12 p-8 bg-hb-navy rounded-[2.5rem] text-white text-center shadow-2xl border-4 border-hb-gold/20">
        <div className="flex justify-center gap-1 mb-4">
           {[...Array(5)].map((_, i) => <i key={i} className="fas fa-star text-hb-gold text-[10px]"></i>)}
        </div>
        <p className="text-[12px] font-black uppercase tracking-widest text-hb-gold mb-3 italic">Advanced Hard Mode</p>
        <p className="text-xs leading-relaxed font-medium opacity-80">
          "Our deck generation uses a high-entropy shuffle. This means numbers are spread widely across the 1-75 pool, significantly lowering the chance of accidental early wins."
        </p>
      </div>
    </div>
  );
};

const Step: React.FC<{ num: string; title: string; desc: string }> = ({ num, title, desc }) => (
  <div className="flex gap-5 group">
    <div className="w-12 h-12 rounded-[18px] bg-hb-navy text-hb-gold flex items-center justify-center font-black shrink-0 shadow-lg border-2 border-hb-gold/20 transition-transform group-hover:scale-110">
      {num}
    </div>
    <div>
      <h4 className="font-black text-hb-navy text-[14px] uppercase tracking-tight mb-1">{title}</h4>
      <p className="text-[11px] text-hb-muted font-semibold leading-relaxed">{desc}</p>
    </div>
  </div>
);

const PatternCard: React.FC<{ name: string; definition: string; pattern: number[][] }> = ({ name, definition, pattern }) => (
  <div className="bg-white p-6 rounded-[2.5rem] border border-hb-border shadow-md flex items-center gap-6 hover:border-hb-blue/30 transition-colors">
    <div className="grid grid-cols-5 gap-1.5 shrink-0 p-3 bg-hb-bg rounded-2xl border border-hb-border shadow-inner">
      {pattern.flat().map((cell, i) => (
        <div 
          key={i} 
          className={`w-3.5 h-3.5 rounded-sm ${cell === 1 ? 'bg-hb-gold shadow-[0_0_10px_rgba(249,115,22,0.5)]' : 'bg-slate-200'}`}
        />
      ))}
    </div>
    <div className="flex-1">
      <h4 className="font-black text-hb-navy text-[14px] uppercase italic mb-1 tracking-tight">{name}</h4>
      <p className="text-[11px] text-hb-muted leading-snug font-semibold">{definition}</p>
    </div>
  </div>
);

export default HowToPlayView;
