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
      tg.setHeaderColor('#020617'); // Match your theme

      const tgUser = tg.initDataUnsafe?.user;
      if (tgUser) {
        setUser(tgUser);
        syncUserAndFetchBalance(tgUser.id);
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const syncUserAndFetchBalance = async (userId: number) => {
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
      <div style={{ backgroundColor: '#020617', height: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>Loading Beteseb...</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#020617', minHeight: '100vh', color: 'white', padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '10px', marginBottom: '20px' }}>
        <h1 style={{ color: '#fbbf24', margin: 0 }}>BETESEB BINGO</h1>
        <p style={{ fontSize: '12px', color: '#94a3b8' }}>
          Welcome, {user?.username ? `@${user.username}` : user?.first_name || 'Guest'}
        </p>
      </header>

      <div style={{ backgroundColor: '#0f172a', padding: '20px', borderRadius: '15px', textAlign: 'center', border: '1px solid #fbbf2433' }}>
        <span style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>CURRENT BALANCE</span>
        <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>{balance} ETB</span>
      </div>

      <main style={{ marginTop: '30px' }}>
        {/* GAME CONTENT GOES HERE */}
        {!user && (
          <div style={{ backgroundColor: '#7f1d1d33', border: '1px solid #ef4444', padding: '15px', borderRadius: '10px', color: '#fca5a5', fontSize: '14px' }}>
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
  root.render(<App />); // Fixed: App must be inside the render call
}

export default App;
