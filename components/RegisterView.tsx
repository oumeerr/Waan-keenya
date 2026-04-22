import React, { useState } from 'react';
import { APP_CONFIG } from '../config';

interface RegisterViewProps {
  onRegister: (phone: string, firstName: string) => Promise<void>;
}

const RegisterView: React.FC<RegisterViewProps> = ({ onRegister }) => {
  const [loading, setLoading] = useState(false);

  const handleShareContact = () => {
    const tg = (window as any).Telegram?.WebApp;
    if (tg?.requestContact) {
      tg.requestContact((shared: boolean, reqId: string) => {
        if (shared) {
          setLoading(true);
          // Proceed to register after user agrees to share contact
          onRegister('Shared_via_Telegram', tg?.initDataUnsafe?.user?.first_name || 'Player');
        } else {
          setLoading(false);
        }
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[#1E1B4B] text-white overflow-hidden p-6 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-[#2E1065] to-[#0F172A] opacity-80"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center bg-hb-surface/50 p-8 rounded-3xl border border-hb-border shadow-2xl backdrop-blur-sm">
        <div className="w-24 h-24 mb-6 rounded-full bg-white flex items-center justify-center border-4 border-white overflow-hidden shadow-[0_0_20px_rgba(255,215,0,0.3)]">
           <img src={APP_CONFIG.ASSETS.LOGO_URL} className="w-full h-full object-cover" />
        </div>
        
        <h1 className="text-3xl font-black italic tracking-tighter uppercase mb-2 text-hb-gold drop-shadow-md">Welcome!</h1>
        <p className="text-sm font-medium text-hb-muted mb-8 text-center leading-relaxed">
          To join the Beteseb Bet Bingo live game, we need to verify your account via Telegram.
        </p>
        
        <button 
          onClick={handleShareContact}
          disabled={loading}
          className="w-full bg-[#3390ec] hover:bg-[#2A7BCA] text-white py-4 rounded-xl font-bold text-[15px] shadow-lg transition-transform active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
        >
          <i className="fab fa-telegram-plane text-xl"></i>
          {loading ? 'Creating Account...' : 'Share Contact to Register'}
        </button>

        <button 
          onClick={() => onRegister('Verified', 'Guest')}
          disabled={loading}
          className="mt-4 text-xs font-bold uppercase tracking-widest text-hb-muted hover:text-white transition-colors"
        >
          Continue as Guest
        </button>
      </div>
    </div>
  );
};

export default RegisterView;
