
import React from 'react';
import { Plus, Users, ArrowLeft, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { RecentUser } from '../types';

interface Props {
  onSelectCreate: () => void;
  onSelectJoin: () => void;
  onBack: () => void;
  recentUsers?: RecentUser[];
  onRecentSelect?: (recent: RecentUser) => void;
}

export const AuthSelector: React.FC<Props> = ({ onSelectCreate, onSelectJoin, onBack, recentUsers = [], onRecentSelect }) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-y-auto scrollbar-hide">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute -top-[10%] -right-[10%] w-[500px] h-[500px] bg-orange-500 rounded-full blur-[120px]"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 0.05, scale: 1 }}
          transition={{ duration: 2.5, repeat: Infinity, repeatType: 'reverse', delay: 0.5 }}
          className="absolute -bottom-[10%] -left-[10%] w-[400px] h-[400px] bg-indigo-500 rounded-full blur-[100px]"
        />
      </div>

      <div className="relative z-10 p-8 flex flex-col flex-1 max-w-lg mx-auto w-full">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={onBack}
          className="self-start mb-12 w-12 h-12 bg-white rounded-2xl shadow-soft flex items-center justify-center text-slate-400 hover:text-orange-500 hover:shadow-lg transition-all"
        >
          <ArrowLeft size={20} />
        </motion.button>

        <div className="flex-1 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="inline-flex items-center gap-2 bg-orange-100/50 text-orange-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4">
              <ShieldCheck size={12} /> Secure Access
            </div>
            <h1 className="text-5xl font-black text-slate-800 mb-4 tracking-tighter leading-none">
              Get <span className="text-orange-500 italic">Started.</span>
            </h1>
            <p className="text-slate-400 font-bold text-lg mb-12 leading-snug">
              Choose how you want to manage your expenses today.
            </p>
          </motion.div>

          <div className="space-y-6">
            <AuthCard
              index={0}
              onClick={onSelectCreate}
              icon={<Plus size={32} />}
              title="Create an Account"
              desc="Start a new group and set the budget rules."
              color="orange"
              tag="Recommend"
            />

            <div className="flex items-center gap-6 py-4">
              <div className="h-px flex-1 bg-slate-200"></div>
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.4em]">Vault Protocol</span>
              <div className="h-px flex-1 bg-slate-200"></div>
            </div>

            <AuthCard
              index={1}
              onClick={onSelectJoin}
              icon={<Users size={32} />}
              title="Join an Account"
              desc="Enter a code to join an existing group."
              color="indigo"
            />
          </div>

          <AnimatePresence>
            {recentUsers.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-16 pb-12"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Clock size={18} />
                    <h3 className="text-xs font-black uppercase tracking-[0.3em]">Recent Vaults</h3>
                  </div>
                  <div className="h-px flex-1 ml-4 bg-slate-200 opacity-50"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {recentUsers.slice(0, 4).map((recent, idx) => (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -5 }}
                      whileTap={{ scale: 0.98 }}
                      key={idx}
                      onClick={() => onRecentSelect?.(recent)}
                      className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-slate-100 hover:border-orange-200 hover:shadow-xl transition-all flex flex-col items-center gap-3 relative group"
                    >
                      <div className="text-5xl transform group-hover:scale-110 transition-transform">{recent.userEmoji}</div>
                      <div className="text-center">
                        <p className="text-sm font-black text-slate-800 truncate max-w-[100px]">{recent.userName}</p>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{recent.groupCode}</p>
                      </div>
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles size={12} className="text-orange-500" />
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

const AuthCard = ({ index, onClick, icon, title, desc, color, tag }: any) => {
  const colorClasses = {
    orange: 'bg-orange-50 text-orange-500 group-hover:bg-orange-500',
    indigo: 'bg-indigo-50 text-indigo-500 group-hover:bg-indigo-500'
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 + (index * 0.1) }}
      whileHover={{ y: -8, shadow: '0 25px 50px -12px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full bg-white p-8 rounded-[3rem] shadow-premium border border-slate-100 flex flex-col items-center text-center group relative overflow-hidden transition-all duration-300"
    >
      {tag && (
        <div className="absolute top-0 right-0 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest px-4 py-1.5 rounded-bl-2xl">
          {tag}
        </div>
      )}

      <div className={`w-20 h-20 ${colorClasses[color as keyof typeof colorClasses]} rounded-[2rem] flex items-center justify-center mb-6 group-hover:text-white transition-all duration-500 group-hover:rotate-12`}>
        {icon}
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight group-hover:text-orange-500 transition-colors">{title}</h2>
      <p className="text-sm text-slate-400 font-bold max-w-[200px]">{desc}</p>

      <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-slate-50 rounded-full opacity-50 group-hover:scale-[3] group-hover:bg-orange-50 transition-all duration-700 -z-10" />
    </motion.button>
  );
};
