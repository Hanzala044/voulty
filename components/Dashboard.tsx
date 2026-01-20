
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Plus,
  LogOut,
  History,
  BarChart3,
  Calendar,
  Settings,
  Search,
  Map as MapIcon,
  X,
  ChevronRight,
  User as UserIcon,
  Bell,
  Wallet,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Sparkles,
  Loader2,
  Filter,
  Check,
  Home,
  Briefcase,
  MoreHorizontal,
  Share2,
  FileText,
  Lock,
  ShieldCheck,
  ShieldOff,
  Download
} from 'lucide-react';

import { GroupState, Expense, Category, User, VaultNotification } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS, EMOJIS } from '../constants';
import { ExpenseModal } from './ExpenseModal';
import { FullMapView } from './FullMapView';
import { PinAuthentication } from './PinAuthentication';
import { ChatBot } from './ChatBot';

interface Props {
  group: GroupState;
  onAddExpense: (expense: Omit<Expense, 'id'>) => void;
  onUpdateGroup: (group: GroupState) => void;
  onReset: () => void;
  onLockSession: () => void;
  onUpdatePayment: (expenseId: string, paymentData: any) => void;
  onSetPin: (pin: string) => void;
  onDeleteExpense: (expenseId: string) => void;
  onUpdateExpense: (expenseId: string, updates: Partial<Expense>) => void;
  onShowDocumentation: () => void;
}

