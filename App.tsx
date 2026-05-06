import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';

// 1. SUPABASE CONFIGURATION
const SUPABASE_URL = 'https://swyviqimammonokkneqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eXZpcWltYW1tb25va2tuZXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Mjc2NTQsImV4cCI6MjA4NjIwMzY1NH0.Pb50OIcw0QdnI1WQl7oGLVZK7VWWcalRoEoLqQLKr8s';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 2. INITIALIZE TELEGRAM WEBAPP
    const tg = (window as any).Telegram?.WebApp;
    
    if (tg) {
      tg.ready();
      tg.expand();
      tg.setHeaderColor('#020617');

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
        fetchUserBalance(tgUser.id);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserBalance = async (userId: number) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (data) {
        setBalance(data.balance);
      }
    } catch (err) {
      console.error("Identity sync failed:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
        <p className="animate-pulse font-bold">Loading Beteseb Bingo...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white p-5 font-sans">
      <header className="border-b border-slate-800 pb-4 mb-6">
        <h1 className="text-2xl font-black text-[#fbbf24] m-0">BETESEB BINGO</h1>
        <p className="text-xs text-slate-400 mt-1">
          Welcome, {user?.username ? `@${user.username}` : user?.first_name || 'Guest'}
        </p>
      </header>

      <div className="bg-[#0f172a] p-6 rounded-2xl text-center border border-[#fbbf2433]">
        <span className="text-[10px] text-slate-400 block uppercase tracking-widest">Balance</span>
        <span className="text-3xl font-black text-[#10b981]">{balance} <span className="text-sm">ETB</span></span>
      </div>

      <main className="mt-8">
        {user ? (
          <div className="text-center">
             <button className="bg-[#fbbf24] text-[#020617] font-black py-4 px-10 rounded-xl shadow-lg active:scale-95 transition-transform">
                START BINGO
             </button>
          </div>
        ) : (
          <div className="bg-red-900/20 border border-red-500 p-4 rounded-xl text-red-200 text-sm">
            ⚠️ Please open this app via the Telegram Bot to sync your wallet.
          </div>
        )}
      </main>
    </div>
  );
};

// 3. RENDER THE APPLICATION
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(<App />);
}

export default App;