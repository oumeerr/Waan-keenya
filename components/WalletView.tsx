
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { ETHIOPIAN_BANKS } from '../constants';
import { APP_CONFIG } from '../config';
import { supabase } from '../services/supabase';

interface WalletViewProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

type PaymentMethod = 'telebirr' | 'cbe' | 'ebirr' | 'kacha';

interface MethodButtonProps {
  id: PaymentMethod;
  selected: boolean;
  onClick: (id: PaymentMethod) => void;
  logoUrl: string;
}

// Hosted logos for Ethiopian Payment Providers (using high-availability public URLs)
const LOGOS = {
  telebirr: "https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/4a/6c/2e/4a6c2e37-122e-130f-2169-2810c9d94944/AppIcon-0-0-1x_U007emarketing-0-5-0-85-220.png/512x512bb.jpg",
  cbe: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/f2/86/81/f286810c-300c-7703-e820-221614972e25/AppIcon-0-0-1x_U007emarketing-0-0-0-7-0-0-sRGB-0-0-0-GLES2_U002c0-512MB-85-220-0-0.png/512x512bb.jpg",
  ebirr: "https://is1-ssl.mzstatic.com/image/thumb/Purple126/v4/7e/1c/64/7e1c641f-1339-930c-529d-473133874313/AppIcon-1x_U007emarketing-0-7-0-85-220.png/512x512bb.jpg",
  kacha: "https://pbs.twimg.com/profile_images/1542866598379438081/Hj3x-k-9_400x400.jpg"
};

const MethodButton: React.FC<MethodButtonProps> = ({ 
  id, 
  selected, 
  onClick, 
  logoUrl 
}) => {
  const isSelectedStyle = selected 
    ? 'border-hb-gold ring-2 ring-hb-gold/50 bg-[#121212]' 
    : 'border-hb-border bg-[#121212] hover:border-hb-muted opacity-100 grayscale hover:grayscale-0';

  return (
    <button 
      onClick={() => onClick(id)}
      className={`relative aspect-square rounded-2xl border-2 transition-all group shadow-sm active:scale-95 flex items-center justify-center p-2 overflow-hidden ${isSelectedStyle}`}
    >
      <img 
        src={logoUrl} 
        alt={id} 
        className="w-full h-full object-cover rounded-xl bg-white" 
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const parent = e.currentTarget.parentElement;
          if (parent) {
            parent.classList.add('bg-hb-surface');
            const span = document.createElement('span');
            span.textContent = id;
            span.className = 'text-[10px] font-black text-white uppercase';
            parent.appendChild(span);
          }
        }}
      />
      {selected && (
        <div className="absolute top-1 right-1 w-4 h-4 bg-hb-gold rounded-full flex items-center justify-center shadow-md z-10">
           <i className="fas fa-check text-[8px] text-hb-blueblack"></i>
        </div>
      )}
    </button>
  );
};

