
import React from 'react';
import {
  ArrowRight,
  Zap,
  Shield,
  PieChart as ChartIcon,
  CreditCard,
  Sparkles,
  Lock,
  Clock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { RecentUser } from '../types';

interface Props {
  onStart: () => void;
  recentUsers: RecentUser[];
  onRecentSelect: (recent: RecentUser) => void;
}

export const LandingPage: React.FC<Props> = ({ onStart, recentUsers, onRecentSelect }) => {
  return (
    <div className="flex flex-col h-full bg-white animate-fade-in overflow-y-auto scrollbar-hide">
      {/* High-Impact Hero */}
      <div className="relative min-h-[55vh] flex flex-col items-center justify-center p-8 overflow-hidden orange-gradient shrink-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

        {/* Decorative blobs */}
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-white rounded-full blur-3xl opacity-10"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.15, 0.1] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[-5%] left-[-5%] w-48 h-48 bg-amber-200 rounded-full blur-3xl opacity-10"
        />

        <div className="relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-white text-[10px] font-black uppercase tracking-widest mb-6"
          >
            <Sparkles size={12} className="text-amber-300 fill-amber-300" /> Smart Split 2.0
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="text-7xl font-black text-white mb-2 tracking-tighter italic"
          >
            Vaulty
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-orange-100 text-lg font-bold max-w-[280px] mx-auto leading-tight"
          >
            The group budget divider that actually works.
          </motion.p>
        </div>

        {/* Floating Card */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
          className="absolute bottom-10 left-10 right-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-4 flex items-center justify-between shadow-2xl"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-orange-500 shadow-lg">
              <CreditCard size={20} />
            </div>
            <div>
              <p className="text-white text-[10px] font-black uppercase tracking-widest">Recent Split</p>
              <p className="text-orange-100 text-xs font-bold">Pizza Night • $45.00</p>
            </div>
          </div>
          <ArrowRight className="text-white/50" size={16} />
        </motion.div>
      </div>

      <div className="relative z-20 -mt-10 bg-white rounded-t-[3.5rem] p-10 flex-1 space-y-12">
        <div className="space-y-8">
          <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-center">Premium Experience</h2>

          <div className="grid gap-6">
            <FeatureRow
              icon={<Shield className="text-orange-600" />}
              title="Ghost Protocol"
              desc="Private mode for personal expenses."
              color="bg-orange-50"
              index={0}
            />
            <FeatureRow
              icon={<ChartIcon className="text-amber-600" />}
              title="Visual Intelligence"
              desc="Real-time analysis on your spending habits."
              color="bg-amber-50"
              index={1}
            />
          </div>
        </div>

        <div className="space-y-4 pt-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="w-full orange-gradient text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-orange-100 flex items-center justify-center gap-3 transition-all"
          >
            Enter Vault <ArrowRight size={20} />
          </motion.button>

          {recentUsers.length > 0 && (
            <div className="mt-8 pt-8 border-t border-slate-100">
              <div className="flex items-center gap-2 mb-6 text-slate-400">
                <Clock size={16} />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">Login with PIN</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {recentUsers.slice(0, 4).map((recent, idx) => (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + (idx * 0.1) }}
                    whileHover={{ y: -5, shadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    key={idx}
                    onClick={() => onRecentSelect(recent)}
                    className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-slate-100 hover:border-orange-200 transition-all flex flex-col items-center gap-3"
                  >
                    <div className="text-5xl">{recent.userEmoji}</div>
                    <div className="text-center">
                      <p className="text-sm font-black text-slate-800 truncate">{recent.userName}</p>
                      <p className="text-[10px] font-black text-slate-400 tracking-widest uppercase">{recent.groupCode}</p>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          <p className="text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest py-8">Trusted by 50k+ Roomies</p>
        </div>
      </div>
    </div>
  );
};

const FeatureRow = ({ icon, title, desc, color, index }: { icon: React.ReactNode, title: string, desc: string, color: string, index: number }) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ delay: index * 0.1 }}
    viewport={{ once: true }}
    className="flex gap-5 items-center"
  >
    <div className={`${color} w-16 h-16 shrink-0 rounded-[1.8rem] flex items-center justify-center shadow-soft`}>
      {icon}
    </div>
    <div>
      <h4 className="font-black text-slate-800 text-sm mb-0.5">{title}</h4>
      <p className="text-xs text-slate-500 font-medium leading-tight">{desc}</p>
    </div>
  </motion.div>
);
