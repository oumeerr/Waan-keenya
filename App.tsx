
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabase';
import { View, Language, User } from './types';
import { TRANSLATIONS } from './constants';
import Sidebar from './components/Sidebar';
import WalletView from './components/WalletView';
import HomeView from './components/HomeView';
import LeaderboardView from './components/LeaderboardView';
import HistoryView from './components/HistoryView';
import ProfileView from './components/ProfileView';
import HowToPlayView from './components/HowToPlayView';
import BettingListView from './components/BettingListView';
import CardSelectionView from './components/CardSelectionView';
import GameView from './components/GameView';
import PromoGenerator from './components/PromoGenerator';
import SettingsView from './components/SettingsView';
import AllCardsView from './components/AllCardsView';
import PaymentProofView from './components/PaymentProofView';
import { APP_CONFIG } from './config';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [viewStack, setViewStack] = useState<View[]>(['home']);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [lang, setLang] = useState<Language>(Language.ENGLISH);
  const [currentBet, setCurrentBet] = useState<number>(50);
  const [selectedCardIds, setSelectedCardIds] = useState<number[]>([]);
  const [gameMode, setGameMode] = useState<'classic' | 'mini'>('classic');
  const [isGameActive, setIsGameActive] = useState(false);
  const [matchStartTime, setMatchStartTime] = useState<number | null>(null);

  // Default mock user
  const [user, setUser] = useState<User>({
    id: 'guest',
    username: 'Guest_Player',
    mobile: 'N/A',
    balance: 0,
    referrals: 0,
    wins: 0,
    photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest',
  });

  // User Profile Loader with Robust Fallback
  const loadUserProfile = async (authUser: any) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (profile) {
        setUser({
          id: authUser.id,
          email: authUser.email,
          username: profile.username || authUser.user_metadata?.username || 'Player',
          mobile: profile.mobile || authUser.user_metadata?.mobile || 'Verified',
          balance: profile.balance ?? 20, 
          referrals: profile.referrals ?? 0,
          wins: profile.wins ?? 0,
          photo: profile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
        });
      } else {
         // Fallback: Create profile client-side if missing (e.g., if SQL trigger didn't run)
         console.warn("Profile missing, attempting client-side creation...");
         const newProfile = {
             id: authUser.id,
             username: authUser.user_metadata?.username || `Player_${authUser.id.substring(0,4)}`,
             mobile: authUser.user_metadata?.mobile || 'Verified',
             balance: 20,
             avatar_url: authUser.user_metadata?.avatar_url,
             wins: 0,
             referrals: 0
         };
         
         const { error: insertError } = await supabase.from('profiles').insert(newProfile);
         
         if (!insertError) {
             setUser({
                 ...newProfile,
                 email: authUser.email,
                 photo: newProfile.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser.id}`,
             } as User);
         } else {
             console.error("Failed to create profile fallback", insertError);
         }
      }
    } catch (e) {
      console.error("Profile load fail", e);
    }
  };

  useEffect(() => {
    const initApp = async () => {
      // 1. Initialize Telegram WebApp
      const tg = (window as any).Telegram?.WebApp;
      if (tg) {
        tg.ready();
        tg.expand();
        try { tg.setHeaderColor('#1E1B4B'); } catch(e) {}
      }

      // 2. Check for existing session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        await loadUserProfile(session.user);
        setIsAuthenticated(true);
        setIsInitializing(false);
        return;
      }

      // 3. Auto Login / Register
      let userId = tg?.initDataUnsafe?.user?.id?.toString();
      
      // Fallback for browser/dev: Create or retrieve a persistent guest ID
      if (!userId) {
        userId = localStorage.getItem('hb_guest_id');
        if (!userId) {
          userId = Math.random().toString(36).substring(2, 15);
          localStorage.setItem('hb_guest_id', userId);
        }
      }

      // Deterministic credentials based on ID (for legacy/guest auth)
      const email = `${userId}@hulumbingo.com`;
      const password = `hb_secret_${userId}`; 

      // Attempt Quick Sign In (Client Side)
      const { data: signInData } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInData.session) {
        await loadUserProfile(signInData.session.user);
        setIsAuthenticated(true);
      } else {
        // User not found, need to register.
        let isSecureAuthSuccessful = false;

        // A. Try Secure Registration via Edge Function (Preferred for Telegram Users)
        if (tg?.initData) {
          try {
            console.log("Attempting secure registration via Edge Function...");
            const { data, error } = await supabase.functions.invoke('auth-user', {
              body: { tg_data: tg.initData }
            });

            if (!error && data?.session) {
               const { data: authData } = await supabase.auth.setSession(data.session);
               if (authData.session) {
                 await loadUserProfile(authData.session.user);
                 setIsAuthenticated(true);
                 isSecureAuthSuccessful = true;
               }
            } else {
               console.log("Edge function auth response invalid or failed", error);
            }
          } catch (err) {
            console.warn("Secure auth edge function unreachable, using fallback.", err);
          }
        }

        // B. Fallback: Client-Side Registration (Guest / Dev Mode)
        if (!isSecureAuthSuccessful) {
          console.log("Using client-side registration fallback...");
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                username: tg?.initDataUnsafe?.user?.first_name || `Player_${userId?.substring(0,4)}`,
                mobile: 'Verified',
                avatar_url: tg?.initDataUnsafe?.user?.photo_url,
                balance: 20
              }
            }
          });

          if (signUpData.session) {
             await loadUserProfile(signUpData.session.user);
             setIsAuthenticated(true);
          } else {
             // Absolute Fallback: Continue as Guest (No Auth)
             console.warn("Auth failed completely, continuing as guest UI", signUpError);
             setUser(prev => ({
               ...prev,
               username: tg?.initDataUnsafe?.user?.first_name || 'Guest',
               photo: tg?.initDataUnsafe?.user?.photo_url || prev.photo
             }));
             setIsAuthenticated(true);
          }
        }
      }
      setIsInitializing(false);
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        loadUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const currentView = viewStack[viewStack.length - 1];
  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS.en[key] || key;

  const navigateTo = (view: View, reset = false) => {
    if (reset) {
      if (view === 'home') setViewStack(['home']);
      else setViewStack(['home', view]);
    } else {
      setViewStack(prev => [...prev, view]);
    }
    setSidebarOpen(false);
  };

  const goBack = () => {
    if (viewStack.length > 1) setViewStack(prev => prev.slice(0, -1));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSidebarOpen(false);
    setViewStack(['home']);
    window.location.reload(); 
  };

  const handleStartGame = async (cardIds: number[]) => {
    const totalStake = cardIds.length * currentBet;
    if (user.balance < totalStake) {
      alert(`Insufficient balance! Total entry fee is ${totalStake} ETB.`);
      return;
    }
    
    // Global synchronization logic: Round starts every minute (60s)
    const now = Date.now();
    const targetStartTime = Math.ceil(now / APP_CONFIG.GAME.GLOBAL_ROUND_INTERVAL_MS) * APP_CONFIG.GAME.GLOBAL_ROUND_INTERVAL_MS;
    
    // Deduct balance
    const newBalance = user.balance - totalStake;
    setUser(prev => ({ ...prev, balance: newBalance }));
    if (user.id !== 'guest') {
       await supabase.from('profiles').update({ balance: newBalance }).eq('id', user.id);
    }
    
    setSelectedCardIds(cardIds);
    setMatchStartTime(targetStartTime);
    setIsGameActive(true);
    navigateTo('game');
  };

  if (isInitializing) {
     return (
       <div className="flex flex-col items-center justify-center h-screen w-full bg-[#1E1B4B] text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#2E1065] to-[#0F172A] opacity-80"></div>
          <div className="relative z-10 flex flex-col items-center animate-in fade-in duration-700">
             <div className="w-16 h-16 border-4 border-hb-gold/30 border-t-hb-gold rounded-full animate-spin mb-6 shadow-[0_0_20px_rgba(255,215,0,0.3)]"></div>
             <div className="w-24 h-24 mb-4 rounded-full bg-white flex items-center justify-center shadow-2xl relative border-4 border-white overflow-hidden">
                 <img src={APP_CONFIG.ASSETS.LOGO_URL} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                 <span className="absolute inset-0 flex items-center justify-center text-hb-navy font-black text-2xl italic" style={{ display: 'none' }}>BB</span>
             </div>
             <h1 className="text-xl font-black italic tracking-tighter uppercase mb-2 text-hb-gold drop-shadow-lg">Beteseb Bet</h1>
             <div className="text-[10px] font-bold uppercase tracking-[0.3em] text-hb-muted animate-pulse">Entering Arena...</div>
          </div>
       </div>
     );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-transparent text-white shadow-2xl overflow-hidden relative font-sans">
      <div className="z-30 shadow-md sticky top-0 w-full bg-hb-surface/80 backdrop-blur-md border-b border-hb-border/50">
        <div className="max-w-md mx-auto">
          <header className="px-5 py-4 flex items-center justify-between h-[70px]">
            <div className="w-12 flex justify-start">
              {viewStack.length > 1 ? (
                <button onClick={goBack} className="touch-target -ml-2 text-2xl text-hb-muted active:scale-90 transition-transform hover:text-hb-gold">
                  <i className="fas fa-arrow-left"></i>
                </button>
              ) : (
                <button onClick={() => setSidebarOpen(true)} className="touch-target -ml-2 text-2xl text-hb-muted active:scale-90 transition-transform hover:text-white">
                  <i className="fas fa-bars"></i>
                </button>
              )}
            </div>
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <span className="font-black text-xl italic tracking-tighter text-white drop-shadow-md">BETESEB BET BINGO</span>
              <div className="bg-hb-gold text-hb-blueblack px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter shadow-sm">
                Live Multiplayer Arena
              </div>
            </div>
            <div className="flex flex-col items-end w-12 min-w-[85px]">
              <span className="text-[9px] text-hb-muted uppercase font-bold tracking-widest mb-1">Balance</span>
              <div className="flex items-center gap-1 bg-hb-navy/50 px-3 py-1.5 rounded-xl border border-hb-border/50">
                <span className="font-bold text-hb-gold text-[14px] drop-shadow-sm">{user.balance.toLocaleString()}</span>
              </div>
            </div>
          </header>
        </div>
      </div>

      <main className="flex-1 overflow-y-auto pb-28 w-full bg-transparent">
        <div className="max-w-md mx-auto min-h-full">
          {currentView === 'home' && <HomeView onQuickPlay={() => navigateTo('betting-list')} />}
          {currentView === 'wallet' && <WalletView user={user} setUser={setUser} />}
          {currentView === 'leaderboard' && <LeaderboardView />}
          {currentView === 'history' && <HistoryView user={user} />}
          {currentView === 'profile' && <ProfileView user={user} setUser={setUser} />}
          {currentView === 'how-to-play' && <HowToPlayView />}
          {currentView === 'all-cards' && <AllCardsView onQuickPlay={(id, m) => { setGameMode(m); setCurrentBet(50); setSelectedCardIds([id]); navigateTo('betting-list'); }} />}
          {currentView === 'betting-list' && <BettingListView mode={gameMode} onModeChange={setGameMode} onSelectBet={(amt) => { setCurrentBet(amt); navigateTo('card-selection'); }} />}
          {currentView === 'card-selection' && <CardSelectionView betAmount={currentBet} mode={gameMode} onSelectCard={handleStartGame} />}
          {currentView === 'game' && selectedCardIds.length > 0 && matchStartTime !== null && (
            <GameView 
              cardIds={selectedCardIds} 
              betAmount={currentBet}
              mode={gameMode}
              user={user} 
              setUser={setUser}
              matchStartTime={matchStartTime}
              onClose={() => { setIsGameActive(false); navigateTo('home', true); }} 
            />
          )}
          {currentView === 'promo' && <PromoGenerator />}
          {currentView === 'settings' && <SettingsView />}
          {currentView === 'payment-proof' && <PaymentProofView />}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 w-full bg-hb-surface/90 backdrop-blur-xl border-t border-hb-border/50 z-40 pb-safe shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 py-4">
          <FooterItem icon="fa-wallet" label={t('wallet')} active={currentView === 'wallet'} onClick={() => navigateTo('wallet', true)} />
          <FooterItem icon="fa-trophy" label={t('leaderboard')} active={currentView === 'leaderboard'} onClick={() => navigateTo('leaderboard', true)} />
          <div className="relative -mt-14">
            <button 
              onClick={() => { if (isGameActive) navigateTo('game', true); else navigateTo('betting-list', true); }}
              className={`w-[56px] h-[56px] bg-hb-gold rounded-full border-[4px] border-hb-navy shadow-[0_0_20px_rgba(255,215,0,0.4)] flex items-center justify-center text-hb-blueblack text-2xl transition-all active:scale-90 hover:brightness-110`}
            >
              <i className={`fas ${isGameActive ? 'fa-external-link-alt' : 'fa-play'}`}></i>
            </button>
          </div>
          <FooterItem icon="fa-history" label={t('history')} active={currentView === 'history'} onClick={() => navigateTo('history', true)} />
          <FooterItem icon="fa-question-circle" label={t('howToPlay')} active={currentView === 'how-to-play'} onClick={() => navigateTo('how-to-play', true)} />
        </div>
      </nav>

      {isSidebarOpen && <Sidebar user={user} currentLang={lang} onLangChange={setLang} onClose={() => setSidebarOpen(false)} onNavigate={(v) => navigateTo(v, true)} onLogout={handleLogout} />}
    </div>
  );
};

const FooterItem: React.FC<{ icon: string; label: string; active: boolean; onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`flex flex-col items-center justify-center flex-1 transition-all ${active ? `text-hb-gold scale-105` : 'text-hb-muted hover:text-white'}`}>
    <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-0.5 transition-all ${active ? 'bg-hb-gold/10' : 'bg-transparent'}`}>
      <i className={`fas ${icon} text-[20px]`}></i>
    </div>
    <span className="text-[9px] font-bold uppercase tracking-tight">{label}</span>
  </button>
);

export default App;
