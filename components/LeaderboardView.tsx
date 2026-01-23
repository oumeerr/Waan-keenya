
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

interface LeaderboardEntry {
  username: string;
  balance: number;
  rank: number;
  prize: string;
}

const LeaderboardView: React.FC = () => {
  const [tab, setTab] = useState<'daily' | 'weekly'>('weekly');
  const [leaders, setLeaders] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [tab]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, balance')
        .order('balance', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (data) {
        const formattedData = data.map((profile, index) => {
           let prize = '100 ETB';
           if (index === 0) prize = '4,000 ETB';
           if (index === 1) prize = '2,500 ETB';
           if (index === 2) prize = '1,500 ETB';
           if (index > 2) prize = '500 ETB';

           return {
             username: profile.username || 'Anonymous',
             balance: profile.balance,
             rank: index + 1,
             prize
           };
        });
        setLeaders(formattedData);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="bg-orange-500 p-8 rounded-[2.5rem] text-white mb-6 shadow-xl text-center relative overflow-hidden">
        <h2 className="text-2xl font-black mb-1 italic tracking-tighter uppercase">Hall of Fame</h2>
        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">Our Top Earners</p>
        <div className="mt-4 flex justify-center gap-2">
          <div className="w-16 h-1 bg-white/20 rounded-full"></div>
          <div className="w-6 h-1 bg-white rounded-full"></div>
          <div className="w-16 h-1 bg-white/20 rounded-full"></div>
        </div>
        <i className="fas fa-trophy absolute -left-8 -bottom-8 text-white/10 text-[10rem] rotate-12"></i>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl">
        <button 
          onClick={() => setTab('daily')}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${tab === 'daily' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
        >
          Top Balances
        </button>
        <button 
          onClick={() => setTab('weekly')}
          className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition-all ${tab === 'weekly' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-400'}`}
        >
          Weekly Giants
        </button>
      </div>

      <div className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm min-h-[200px]">
        {loading ? (
          <div className="p-10 flex justify-center">
            <i className="fas fa-spinner fa-spin text-orange-500 text-2xl"></i>
          </div>
        ) : leaders.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-xs font-bold">No players found.</div>
        ) : (
          leaders.map((l, i) => (
            <div key={i} className={`flex items-center gap-4 p-5 border-b border-gray-50 last:border-0 ${i === 0 ? 'bg-orange-50/30' : ''}`}>
               <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-sm
                 ${l.rank === 1 ? 'bg-yellow-400 text-hb-blueblack' : 
                   l.rank === 2 ? 'bg-gray-200 text-gray-600' : 
                   l.rank === 3 ? 'bg-orange-300 text-hb-blueblack' : 'bg-gray-50 text-gray-300'}`}>
                 {l.rank}
               </div>
               <div className="flex-1">
                 <div className="font-black text-gray-800 text-sm tracking-tight">{l.username}</div>
                 <div className="text-[9px] text-gray-400 font-bold uppercase">{l.balance.toLocaleString()} ETB Balance</div>
               </div>
               <div className="text-right">
                  <div className="text-sm font-black text-orange-500">{l.prize}</div>
                  <div className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter">Est. Reward</div>
               </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-[2rem] border border-blue-100">
        <p className="text-[10px] text-blue-600 font-bold text-center leading-relaxed">
          The Hall of Fame rewards the most active players! <br/> 
          Rankings are based on current wallet balance.
        </p>
      </div>
    </div>
  );
};

export default LeaderboardView;
