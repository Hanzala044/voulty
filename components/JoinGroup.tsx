import React, { useState } from 'react';
import { ArrowLeft, Users, Check } from 'lucide-react';
import { EMOJIS } from '../constants';
import { RecentUser } from '../types';

interface Props {
  onSubmit: (code: string, name: string, emoji: string) => void;
  onBack: () => void;
  recentUsers?: RecentUser[];
  onRecentSelect?: (recent: RecentUser) => void;
}

export const JoinGroup: React.FC<Props> = ({ onSubmit, onBack }) => {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(EMOJIS[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    onSubmit(code.toUpperCase(), name, selectedEmoji);
  };

  return (
    <div className="min-h-screen p-8 bg-white flex flex-col animate-fade-in font-sans">
      <button onClick={onBack} className="self-start mb-8 text-slate-400 hover:text-indigo-500 transition-colors">
        <ArrowLeft size={24} />
      </button>

      <div className="flex-1 max-w-md mx-auto w-full">
        <h1 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter">Enter Vault</h1>
        <p className="text-slate-400 font-bold text-lg mb-12 leading-snug">Join an existing group with your unique vault code.</p>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Vault Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. XJ2F9D"
              maxLength={6}
              className="w-full bg-slate-50 p-6 rounded-[2rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:outline-none text-3xl font-black text-center tracking-[0.3em] uppercase text-indigo-600 transition-all shadow-inner"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identity</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-slate-50 p-6 rounded-[2rem] border-2 border-transparent focus:border-indigo-500 focus:bg-white focus:outline-none text-lg font-bold text-slate-800 transition-all shadow-inner"
              required
            />
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Select Avatar</label>
            <div className="grid grid-cols-5 gap-4">
              {EMOJIS.slice(0, 10).map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`aspect-square rounded-2xl text-2xl flex items-center justify-center transition-all ${selectedEmoji === emoji
                      ? 'bg-indigo-500 text-white scale-110 shadow-xl'
                      : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
                    }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full indigo-gradient text-white py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 mt-4"
            style={{ background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)' }}
          >
            Access Vault <Users size={18} />
          </button>
        </form>
      </div>
    </div>
  );
};
