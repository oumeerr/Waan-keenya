
import React, { useEffect, useState, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://swyviqimammonokkneqk.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3eXZpcWltYW1tb25va2tuZXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA2Mjc2NTQsImV4cCI6MjA4NjIwMzY1NH0.Pb50OIcw0QdnI1WQl7oGLVZK7VWWcalRoEoLqQLKr8s';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const STAKE_PRICE = 10;
const LOBBY_COUNTDOWN_DURATION = 59;
const CALL_INTERVAL = 3000;
const END_GAME_DELAY = 5000;

const App = () => {
  const [tgUser, setTgUser] = useState<any>(null);
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [gameState, setGameState] = useState<'loading' | 'lobby' | 'playing' | 'ended'>('loading');
  const [countdown, setCountdown] = useState(LOBBY_COUNTDOWN_DURATION);
  const [hasStaked, setHasStaked] = useState(false);
  const [calledNumbers, setCalledNumbers] = useState<number[]>([]);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [stakeLoading, setStakeLoading] = useState(false);
  
  // Bingo Grid State
  const [userCard, setUserCard] = useState<number[]>([]);
  const [markedIndices, setMarkedIndices] = useState<number[]>([]);

  const lobbyIntervalRef = useRef<any>(null);
  const gameIntervalRef = useRef<any>(null);
  const hasStakedRef = useRef(false); // Ref to track staking for the timer closure

  useEffect(() => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();
      const user = tg.initDataUnsafe?.user;
      if (user) {
        setTgUser(user);
        fetchUserBalance(user.id);
        startLobbyCountdown();
      } else {
        tg.close();
      }
    } else {
      setLoading(false);
    }
    return () => {
      clearInterval(lobbyIntervalRef.current);
      clearInterval(gameIntervalRef.current);
    };
  }, []);

  const fetchUserBalance = async (userId: number) => {
    try {
      const { data } = await supabase.from('profiles').select('balance').eq('id', userId).single();
      if (data) setBalance(data.balance);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const generateBingoCard = () => {
    const card = [];
    while(card.length < 25) {
      const r = Math.floor(Math.random() * 75) + 1;
      if(card.indexOf(r) === -1) card.push(r);
    }
    setUserCard(card);
    setMarkedIndices([]);
  };

  const startLobbyCountdown = () => {
    setGameState('lobby');
    setCountdown(LOBBY_COUNTDOWN_DURATION);
    setHasStaked(false);
    hasStakedRef.current = false;
    setCalledNumbers([]);
    setCurrentNumber(null);
    generateBingoCard();

    if (lobbyIntervalRef.current) clearInterval(lobbyIntervalRef.current);
    lobbyIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(lobbyIntervalRef.current);
          if (hasStakedRef.current) startBingoGame();
          else startLobbyCountdown();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleStake = async () => {
    if (!tgUser || stakeLoading) return;
    if (balance < STAKE_PRICE) return alert("Insufficient Balance!");

    setStakeLoading(true);
    try {
      const { data, error } = await supabase.rpc('deduct_balance', {
        user_id: tgUser.id,
        amount: STAKE_PRICE,
      });
      if (error) throw error;
      setBalance(data);
      setHasStaked(true);
      hasStakedRef.current = true;
    } catch (err: any) {
      alert("Stake failed: " + err.message);
    } finally {
      setStakeLoading(false);
    }
  };

  const checkWin = (currentMarked: number[]) => {
    // 4 Corners indices in a 5x5 grid: 0 (Top-L), 4 (Top-R), 20 (Bottom-L), 24 (Bottom-R)
    const corners = [0, 4, 20, 24];
    const isWinner = corners.every(index => currentMarked.includes(index));
    if (isWinner) stopGame();
  };

  const toggleMark = (index: number) => {
    const num = userCard[index];
    if (calledNumbers.includes(num) && !markedIndices.includes(index)) {
      const newMarked = [...markedIndices, index];
      setMarkedIndices(newMarked);
      checkWin(newMarked);
    }
  };

  const startBingoGame = () => {
    setGameState('playing');
    const deck = Array.from({ length: 75 }, (_, i) => i + 1).sort(() => Math.random() - 0.5);
    let index = 0;

    gameIntervalRef.current = setInterval(() => {
      if (index >= 75) { stopGame(); return; }
      const nextNum = deck[index];
      setCurrentNumber(nextNum);
      setCalledNumbers(prev => [...prev, nextNum]);
      index++;
    }, CALL_INTERVAL);
  };

  const stopGame = () => {
    clearInterval(gameIntervalRef.current);
    setGameState('ended');
    setTimeout(() => { startLobbyCountdown(); }, END_GAME_DELAY);
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-slate-900">
      <div className="animate-bounce text-amber-400 font-black">INITIALIZING BETESEB...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-purple-900 to-slate-900 text-white font-sans pb-10">
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-purple-500/30 p-4 shadow-lg">
        <div className="flex justify-between items-center max-w-md mx-auto">
          <div>
            <h1 className="text-2xl font-black text-amber-400 leading-none">BETESEB</h1>
            <p className="text-[10px] text-gray-400 uppercase mt-1">Bingo • {tgUser?.first_name}</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-4 py-1 rounded-xl text-right">
            <span className="text-[9px] text-emerald-400 block font-bold">WALLET</span>
            <span className="text-xl font-black text-emerald-400">{balance} ETB</span>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 pt-10">
        {gameState === 'lobby' && (
          <div className="text-center py-10">
            <div className="text-8xl font-black text-amber-400 mb-8">{countdown}</div>
            {!hasStaked ? (
              <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/10">
                <h2 className="text-xl font-bold mb-2">Next Round</h2>
                <button onClick={handleStake} disabled={stakeLoading || balance < STAKE_PRICE}
                  className="w-full py-4 rounded-2xl font-black text-lg bg-gradient-to-r from-amber-400 to-amber-600 text-slate-900">
                  {stakeLoading ? "WAIT..." : "STAKE 10 ETB"}
                </button>
              </div>
            ) : (
              <div className="bg-emerald-500/20 p-6 rounded-3xl animate-pulse">
                <p className="text-emerald-400 font-black text-xl">✓ REGISTERED</p>
              </div>
            )}
          </div>
        )}

        {gameState === 'playing' && (
          <div className="text-center">
            <div className="w-32 h-32 bg-amber-500 rounded-full mx-auto flex items-center justify-center text-5xl font-black text-slate-900 mb-8 shadow-xl">
              {currentNumber || "--"}
            </div>
            <div className="grid grid-cols-5 gap-2 bg-slate-900/40 p-3 rounded-xl border border-white/10">
              {userCard.map((num, i) => (
                <div key={i} onClick={() => toggleMark(i)}
                  className={`h-12 flex items-center justify-center rounded-lg font-bold text-sm cursor-pointer transition-all
                    ${markedIndices.includes(i) ? 'bg-amber-500 text-slate-900 scale-95' : 'bg-slate-800 text-white hover:bg-slate-700'}
                    ${calledNumbers.includes(num) && !markedIndices.includes(i) ? 'border-2 border-amber-400 animate-pulse' : 'border border-transparent'}`}>
                  {num}
                </div>
              ))}
            </div>
          </div>
        )}

        {gameState === 'ended' && (
          <div className="text-center py-20 bg-slate-800/80 rounded-3xl border-2 border-amber-400 shadow-2xl">
            <h2 className="text-5xl font-black text-amber-400 mb-4 animate-bounce">BINGO!</h2>
            <p className="text-gray-300">New round starting soon...</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