export const Dashboard: React.FC<Props> = ({
  group,
  onAddExpense,
  onUpdateGroup,
  onReset,
  onLockSession,
  onUpdatePayment,
  onSetPin,
  onDeleteExpense,
  onUpdateExpense,
  onShowDocumentation
}) => {
  const [activeTab, setActiveTab] = useState<'home' | 'activity' | 'map' | 'chat' | 'profile'>('home');
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [pinMode, setPinMode] = useState<'GROUP' | 'USER'>('GROUP');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentProof, setPaymentProof] = useState<string | undefined>();
  const [paymentProofName, setPaymentProofName] = useState<string | undefined>();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const paymentFileRef = useRef<HTMLInputElement>(null);
  const [prefilledLocation, setPrefilledLocation] = useState<{ lat: number, lng: number } | undefined>();
  const receiptRef = useRef<HTMLDivElement>(null);

  const currentUser = group.users.find(u => u.id === group.currentUserId);
  const unreadCount = useMemo(() => group.notifications.filter(n => !n.read).length, [group.notifications]);

  const handleDownloadPDF = () => {
    if (!receiptRef.current) return;
    const element = receiptRef.current;
    const opt = {
      margin: 1,
      filename: `receipt_${selectedExpense?.caption || 'expense'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().from(element).set(opt).save();
  };

  const handleQuickAdd = (loc: { lat: number, lng: number }) => {
    setPrefilledLocation(loc);
    setIsModalOpen(true);
  };

  const stats = useMemo(() => {
    let mySpend = 0;
    let groupSpend = 0;
    let balance = 0;

    group.expenses.forEach(exp => {
      const isMePayer = exp.paidBy === group.currentUserId;

      if (!exp.isPrivate) {
        groupSpend += exp.amount;
        const totalParticipants = exp.participants.length || 1;
        let myShare = 0;
        if (exp.participants.includes(group.currentUserId!)) {
          if (exp.splitType === 'EQUAL') {
            myShare = exp.amount / totalParticipants;
          } else if (exp.splitType === 'EXACT') {
            myShare = exp.splits?.find(s => s.userId === group.currentUserId)?.value || 0;
          } else if (exp.splitType === 'SHARES') {
            const totalShares = exp.splits?.reduce((a, b) => a + b.value, 0) || 1;
            const myShares = exp.splits?.find(s => s.userId === group.currentUserId)?.value || 0;
            myShare = (exp.amount * myShares) / totalShares;
          }
        }

        if (isMePayer) {
          mySpend += exp.amount;
          balance += (exp.amount - myShare);
        } else if (myShare > 0) {
          balance -= myShare;
        }

        if (exp.isPaid) {
          if (exp.paidByUser === group.currentUserId) {
            balance += (exp.paidAmount || myShare);
          } else if (isMePayer) {
            balance -= (exp.paidAmount || (exp.amount / totalParticipants));
          }
        }
      } else if (isMePayer) {
        mySpend += exp.amount;
      }
    });

    return { mySpend, groupSpend, balance };
  }, [group]);

  const shareReceipt = async (expense: Expense) => {
    if (!expense.invoiceData) {
      alert('No receipt image available to share');
      return;
    }
    const shareText = `${expense.caption} - ${group.currency}${expense.amount}\nDate: ${expense.date}\nShared via Vaulty`;
    try {
      const base64Data = expense.invoiceData.split(',')[1];
      const mimeType = expense.invoiceData.split(';')[0].split(':')[1] || 'image/jpeg';
      const extension = mimeType.split('/')[1] || 'jpg';
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: mimeType });
      const file = new File([blob], `receipt_${expense.id}.${extension}`, { type: mimeType });

      if (navigator.share) {
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ title: `Vaulty Receipt: ${expense.caption}`, text: shareText, files: [file] });
        } else {
          await navigator.share({ title: `Vaulty Receipt: ${expense.caption}`, text: shareText });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `receipt_${expense.caption}.${extension}`;
          a.click();
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `receipt_${expense.caption}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Share failed:', error);
      const a = document.createElement('a');
      a.href = expense.invoiceData;
      a.download = `receipt_${expense.caption}.jpg`;
      a.click();
    }
  };

  const handleSelectExpense = (exp: Expense) => {
    setSelectedExpense(exp);
    let myOwed = 0;
    if (exp.participants.includes(group.currentUserId!)) {
      if (exp.splitType === 'EQUAL') {
        myOwed = exp.amount / (exp.participants.length || 1);
      } else if (exp.splitType === 'EXACT') {
        myOwed = exp.splits?.find(s => s.userId === group.currentUserId)?.value || 0;
      } else if (exp.splitType === 'SHARES') {
        const totalShares = exp.splits?.reduce((a, b) => a + b.value, 0) || 1;
        const myShares = exp.splits?.find(s => s.userId === group.currentUserId)?.value || 0;
        myOwed = (exp.amount * myShares) / totalShares;
      }
    }
    setPaymentAmount(myOwed.toString());
  };

  const renderHome = () => (
    <div className="flex-1 overflow-y-auto px-5 pt-12 pb-24 scrollbar-hide animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-1">
          <h1 className="text-2xl font-extrabold text-slate-800 tracking-tight">Vaulty</h1>
          <Sparkles className="text-orange-400 fill-orange-400 w-5 h-5" />
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onShowDocumentation} className="w-10 h-10 bg-white rounded-full shadow-soft flex items-center justify-center text-slate-600 transition-all active:scale-95">
            <FileText size={20} />
          </button>
          <button onClick={() => setIsNotificationsOpen(true)} className="w-10 h-10 bg-white rounded-full shadow-soft flex items-center justify-center relative transition-all active:scale-95">
            <Bell size={20} className="text-slate-600" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-white"></span>}
          </button>
        </div>
      </div>

      <div className="flex items-center gap-3 mb-6 bg-white rounded-3xl p-1 shadow-soft border border-orange-50/50">
        <div className="flex-1 h-14 flex items-center px-4 gap-3">
          <Search size={20} className="text-slate-400" />
          <input type="text" placeholder="Find an expense..." className="bg-transparent border-none outline-none text-sm w-full font-extrabold text-slate-700 placeholder:text-slate-300" />
        </div>
        <button className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 m-1">
          <Filter size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 mb-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-orange-50/50 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.15em] mb-2">Total Vault Value</p>
            <h4 className="text-4xl font-black text-slate-800 tracking-tight">{group.currency}{stats.groupSpend.toLocaleString()}</h4>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-sm border border-orange-100/50">
            <BarChart3 size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-white rounded-[2.5rem] p-6 shadow-soft border border-indigo-50/30 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
            <Wallet size={24} className="text-indigo-500" />
          </div>
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">My Contribution</p>
          <p className="text-2xl font-black text-indigo-600 tracking-tight">{group.currency}{stats.mySpend.toLocaleString()}</p>
        </div>

        <div className={`rounded-[2.5rem] p-6 shadow-soft border flex flex-col items-center justify-center text-center transition-all ${stats.balance >= 0
          ? 'bg-emerald-50/50 border-emerald-100/50'
          : 'bg-rose-50/50 border-rose-100/50'
          }`}>
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${stats.balance >= 0 ? 'bg-emerald-100' : 'bg-rose-100'
            }`}>
            <TrendingUp size={24} className={stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'} />
          </div>
          <p className={`text-[9px] font-black uppercase tracking-widest mb-1.5 ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
            {stats.balance >= 0 ? 'Receive' : 'Owe'}
          </p>
          <p className={`text-2xl font-black tracking-tight ${stats.balance >= 0 ? 'text-emerald-600' : 'text-rose-600'
            }`}>
            {stats.balance >= 0 ? '+' : '-'}{group.currency}{Math.abs(stats.balance).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="flex justify-center mb-8">
        <button onClick={() => setIsModalOpen(true)} className="orange-gradient text-white px-8 py-4 rounded-[2rem] text-sm font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2">
          <Plus size={20} /> Add Expense
        </button>
      </div>

      <div className="flex items-center justify-between mb-5">
        <h3 className="text-lg font-black text-slate-800">Our Activity</h3>
        <button className="p-1"><MoreHorizontal size={20} className="text-slate-400" /></button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {group.expenses.slice(0, 8).map(exp => (
          <button key={exp.id} onClick={() => handleSelectExpense(exp)} className="bg-white p-4 rounded-[2rem] shadow-soft border border-orange-50/50 flex flex-col gap-3 text-left animate-slide-up relative">
            {exp.isPaid && <span className="absolute top-2 right-2 px-2 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[8px] font-black uppercase tracking-widest">PAID</span>}
            <div className="w-full aspect-square bg-orange-50 rounded-3xl flex items-center justify-center text-4xl overflow-hidden relative" style={{ color: CATEGORY_COLORS[exp.category] }}>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
              {CATEGORY_ICONS[exp.category]}
            </div>
            <div>
              <div className="flex items-center justify-between">
                <h4 className="font-extrabold text-slate-800 text-sm truncate">{exp.caption}</h4>
                <div className={`text-[10px] font-bold ${stats.balance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{group.currency}{exp.amount}</div>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">{exp.date}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderDetailView = (exp: Expense) => (
    <div className="fixed inset-0 z-[1000] bg-slate-900/40 backdrop-blur-sm animate-fade-in flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-slide-up">
        <button onClick={() => setSelectedExpense(null)} className="absolute top-6 right-6 w-11 h-11 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 z-50">
          <X size={24} />
        </button>
        <div className="overflow-y-auto scrollbar-hide flex-1" ref={receiptRef}>
          <div className="p-8 pt-12 text-center relative">
            <div className="w-24 h-24 orange-gradient rounded-full mx-auto flex items-center justify-center text-white text-5xl mb-6 shadow-xl border-4 border-white">{CATEGORY_ICONS[exp.category]}</div>
            <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-1">{group.currency}{exp.amount}</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{exp.caption}</p>
            <div className="mt-8 border-t-2 border-dashed border-slate-100 pt-8 space-y-4 text-left">
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Transaction ID</span>
                <span className="font-black text-slate-800 uppercase">#VLT-{exp.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-widest">Date</span>
                <span className="font-black text-slate-800 uppercase">{exp.date}</span>
              </div>
            </div>
            <div className="mt-8 border-t-2 border-dashed border-slate-100 pt-8 text-left">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Splits</h3>
              <div className="space-y-3">
                {exp.participants.map(pId => {
                  const user = group.users.find(u => u.id === pId);
                  return (
                    <div key={pId} className="flex items-center justify-between font-bold text-xs">
                      <span>{user?.emoji} {user?.name}</span>
                      <span>{group.currency}{(exp.amount / exp.participants.length).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="mt-12 text-center">
              <CheckCircle2 size={32} className="text-emerald-500 mx-auto" />
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mt-2">Verified Transaction</p>
            </div>
          </div>
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
          <button onClick={handleDownloadPDF} className="flex-1 bg-white border border-slate-200 text-slate-800 py-5 rounded-[2rem] font-black text-sm shadow-soft flex items-center justify-center gap-2 active:scale-95 transition-all"><Download size={20} /> PDF</button>
          <button onClick={() => shareReceipt(exp)} className="flex-1 orange-gradient text-white py-5 rounded-[2rem] font-black text-sm shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Share2 size={20} /> Share</button>
        </div>
      </div>
    </div>
  );

  const renderSettingsModal = () => (
    <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-end animate-fade-in" onClick={() => setIsSettingsOpen(false)}>
      <div className="bg-white w-full rounded-t-[3rem] p-8 h-[75vh] overflow-y-auto shadow-huge animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Vault Settings</h2>
          <button onClick={() => setIsSettingsOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-8">
          {/* Group Settings */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Group Configuration</h3>
            <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Vault Currency</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Affects all expenses</p>
                </div>
                <select
                  value={group.currency}
                  onChange={(e) => onUpdateGroup({ ...group, currency: e.target.value })}
                  className="bg-white px-4 py-2 rounded-xl text-sm font-black text-orange-500 border border-slate-200 outline-none"
                >
                  {['₹', '$', '€', '£', '¥'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Vault Code</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Share this to add members</p>
                </div>
                <div className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-black border border-indigo-100">
                  {group.groupCode}
                </div>
              </div>
            </div>
          </div>

          {/* Notification Settings */}
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">My Preferences</h3>
            <div className="p-6 bg-slate-50 rounded-3xl space-y-4 border border-slate-100">
              <div className="flex items-center justify-between">
                <p className="text-sm font-extrabold text-slate-800">New Expenses</p>
                <div
                  onClick={() => {
                    const prefs = { ...currentUser!.notificationPrefs, newExpenses: !currentUser!.notificationPrefs?.newExpenses };
                    onUpdateGroup({
                      ...group,
                      users: group.users.map(u => u.id === currentUser!.id ? { ...u, notificationPrefs: prefs } : u)
                    });
                  }}
                  className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${currentUser?.notificationPrefs?.newExpenses ? 'bg-orange-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentUser?.notificationPrefs?.newExpenses ? 'left-7' : 'left-1'}`}></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <p className="text-sm font-extrabold text-slate-800">Balance Analytics</p>
                <div
                  onClick={() => {
                    const prefs = { ...currentUser!.notificationPrefs, balanceChanges: !currentUser!.notificationPrefs?.balanceChanges };
                    onUpdateGroup({
                      ...group,
                      users: group.users.map(u => u.id === currentUser!.id ? { ...u, notificationPrefs: prefs } : u)
                    });
                  }}
                  className={`w-12 h-6 rounded-full transition-all relative cursor-pointer ${currentUser?.notificationPrefs?.balanceChanges ? 'bg-orange-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${currentUser?.notificationPrefs?.balanceChanges ? 'left-7' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="w-full orange-gradient text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              Update Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      {selectedExpense && renderDetailView(selectedExpense)}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'activity' && (
        <div className="flex-1 overflow-y-auto px-5 pt-12 pb-32 scrollbar-hide animate-fade-in">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-slate-800">History</h2>
            <History className="text-orange-500" />
          </div>
          <div className="space-y-4">
            {group.expenses.map(e => (
              <div key={e.id} onClick={() => handleSelectExpense(e)} className="bg-white p-5 rounded-[2rem] shadow-soft border border-orange-50 flex items-center justify-between cursor-pointer active:scale-95 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: CATEGORY_COLORS[e.category] + '20', color: CATEGORY_COLORS[e.category] }}>{CATEGORY_ICONS[e.category]}</div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-sm">{e.caption}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{e.date}</p>
                  </div>
                </div>
                <p className="font-black text-slate-800">{group.currency}{e.amount}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'map' && <div className="flex-1 overflow-hidden p-5 pb-36 active:scale-100 transition-all"><FullMapView expenses={group.expenses} currency={group.currency} /></div>}
      {activeTab === 'chat' && <div className="flex-1 overflow-hidden p-5 pb-36 active:scale-100 transition-all"><ChatBot currency={group.currency} userEmoji={currentUser?.emoji || '👤'} /></div>}
      {activeTab === 'profile' && (
        <div className="flex-1 overflow-y-auto p-10 flex flex-col items-center justify-center space-y-6 pb-36 font-inter">
          <div className="w-32 h-32 bg-white rounded-[2.5rem] shadow-premium flex items-center justify-center text-6xl border-4 border-orange-50">
            {currentUser?.emoji}
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">{currentUser?.name}</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">Vault Member</p>
          </div>

          <div className="w-full max-w-xs space-y-3">
            <button onClick={onLockSession} className="w-full bg-slate-900 text-white py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              <Lock size={18} /> Lock Session
            </button>

            {group.pin ? (
              <button
                onClick={() => onSetPin('')}
                className="w-full bg-indigo-50 text-indigo-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-indigo-100 shadow-soft active:scale-95 transition-all"
              >
                <ShieldOff size={18} /> Disable Vault PIN
              </button>
            ) : (
              <button
                onClick={() => {
                  setPinMode('GROUP');
                  setIsSettingPin(true);
                }}
                className="w-full bg-indigo-50 text-indigo-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-indigo-100 shadow-soft active:scale-95 transition-all"
              >
                <ShieldCheck size={18} /> Set Vault PIN
              </button>
            )}

            {currentUser?.pin ? (
              <button
                onClick={() => onUpdateGroup({
                  ...group,
                  users: group.users.map(u => u.id === currentUser.id ? { ...u, pin: undefined } : u)
                })}
                className="w-full bg-slate-50 text-slate-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-200 shadow-soft active:scale-95 transition-all"
              >
                <Lock size={18} /> Disable Personal PIN
              </button>
            ) : (
              <button
                onClick={() => {
                  setPinMode('USER');
                  setIsSettingPin(true);
                }}
                className="w-full bg-orange-50 text-orange-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-orange-100 shadow-soft active:scale-95 transition-all"
              >
                <ShieldCheck size={18} /> Set Personal PIN
              </button>
            )}

            <button onClick={() => setIsSettingsOpen(true)} className="w-full bg-white text-slate-600 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-100 shadow-soft active:scale-95 transition-all">
              <Settings size={18} /> Account Settings
            </button>

            <button onClick={onShowDocumentation} className="w-full bg-white text-slate-600 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-slate-100 shadow-soft active:scale-95 transition-all">
              <FileText size={18} /> Vault Documents
            </button>

            <button onClick={onReset} className="w-full bg-rose-50 text-rose-500 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 border border-rose-100 shadow-soft active:scale-95 transition-all">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </div>
      )}

      <div className="absolute bottom-6 left-6 right-8 h-20 bg-white/40 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_32px_0_rgba(31,38,135,0.07)] flex items-center justify-around px-2 z-[500] border border-white/60 text-slate-400">
        <button onClick={() => setActiveTab('home')} className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeTab === 'home' ? 'text-orange-500 scale-110' : 'hover:text-slate-600'}`}>
          <Home size={20} className={activeTab === 'home' ? 'fill-orange-500/10' : ''} />
          <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
        </button>
        <button onClick={() => setActiveTab('activity')} className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeTab === 'activity' ? 'text-orange-500 scale-110' : 'hover:text-slate-600'}`}>
          <Briefcase size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">History</span>
        </button>
        <button onClick={() => setIsModalOpen(true)} className="w-14 h-14 orange-gradient rounded-full flex items-center justify-center shadow-[0_8px_20px_-4px_rgba(249,115,22,0.4)] -translate-y-6 scale-110 active:scale-95 transition-all text-white border-4 border-white/50">
          <Plus size={28} />
        </button>
        <button onClick={() => setActiveTab('map')} className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeTab === 'map' ? 'text-orange-500 scale-110' : 'hover:text-slate-600'}`}>
          <MapIcon size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">Vault</span>
        </button>
        <button onClick={() => setActiveTab('chat')} className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeTab === 'chat' ? 'text-orange-500 scale-110' : 'hover:text-slate-600'}`}>
          <Sparkles size={20} className={activeTab === 'chat' ? 'fill-orange-500/10' : ''} />
          <span className="text-[8px] font-black uppercase tracking-widest">Insight</span>
        </button>
        <button onClick={() => setActiveTab('profile')} className={`flex flex-col items-center gap-0.5 transition-all duration-300 ${activeTab === 'profile' ? 'text-orange-500 scale-110' : 'hover:text-slate-600'}`}>
          <UserIcon size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">Me</span>
        </button>
      </div>

      {isModalOpen && <ExpenseModal users={group.users} currentUserId={group.currentUserId!} currency={group.currency} onClose={() => setIsModalOpen(false)} onSubmit={(exp) => { onAddExpense(exp); setIsModalOpen(false); }} />}
      {isNotificationsOpen && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/40 backdrop-blur-sm flex items-end animate-fade-in" onClick={() => setIsNotificationsOpen(false)}>
          <div className="bg-white w-full rounded-t-[3rem] p-8 h-[60vh] overflow-y-auto shadow-huge animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-xl font-black text-slate-800">Alert Center</h2>
              <button onClick={() => setIsNotificationsOpen(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400">
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              {group.notifications.length > 0 ? group.notifications.map(n => (
                <div key={n.id} className="p-5 bg-orange-50/50 rounded-2xl border border-orange-100 flex gap-4">
                  <div className="w-12 h-12 rounded-2xl orange-gradient flex items-center justify-center text-white shadow-lg shrink-0">
                    <AlertTriangle size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-extrabold text-slate-800 leading-snug">{n.message}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{n.timestamp}</p>
                  </div>
                </div>
              )) : <p className="text-center py-20 opacity-30 italic font-bold text-slate-400 uppercase tracking-widest text-[10px]">Silence in the vault.</p>}
            </div>
          </div>
        </div>
      )}

      {isSettingsOpen && renderSettingsModal()}

      {isSettingPin && (
        <PinAuthentication
          mode="SETUP"
          onComplete={(pin) => {
            if (pinMode === 'GROUP') {
              onSetPin(pin);
            } else {
              onUpdateGroup({
                ...group,
                users: group.users.map(u => u.id === currentUser?.id ? { ...u, pin } : u)
              });
              alert('Personal PIN set successfully!');
            }
            setIsSettingPin(false);
          }}
          onCancel={() => setIsSettingPin(false)}
        />
      )}
    </div>
  );
};
