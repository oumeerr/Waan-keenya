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

  // The new logo URL as requested from the provided image
  const LOGO_URL = "/logo.png"; 

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
              balance: 20,
              referrer: referralCode || null 
            } 
          }
        });
        if (error) throw error;

        if (data.session) {
          await supabase.auth.signOut();
        }

        alert("Registration Complete. Please Login.");
        setMode('login');
      } else {
        const isPhone = /^[0-9+]+$/.test(email);
        const loginPayload = isPhone ? { phone: email, password } : { email, password };
        const { data, error } = await supabase.auth.signInWithPassword(loginPayload);
        
        if (error) {
           if (error.message.includes('Invalid login') || error.message.includes('credential')) {
             throw new Error("Invalid password or email / phone.");
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
      <div className="absolute top-[-20%] left-[-20%] w-[140%] h-[60%] bg-gradient-to-b from-blue-900/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      
      <div className="z-10 flex flex-col items-center text-center w-full max-w-sm">
        
        {/* Updated Logo Section to match the circular design of the provided image */}
        <div className="w-32 h-32 bg-white rounded-full shadow-[0_15px_30px_-5px_rgba(0,0,0,0.5)] flex items-center justify-center mb-6 relative overflow-hidden border-4 border-white">
           <img 
             src={LOGO_URL} 
             className="w-full h-full object-cover" 
             onError={(e) => {
               e.currentTarget.style.display = 'none';
               e.currentTarget.parentElement!.classList.add('bg-gradient-to-br', 'from-hb-blue', 'to-hb-navy');
               e.currentTarget.parentElement!.innerHTML = '<span class="text-4xl font-black text-white italic">BET</span>';
             }}
           />
        </div>

        <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">
          Beteseb Bet Bingo
        </h1>
        <p className="text-hb-muted text-sm font-medium mb-8 max-w-[260px] leading-relaxed">
          The premium competitive bingo arena. <br/> Win weekly cash prizes securely.
        </p>

        {/* Auth Forms */}
        <div className="w-full bg-hb-surface border border-hb-border p-6 rounded-[24px] shadow-lg mb-6">
          <div className="flex bg-[#121212] p-1 rounded-xl mb-6">
             <button 
               onClick={() => setMode('login')}
               className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${mode === 'login' ? 'bg-hb-gold text-hb-blueblack shadow-sm' : 'text-hb-muted hover:text-white'}`}
             >
               Login
             </button>
             <button 
               onClick={() => setMode('signup')}
               className={`flex-1 py-2 rounded-lg text-[11px] font-black uppercase transition-all ${mode === 'signup' ? 'bg-hb-gold text-hb-blueblack shadow-sm' : 'text-hb-muted hover:text-white'}`}
             >
               Register
             </button>
          </div>

          <div className="space-y-4">
             {mode === 'signup' && (
               <>
                 <input 
                   type="text" 
                   value={username}
                   onChange={(e) => setUsername(e.target.value)}
                   placeholder="Username" 
                   className="w-full input-human h-12 text-sm"
                 />
                 <input 
                   type="tel" 
                   value={phone}
                   onChange={(e) => setPhone(e.target.value)}
                   placeholder="Phone Number" 
                   className="w-full input-human h-12 text-sm"
                 />
               </>
             )}
             <input 
               type="text" 
               value={email}
               onChange={(e) => setEmail(e.target.value)}
               placeholder={mode === 'login' ? "Email or Phone" : "Email Address"}
               className="w-full input-human h-12 text-sm"
             />
             <input 
               type="password" 
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               placeholder="Password" 
               className="w-full input-human h-12 text-sm"
             />

             <button 
               onClick={handleEmailAuth}
               disabled={loading}
               className="w-full h-12 bg-white text-hb-blueblack font-black text-xs uppercase tracking-widest rounded-xl shadow-md active:scale-95 transition-all mt-2 disabled:opacity-50"
             >
               {mode === 'login' ? 'Login' : 'Register'}
             </button>
          </div>
        </div>

        <button 
          onClick={handleTelegramAuth}
          disabled={loading}
          className="w-full h-14 bg-[#24A1DE] text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-lg active:scale-95 transition-all flex items-center justify-center gap-3"
        >
           <i className="fab fa-telegram-plane text-xl"></i>
           Sign In with Telegram
        </button>
      </div>
    </div>
  );
};

export default LoginView;