const WalletView: React.FC<WalletViewProps> = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'transfer'>('deposit');
  const [amount, setAmount] = useState('');
  const [bank, setBank] = useState('');
  const [refId, setRefId] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('telebirr');
  const [recipientUsername, setRecipientUsername] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [loading, setLoading] = useState(false);
  const [depositHistory, setDepositHistory] = useState<any[]>([]);
  const [transferHistory, setTransferHistory] = useState<any[]>([]);

  useEffect(() => {
    setAmount('');
    setRefId('');
    setBank('');
    setRecipientUsername('');
    setAccountNumber('');
    setAccountHolder('');
  }, [activeTab]);

  useEffect(() => {
    if (user.id === 'guest') return;

    const fetchHistory = async () => {
      if (activeTab === 'deposit') {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'deposit')
          .order('created_at', { ascending: false })
          .limit(5);
        if (data) setDepositHistory(data);
      } else if (activeTab === 'transfer') {
        const { data } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .eq('type', 'transfer')
          .order('created_at', { ascending: false })
          .limit(5);
        if (data) setTransferHistory(data);
      }
    };
    fetchHistory();
  }, [activeTab, user.id]);

  const getDepositNumbers = () => {
    if (selectedMethod === 'ebirr' || selectedMethod === 'kacha') {
      return APP_CONFIG.WALLET.DEPOSIT_PHONES.MERCHANT;
    }
    return APP_CONFIG.WALLET.DEPOSIT_PHONES.STANDARD;
  };

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    alert(`Phone number ${num} copied to clipboard!`);
  };

  const isWithdrawActive = () => {
    const now = new Date();
    const hour = now.getHours();
    return hour >= APP_CONFIG.WALLET.WITHDRAWAL_START_HOUR && hour < APP_CONFIG.WALLET.WITHDRAWAL_END_HOUR;
  };

  const handleTransaction = async (type: 'deposit' | 'withdraw' | 'transfer') => {
    const val = parseFloat(amount);
    
    // Basic Client-Side Validation
    if (!val || isNaN(val)) return alert("Please enter a valid amount");

    if (type === 'deposit') {
      if (val < 30) return alert("Minimum deposit is 30 ETB");
      if (!refId) return alert("Transaction Reference ID is required");
    }
    
    if (type === 'withdraw') {
      if (val < 100) return alert("Minimum withdrawal is 100 ETB");
      if (!bank || !accountNumber || !accountHolder) return alert("Please complete all bank details");
    }

    if (type === 'transfer') {
      if (val < 100) return alert("Minimum transfer is 100 ETB");
      if (!recipientUsername) return alert("Recipient username required");
    }

    setLoading(true);

    try {
      // Prepare Metadata based on type
      const metadata = type === 'withdraw' 
        ? { bank, accountNumber, accountHolder } 
        : type === 'deposit' 
          ? { method: selectedMethod, refId } 
          : {};

      const { data, error } = await supabase.rpc('process_transaction', {
        p_type: type,
        p_amount: val,
        p_recipient_username: type === 'transfer' ? recipientUsername : null,
        p_metadata: metadata
      });

      if (error) throw error;

      alert(data.message || "Transaction processed successfully");

      // Optimistic UI Updates
      if (type === 'withdraw') {
        setUser(prev => ({ ...prev, balance: prev.balance - val }));
      } else if (type === 'transfer') {
        const fee = val * APP_CONFIG.WALLET.TRANSFER_FEE_PERCENT;
        setUser(prev => ({ ...prev, balance: prev.balance - (val + fee) }));
      }

      // Refresh Histories
      if (user.id !== 'guest') {
         if (type === 'deposit') {
           const { data: newData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'deposit')
            .order('created_at', { ascending: false })
            .limit(5);
           if (newData) setDepositHistory(newData);
         } else if (type === 'transfer') {
           const { data: newData } = await supabase
            .from('transactions')
            .select('*')
            .eq('user_id', user.id)
            .eq('type', 'transfer')
            .order('created_at', { ascending: false })
            .limit(5);
           if (newData) setTransferHistory(newData);
         }
      }

      // Reset Forms
      setAmount('');
      setRefId('');
      setRecipientUsername('');
      setAccountNumber('');
      setAccountHolder('');

    } catch (error: any) {
      console.error("Transaction Error:", error);
      alert(error.message || "Transaction failed");
    } finally {
      setLoading(false);
    }
  };

  const transferValue = parseFloat(amount) || 0;
  const transferFee = transferValue * APP_CONFIG.WALLET.TRANSFER_FEE_PERCENT;
  const totalTransferDeduction = transferValue + transferFee;

  return (
    <div className="p-5">
      <div className="bg-gradient-to-br from-[#1A1A1A] to-black border border-hb-border p-8 rounded-[24px] text-white mb-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase opacity-60 mb-1.5 tracking-widest text-hb-muted">Available Balance</p>
          <h2 className="text-[32px] font-black mb-4 text-hb-gold drop-shadow-sm leading-none">
            {user.balance.toLocaleString()} <span className="text-[16px] opacity-70 font-bold text-white">ETB</span>
          </h2>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-hb-gold/10 rounded-lg text-[10px] font-bold uppercase border border-hb-gold/20 text-hb-gold">Secured Vault</div>
            <div className="px-3 py-1 bg-white/5 rounded-lg text-[10px] font-bold uppercase border border-white/5 text-hb-muted">Verified Player</div>
          </div>
        </div>
        <i className="fas fa-wallet absolute -right-6 -bottom-6 text-hb-gold/10 text-[9rem] -rotate-12"></i>
      </div>

      <div className="flex bg-hb-surface border border-hb-border p-1.5 rounded-2xl mb-8">
        {['deposit', 'withdraw', 'transfer'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-3 rounded-xl text-[11px] font-bold uppercase transition-all ${activeTab === tab ? 'bg-hb-gold text-hb-blueblack shadow-md' : 'text-hb-muted hover:text-white'}`}
          >
            {tab === 'deposit' ? 'Deposit' : tab === 'withdraw' ? 'Withdraw' : 'Transfer'}
          </button>
        ))}
      </div>

      {activeTab === 'deposit' && (
        <div className="space-y-6">
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-black uppercase text-hb-muted ml-1 tracking-widest">Select Provider</span>
            <div className="grid grid-cols-4 gap-3">
              <MethodButton id="telebirr" selected={selectedMethod === 'telebirr'} logoUrl={LOGOS.telebirr} onClick={setSelectedMethod} />
              <MethodButton id="cbe" selected={selectedMethod === 'cbe'} logoUrl={LOGOS.cbe} onClick={setSelectedMethod} />
              <MethodButton id="ebirr" selected={selectedMethod === 'ebirr'} logoUrl={LOGOS.ebirr} onClick={setSelectedMethod} />
              <MethodButton id="kacha" selected={selectedMethod === 'kacha'} logoUrl={LOGOS.kacha} onClick={setSelectedMethod} />
            </div>
          </div>

          <div className="bg-hb-surface p-7 rounded-[24px] border border-hb-border shadow-sm space-y-6">
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-2">
                <img src={LOGOS[selectedMethod]} className="w-6 h-6 rounded-md object-cover bg-white" alt="Selected" />
                <h3 className="font-bold text-white text-[16px] uppercase tracking-tight">
                  Deposit via {selectedMethod === 'cbe' ? 'CBE' : selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)}
                </h3>
              </div>
              <p className="text-[12px] text-hb-muted font-medium">Send (Min 30 ETB) to merchant:</p>
              
              <div className="space-y-3">
                {getDepositNumbers().map((num) => (
                  <div key={num} className="bg-[#121212] border border-hb-border py-4 px-6 rounded-2xl flex items-center justify-between group hover:border-hb-gold/30 transition-colors">
                    <span className="text-[18px] font-black text-hb-gold tracking-wider font-mono">{num}</span>
                    <button 
                      onClick={() => handleCopy(num)}
                      className="w-10 h-10 bg-hb-gold/10 text-hb-gold rounded-xl flex items-center justify-center hover:bg-hb-gold hover:text-hb-blueblack transition-all active:scale-90 shadow-sm"
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-hb-border/50">
              <h3 className="font-bold text-white text-[16px] uppercase tracking-tight text-center">
                Verify Payment
              </h3>
              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-hb-muted ml-1 uppercase tracking-tighter italic">Amount Sent (Min 30 ETB)</label>
                <input 
                  type="number" 
                  placeholder="e.g. 500"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full input-human shadow-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[12px] font-bold text-hb-muted ml-1 uppercase tracking-tighter italic">Transaction ID</label>
                <input 
                  type="text" 
                  placeholder="Ref/Txn code"
                  value={refId}
                  onChange={(e) => setRefId(e.target.value)}
                  className="w-full input-human shadow-sm"
                />
              </div>

              <button 
                onClick={() => handleTransaction('deposit')}
                disabled={loading}
                className="w-full h-[54px] bg-hb-gold text-hb-blueblack font-bold rounded-xl text-[14px] uppercase shadow-lg active:scale-[0.98] mt-4 flex items-center justify-center gap-2 transition-all hover:brightness-110 disabled:opacity-50"
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-check-circle"></i>}
                {loading ? 'Verifying...' : 'Confirm Deposit'}
              </button>
            </div>
          </div>

          {/* Deposit History Section */}
          {depositHistory.length > 0 && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-[12px] font-bold text-hb-muted uppercase tracking-widest mb-3 ml-2">Recent Deposits</h3>
              <div className="space-y-2">
                {depositHistory.map((tx) => (
                  <div key={tx.id} className="bg-white p-3 rounded-xl border border-hb-border shadow-sm flex justify-between items-center hover:bg-blue-50 transition-colors">
                     <div>
                       <div className="text-[10px] font-black text-hb-blueblack uppercase tracking-tight">
                         {new Date(tx.created_at).toLocaleDateString()}
                       </div>
                       <div className="text-[9px] font-bold text-hb-muted uppercase flex items-center gap-1">
                          {tx.metadata?.method || 'Direct'} 
                          <span className="opacity-50">•</span> 
                          <span className={`${tx.status === 'completed' ? 'text-green-600' : tx.status === 'failed' ? 'text-red-500' : 'text-orange-500'}`}>{tx.status}</span>
                       </div>
                     </div>
                     <div className="text-[12px] font-black text-hb-blueblack tracking-tight">
                       +{tx.amount} ETB
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'withdraw' && (
        <div className="bg-hb-surface p-7 rounded-[24px] border border-hb-border shadow-sm space-y-6">
           <div className="text-center">
              <h3 className="font-bold text-white text-[18px] mb-1 italic">Withdraw Funds</h3>
              <p className="text-[12px] text-hb-muted font-medium">Window: {APP_CONFIG.WALLET.WITHDRAWAL_START_HOUR} AM to {APP_CONFIG.WALLET.WITHDRAWAL_END_HOUR - 12} PM.</p>
           </div>

           <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Amount to Withdraw (Min {APP_CONFIG.WALLET.MIN_WITHDRAWAL_ETB})</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00 ETB"
                  className="w-full input-human"
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Payment Method</label>
                <select 
                  className="w-full input-human appearance-none bg-no-repeat bg-[right_16px_center]"
                  style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23A0A0A0\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'%3E%3C/path%3E%3C/svg%3E")', backgroundSize: '20px' }}
                  value={bank} onChange={e => setBank(e.target.value)}
                >
                  <option value="">Select Bank/Wallet...</option>
                  {ETHIOPIAN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Account Number</label>
                <input 
                  type="text" 
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 1000..."
                  className="w-full input-human"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Full Name</label>
                <input 
                  type="text" 
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder="Full Name"
                  className="w-full input-human"
                />
              </div>

              <button 
                onClick={() => handleTransaction('withdraw')}
                disabled={!isWithdrawActive() || loading}
                className="w-full h-[54px] bg-hb-gold text-hb-blueblack font-bold rounded-xl text-[14px] uppercase shadow-lg active:scale-[0.98] disabled:opacity-40 transition-all mt-4 flex items-center justify-center gap-2"
              >
                {loading && <i className="fas fa-spinner fa-spin"></i>}
                Withdraw Funds
              </button>
              {!isWithdrawActive() && (
                <p className="text-[10px] text-red-500 font-bold text-center italic">Withdrawals paused. Resume at {APP_CONFIG.WALLET.WITHDRAWAL_START_HOUR} AM.</p>
              )}
           </div>
        </div>
      )}

      {activeTab === 'transfer' && (
        <div className="bg-hb-surface p-7 rounded-[24px] border border-hb-border shadow-sm space-y-6">
           <div className="text-center">
              <h3 className="font-bold text-white text-[18px] mb-1 italic">Transfer Funds</h3>
              <p className="text-[12px] text-hb-muted font-medium">Move funds to another player's account (Min 100 ETB).</p>
           </div>

           <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Recipient Username</label>
                <input 
                  type="text"
                  value={recipientUsername}
                  onChange={(e) => setRecipientUsername(e.target.value)}
                  placeholder="e.g. BingoKing"
                  className="w-full input-human"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[13px] font-bold text-hb-muted ml-1">Amount to Send</label>
                <input 
                  type="number" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00 ETB"
                  className="w-full input-human"
                />
              </div>

              {transferValue > 0 && (
                <div className="bg-[#121212] p-4 rounded-xl border border-hb-border text-[12px] animate-in fade-in slide-in-from-top-1">
                  <div className="flex justify-between mb-2">
                    <span className="text-hb-muted font-bold">Transfer Amount</span>
                    <span className="font-bold text-white">{transferValue.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between mb-2 text-hb-gold">
                    <span className="font-bold">Fee (5%)</span>
                    <span className="font-bold">+{transferFee.toFixed(2)} ETB</span>
                  </div>
                  <div className="flex justify-between pt-3 border-t border-hb-border/50 font-black text-white text-[14px]">
                    <span>Total Deductible</span>
                    <span>{totalTransferDeduction.toFixed(2)} ETB</span>
                  </div>
                </div>
              )}

              <button 
                onClick={() => handleTransaction('transfer')}
                disabled={user.balance < totalTransferDeduction || loading}
                className="w-full h-[54px] bg-hb-gold text-hb-blueblack font-bold rounded-xl text-[14px] uppercase shadow-lg active:scale-[0.98] transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading && <i className="fas fa-spinner fa-spin"></i>}
                {user.balance < totalTransferDeduction ? 'Insufficient Funds' : 'Transfer Funds'}
              </button>
           </div>
           
           {/* Transfer History Section */}
           {transferHistory.length > 0 && (
            <div className="mt-6 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="text-[12px] font-bold text-hb-muted uppercase tracking-widest mb-3 ml-2">Recent Transfers</h3>
              <div className="space-y-2">
                {transferHistory.map((tx) => (
                  <div key={tx.id} className="bg-white p-3 rounded-xl border border-hb-border shadow-sm flex justify-between items-center hover:bg-blue-50 transition-colors">
                     <div>
                       <div className="text-[10px] font-black text-hb-blueblack uppercase tracking-tight">
                         {new Date(tx.created_at).toLocaleDateString()}
                       </div>
                       <div className="text-[9px] font-bold text-hb-muted uppercase flex items-center gap-1">
                          To: {tx.recipient_username || 'Unknown'} 
                          <span className="opacity-50">•</span> 
                          <span className={`${tx.status === 'completed' ? 'text-green-600' : 'text-orange-500'}`}>{tx.status}</span>
                       </div>
                     </div>
                     <div className="text-[12px] font-black text-hb-blueblack tracking-tight">
                       -{tx.amount} ETB
                     </div>
                  </div>
                ))}
              </div>
            </div>
           )}
        </div>
      )}
    </div>
  );
};

export default WalletView;
