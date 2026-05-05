import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuration constants
const SUPABASE_URL = 'https://swyviqimammonokkneqk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eXZpcWltYW1tb25va2tuZXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Mjc2NTQsImV4cCI6MjA4NjIwMzY1NH0.Pb50OIcw0QdnI1WQl7oGLVZK7VWWcalRoEoLqQLKr8s';

// Initialize Supabase Client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function App() {
  const [tgUser, setTgUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 1. Access the Telegram WebApp Identity
    const tg = (window as any).Telegram?.WebApp;
    
    if (tg) {
      tg.ready();
      tg.expand();
      
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTgUser(user);
        fetchUserBalance(user.id);
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
      console.error("Error fetching balance:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-hb-navy">
        <div className="animate-bounce text-hb-gold font-bold">Loading Beteseb Bingo...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-game-gradient text-white p-4">
      {/* Identity-Linked Header */}
      <header className="flex justify-between items-center bg-hb-navy/60 p-4 rounded-2xl border border-hb-border shadow-xl">
        <div className="flex flex-col">
          <h1 className="text-xl font-black text-hb-gold tracking-tight">BETESEB BINGO</h1>
          <p className="text-xs text-hb-muted font-medium">
            {tgUser ? `Welcome, ${tgUser.first_name}` : "Open in Telegram"}
          </p>
        </div>

        <div className="text-right bg-hb-surface/80 p-2 px-4 rounded-xl border border-hb-gold/20">
          <span className="text-[10px] text-hb-muted block uppercase font-black tracking-widest">Balance</span>
          <span className="text-xl font-black text-hb-emerald">{balance} <span className="text-xs">ETB</span></span>
        </div>
      </header>

      {/* Game Content */}
      <main className="mt-10 flex flex-col items-center">
        {tgUser ? (
          <div className="text-center">
             <div className="mb-6 bg-hb-surface p-6 rounded-3xl border-2 border-hb-border shadow-2xl">
                <i className="fa-solid fa-dice text-5xl text-hb-gold mb-4"></i>
                <h2 className="text-2xl font-black mb-2">Ready to Play?</h2>
                <p className="text-hb-muted text-sm px-4">Your account is synced and ready for the next round.</p>
             </div>
             
             {/* Add your Bingo Grid Component Here */}
             <button className="bg-hb-gold text-hb-navy font-black py-4 px-10 rounded-2xl shadow-lg active:scale-95 transition-transform">
                START NEW GAME
             </button>
          </div>
        ) : (
          <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-2xl text-center">
            <p className="font-bold text-red-200">Identity Error</p>
            <p className="text-sm">Please launch the app via the official Telegram Bot.</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
