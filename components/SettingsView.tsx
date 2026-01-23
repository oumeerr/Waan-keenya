
import React, { useState } from 'react';

const SettingsView: React.FC = () => {
  const [sound, setSound] = useState(true);
  const [vibration, setVibration] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div className="p-5 pb-20">
      <div className="mb-8">
        <h2 className="text-2xl font-black text-hb-navy mb-1 italic tracking-tight uppercase">App Settings</h2>
        <p className="text-[11px] text-hb-muted font-bold uppercase tracking-widest">Preferences & Config</p>
      </div>

      <div className="bg-white rounded-[24px] border border-hb-border overflow-hidden shadow-sm mb-6">
         {/* Toggles */}
         <SettingItem 
            icon="fa-volume-up" 
            color="bg-hb-blue text-white" 
            label="Game Sounds" 
            value={sound} 
            onChange={setSound} 
         />
         <SettingItem 
            icon="fa-mobile-alt" 
            color="bg-hb-gold text-white" 
            label="Haptic Vibration" 
            value={vibration} 
            onChange={setVibration} 
         />
         <SettingItem 
            icon="fa-bell" 
            color="bg-hb-emerald text-white" 
            label="Push Notifications" 
            value={notifications} 
            onChange={setNotifications} 
         />
      </div>

      <div className="bg-white rounded-[24px] border border-hb-border overflow-hidden shadow-sm mb-6 p-6">
         <h3 className="text-[12px] font-black text-hb-muted uppercase tracking-widest mb-4">Support & Info</h3>
         <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-hb-bg rounded-xl border border-hb-border/50">
               <span className="font-bold text-hb-navy text-sm">Version</span>
               <span className="font-black text-hb-muted text-xs uppercase tracking-wide">3.0.1 Stable</span>
            </div>
             <div className="flex justify-between items-center p-3 bg-hb-bg rounded-xl border border-hb-border/50">
               <span className="font-bold text-hb-navy text-sm">Build ID</span>
               <span className="font-black text-hb-muted text-xs uppercase tracking-wide">WKB-2024-PRO</span>
            </div>
            <button className="w-full py-4 bg-hb-bg border border-hb-border rounded-xl text-xs font-black text-hb-navy uppercase mt-2 hover:bg-hb-blue hover:text-white transition-colors">
               Terms of Service
            </button>
             <button className="w-full py-4 bg-hb-bg border border-hb-border rounded-xl text-xs font-black text-hb-navy uppercase hover:bg-hb-blue hover:text-white transition-colors">
               Privacy Policy
            </button>
         </div>
      </div>
    </div>
  );
};

interface SettingItemProps {
  icon: string;
  color: string;
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}

const SettingItem: React.FC<SettingItemProps> = ({ icon, color, label, value, onChange }) => (
  <div className="flex items-center justify-between p-5 border-b border-hb-border last:border-0 hover:bg-slate-50 transition-colors">
    <div className="flex items-center gap-4">
       <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${color}`}>
          <i className={`fas ${icon} text-lg`}></i>
       </div>
       <span className="font-bold text-hb-navy text-sm">{label}</span>
    </div>
    <button 
      onClick={() => onChange(!value)}
      className={`w-12 h-7 rounded-full p-1 transition-colors shadow-inner ${value ? 'bg-hb-emerald' : 'bg-gray-200'}`}
    >
       <div className={`w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  </div>
);

export default SettingsView;
