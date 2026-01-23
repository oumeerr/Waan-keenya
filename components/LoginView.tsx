
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface LoginViewProps {
  onLogin: () => void;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');

  const LOGO_URL = "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4a/6c/2e/4a6c2e37-122e-130f-2169-2810c9d94944/AppIcon-0-0-1x_U007emarketing-0-5-0-85-220.png/512x512bb.jpg";

  const handleTelegramAuth = async () => {
    setLoading(true);
    // Simulate Telegram Auth for demo purposes
    // In production: verify window.Telegram.WebApp.initData
    setTimeout(() => {
      setLoading(false);
      onLogin(); 
    }, 1500);
  };

  const handleEmailAuth = async () => {
    if (!email || !password) return alert("Please fill in all fields");
    
    if (mode === 'signup') {
      if (!username) return alert("Username is required for registration");
      if (!phone) return alert("Phone number is required for wallet access");
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { 
              username: username,
              mobile: phone,
              balance: 20, // Initial bonus changed to 20
              referrer: referralCode || null 
            } 
          }
        });
        if (error) throw error;

        // Explicitly sign out to prevent auto-login if the project has auto-confirm enabled
        if (data.session) {
          await supabase.auth.signOut();
        }

        alert("Registration Complete. Please Login.");
        setMode('login');
      } else {
        // Determine if input is email or phone for login
        const isPhone = /^[0-9+]+$/.test(email);
        const loginPayload = isPhone ? { phone: email, password } : { email, password };

        const { data, error } = await supabase.auth.signInWithPassword(loginPayload);
        
        if (error) {
           if (error.message.includes('Invalid login') || error.message.includes('credential')) {
             throw new Error("Invalid password or email / phone. Please enter correct password or phone number.");
           }
           throw error;
        }
      }
    } catch (error: any) {
      alert(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-hb-bg relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-gradient-to-b from-green-900/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="z-10 flex flex-col items-center text-center w-full max-w-sm">
        
        {/* Updated Logo Section using Telebirr Logo */}
        <div className="w-28 h-28 bg-white rounded-[2.5rem] shadow-[0_20px_40px_-10px_rgba(34,197,94,0.4)] flex items-center justify-center mb-6 relative overflow-hidden border-4 border-white/10">
           <img 
             src={LOGO_URL} 
             className="w-full h-full object-cover" 
             onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-[#22C55E]', 'to-[#166534]');
               e.currentTarget.parentElement!.innerHTML = '<span class="text-7xl font-black text-white italic drop-shadow-md">W</span>';
             }}
           />
        </div>

        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
          Waan Keenya Bingo
        </h1>
        <p className="text-hb-muted text-sm font-medium mb-8 max-w-[260px] leading-relaxed">
          The premium competitive bingo arena. <br/> Win weekly cash prizes securely.
        </p>

        {/* Auth Forms */}
        <div className="w-full bg-hb-surface border border-hb-border p-6 rounded-[24px] shadow-lg mb-6">
          <div className="flex bg-[#121212] p-1 rounded-xl mb-6">
             <button 
               onClick={() => setMode('login')}
               className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${mode === 'login' ? 'bg-[#22C55E] text-hb-blueblack shadow-sm' : 'text-hb-muted hover:text-white'}`}
             >
               Login
             </button>
             <button 
               onClick={() => setMode('signup')}
               className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${mode === 'signup' ? 'bg-[#22C55E] text-hb-blueblack shadow-sm' : 'text-hb-muted hover:text-white'}`}
             >
               Register
             </button>
          </div>

          <div className="space-y-4">
             {mode === 'signup' && (
               <>
                 <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">Username</label>
                    <input 
                      type="text" 
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="BingoKing" 
                      className="w-full input-human h-12 text-sm"
                    />
                 </div>
                 <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">Phone Number</label>
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="09..." 
                      className="w-full input-human h-12 text-sm"
                    />
                 </div>
                 <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">Referral Code (Optional)</label>
                    <input 
                      type="text" 
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      placeholder="Inviter's Username" 
                      className="w-full input-human h-12 text-sm"
                    />
                 </div>
               </>
             )}
             <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">
                  {mode === 'login' ? 'Email or Phone' : 'Email Address'}
                </label>
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={mode === 'login' ? "Email or Phone" : "you@example.com"}
                  className="w-full input-human h-12 text-sm"
                />
             </div>
             <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-hb-muted uppercase ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full input-human h-12 text-sm"
                />
             </div>

             <button 
               onClick={handleEmailAuth}
               disabled={loading}
               className="w-full h-12 bg-white text-hb-blueblack font-black text-xs uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 mt-2 hover:bg-gray-100 disabled:opacity-50"
             >
               {loading && <i className="fas fa-spinner fa-spin"></i>}
               {mode === 'login' ? 'Login' : 'Register'}
             </button>
          </div>
        </div>

        <div className="relative w-full mb-6 flex items-center justify-center">
           <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-hb-border"></div></div>
           <span className="relative bg-hb-bg px-3 text-[10px] font-bold text-hb-muted uppercase">OR</span>
        </div>

        <button 
          onClick={handleTelegramAuth}
          disabled={loading}
          className="w-full h-14 bg-[#24A1DE] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-[0_4px_15px_rgba(36,161,222,0.3)] active:scale-95 transition-all flex items-center justify-center gap-3 hover:brightness-110 disabled:opacity-70 disabled:cursor-wait"
        >
           <i className="fab fa-telegram-plane text-xl"></i>
           Sign In with Telegram Phone
        </button>

        <p className="mt-8 text-[10px] text-hb-muted/50 font-bold uppercase tracking-widest">
          Secure End-to-End Encryption
        </p>
      </div>
    </div>
  );
};

export default LoginView;
