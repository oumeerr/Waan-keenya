import React, { useState } from 'react';
import { User } from '../types';
import { supabase } from '../services/supabase';

interface ProfileViewProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
}

const ProfileView: React.FC<ProfileViewProps> = ({ user, setUser }) => {
  const [editing, setEditing] = useState(false);
  const [newUsername, setNewUsername] = useState(user.username);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!newUsername.trim()) return;
    if (newUsername === user.username) {
      setEditing(false);
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ username: newUsername })
        .eq('id', user.id);

      if (error) throw error;

      setUser(prev => ({ ...prev, username: newUsername }));
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update username.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex flex-col items-center text-center py-8">
        <div className="relative mb-4">
          <img 
            src={user.photo} 
            alt="Profile" 
            className="w-24 h-24 rounded-full border-4 border-white shadow-xl"
          />
          <button className="absolute bottom-0 right-0 w-8 h-8 bg-hb-gold text-hb-blueblack rounded-full flex items-center justify-center shadow-lg">
            <i className="fas fa-camera text-xs"></i>
          </button>
        </div>
        
        {editing ? (
          <div className="flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-200">
            <input 
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value)}
              className="bg-white border-2 border-hb-blue px-4 py-2 rounded-xl text-center font-bold outline-none text-hb-blueblack"
              autoFocus
            />
            <div className="flex gap-2">
               <button onClick={handleSave} disabled={loading} className="text-xs font-bold text-green-600 px-3 py-1 bg-green-50 rounded-lg">
                 {loading ? 'SAVING...' : 'SAVE'}
               </button>
               <button onClick={() => setEditing(false)} disabled={loading} className="text-xs font-bold text-gray-400 px-3 py-1 bg-gray-50 rounded-lg">CANCEL</button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-hb-blue">{user.username}</h2>
            <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-gray-500 transition-colors">
              <i className="fas fa-edit text-sm"></i>
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3 mb-6">
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 w-full flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">User ID</span>
          <span className="text-xs font-black text-gray-700 font-mono select-all">{user.id.split('-')[0]}...</span>
        </div>
        <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 w-full flex justify-between items-center">
          <span className="text-[10px] font-bold text-gray-400 uppercase">Phone</span>
          <span className="text-xs font-black text-gray-700 font-mono">{user.mobile}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Total Referrals</span>
          <span className="text-2xl font-black text-hb-blue">{user.referrals}</span>
        </div>
        <div className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center">
          <span className="text-[10px] font-black text-gray-400 uppercase mb-1">Wins</span>
          <span className="text-2xl font-black text-hb-gold">{user.wins}</span>
        </div>
      </div>

      <div className="bg-hb-gold p-6 rounded-3xl text-hb-blueblack shadow-xl relative overflow-hidden">
        <h3 className="text-lg font-black mb-2 italic relative z-10">REFER & EARN</h3>
        <p className="text-xs opacity-90 mb-6 leading-relaxed relative z-10 font-bold">Invite friends and get 2 ETB for every registered user!</p>
        <div className="bg-white/20 p-4 rounded-2xl flex items-center justify-between border border-black/10 relative z-10 backdrop-blur-sm">
           <span className="text-[10px] font-mono truncate mr-2 font-black">{user.username}</span>
           <button className="bg-hb-blueblack text-hb-gold px-3 py-1.5 rounded-xl text-[10px] font-bold">COPY CODE</button>
        </div>
        <i className="fas fa-coins absolute -right-4 -bottom-4 text-hb-blueblack/10 text-7xl rotate-12"></i>
      </div>
    </div>
  );
};

export default ProfileView;