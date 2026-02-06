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
import LoginView from './components/LoginView';
import { APP_CONFIG } from './config';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setIsAuthenticated(true);
        loadUserProfile(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setIsAuthenticated(true);
        loadUserProfile(session.user);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      }
    } catch (e) {
      console.error("Profile load fail", e);
    }
  };

  if (!isAuthenticated) {
    return <LoginView onLogin={() => {
      setIsAuthenticated(true);
      setUser(prev => ({...prev, username: 'TelegramUser', balance: 20}));
    }} />;
  }

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
    setIsAuthenticated(false);
  };

  const handleStartGame = async (cardIds: number[]) => {
    const totalStake = cardIds.length * currentBet;
    if (user.balance < totalStake) {
      alert(`Insufficient balance! Total entry fee is ${totalStake} ETB.`);
      return;
    }
    
    // Global synchronization logic: Round starts every minute (60s)
    // The match always starts at the beginning of the next minute
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

  return (
    <div className="flex flex-col h-screen w-full bg-hb-bg text-white shadow-2xl overflow-hidden relative font-sans">
      <div className="z-30 shadow-md sticky top-0 w-full bg-[#1A1A1A] border-b border-hb-border/50">
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
              <span className="font-black text-xl italic tracking-tighter text-white">BETESEB BET BINGO</span>
              <div className="bg-hb-gold text-hb-blueblack px-3 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-tighter shadow-sm">
                Live Multiplayer Arena
              </div>
            </div>
            <div className="flex flex-col items-end w-12 min-w-[85px]">
              <span className="text-[9px] text-hb-muted uppercase font-bold tracking-widest mb-1">Balance</span>
              <div className="flex items-center gap-1 bg-hb-surface px-3 py-1.5 rounded-xl border border-hb-border">
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
          {currentView === 'history' && <HistoryView />}
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

      <nav className="fixed bottom-0 left-0 right-0 w-full bg-[#1A1A1A]/95 backdrop-blur-xl border-t border-hb-border z-40 pb-safe shadow-2xl">
        <div className="max-w-md mx-auto flex items-center justify-around px-2 py-4">
          <FooterItem icon="fa-wallet" label={t('wallet')} active={currentView === 'wallet'} onClick={() => navigateTo('wallet', true)} />
          <FooterItem icon="fa-trophy" label={t('leaderboard')} active={currentView === 'leaderboard'} onClick={() => navigateTo('leaderboard', true)} />
          <div className="relative -mt-14">
            <button 
              onClick={() => { if (isGameActive) navigateTo('game', true); else navigateTo('betting-list', true); }}
              className={`w-[56px] h-[56px] bg-hb-gold rounded-full border-[4px] border-hb-bg shadow-[0_0_20px_rgba(255,215,0,0.3)] flex items-center justify-center text-hb-blueblack text-2xl transition-all active:scale-90 hover:brightness-110`}
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