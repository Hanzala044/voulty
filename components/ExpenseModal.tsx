
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Upload,
  Lock,
  Unlock,
  ChevronDown,
  Users,
  MapPin,
  Image as ImageIcon,
  Check,
  Calendar as CalendarIcon,
  Sparkles,
  Loader2,
  FileText,
  User as UserIcon,
  CheckCircle,
  Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Category, User, Expense, SplitType, Split, Location } from '../types';
import { CATEGORY_ICONS, CATEGORY_COLORS } from '../constants';

interface Props {
  users: User[];
  currentUserId: string;
  currency: string;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, 'id'>) => void;
  prefilledLocation?: { lat: number, lng: number };
}

export const ExpenseModal: React.FC<Props> = ({
  users,
  currentUserId,
  currency,
  onClose,
  onSubmit,
  prefilledLocation
}) => {
  const [caption, setCaption] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>(Category.FOOD);
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [participants, setParticipants] = useState<string[]>(users.map(u => u.id));
  const [splitType, setSplitType] = useState<SplitType>('EQUAL');
  const [splits, setSplits] = useState<Split[]>(users.map(u => ({ userId: u.id, value: 0 })));
  const [isPrivate, setIsPrivate] = useState(false);
  const [location, setLocation] = useState<{ lat: number, lng: number, name?: string } | undefined>(prefilledLocation);
  const [invoiceData, setInvoiceData] = useState<string | undefined>();
  const [fileName, setFileName] = useState<string | undefined>();
  const [dueDate, setDueDate] = useState('');
  const [isCategorizing, setIsCategorizing] = useState(false);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (splitType === 'SHARES') {
      setSplits(participants.map(uid => ({ userId: uid, value: 1 })));
    } else if (splitType === 'EXACT') {
      setSplits(participants.map(uid => ({ userId: uid, value: 0 })));
    }
  }, [splitType, participants]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      setInvoiceData(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const autoCategorize = async (val: string) => {
    if (val.length < 3) return;
    setIsCategorizing(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey.length < 20) {
        console.warn("Invalid API Key format detected in ExpenseModal");
        setIsCategorizing(false);
        return;
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const response = await model.generateContent(`Categorize "${val}" into: ${Object.values(Category).join(', ')}. Return ONLY the word accurately.`);
      const suggested = response.response.text()?.trim() as Category;
      if (Object.values(Category).includes(suggested)) setCategory(suggested);
    } catch (e) { console.error(e); } finally { setIsCategorizing(false); }
  };

  const captureLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsCapturingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          name: 'Current Location'
        });
        setIsCapturingLocation(false);
      },
      (error) => {
        console.error('Location error:', error);
        alert('Failed to get location. Please enable location services.');
        setIsCapturingLocation(false);
      }
    );
  };

  const toggleParticipant = (userId: string) => {
    setParticipants(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const updateSplitValue = (userId: string, value: string) => {
    const numValue = parseFloat(value) || 0;
    setSplits(prev => prev.map(s => s.userId === userId ? { ...s, value: numValue } : s));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalAmount = parseFloat(amount);
    if (!caption || !totalAmount || participants.length === 0) return;

    if (splitType === 'EXACT') {
      const sum = splits.reduce((acc, s) => acc + s.value, 0);
      if (Math.abs(sum - totalAmount) > 0.01) {
        alert(`Exact amounts must sum up to ${currency}${totalAmount}.`);
        return;
      }
    }

    // Automatically fetch current date and time
    const now = new Date();
    const timestamp = now.getTime();
    const dateStr = now.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true
    });

    onSubmit({
      caption,
      amount: totalAmount,
      category,
      paidBy,
      isPrivate,
      participants,
      splitType,
      splits: (splitType === 'EQUAL') ? undefined : splits.filter(s => participants.includes(s.userId)),
      location,
      invoiceData,
      dueDate: dueDate || undefined,
      timestamp,
      date: dateStr,
    });
  };

  const CustomDropdown = ({
    label,
    value,
    options,
    onChange,
    icon: Icon,
    renderOption,
    getOptionKey = (o) => o.id || o,
    iconColor
  }: {
    label: string,
    value: any,
    options: any[],
    onChange: (val: any) => void,
    icon?: any,
    renderOption: (opt: any) => React.ReactNode,
    getOptionKey?: (opt: any) => string,
    iconColor?: string
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedValue = typeof value === 'object' && value !== null ? getOptionKey(value) : value;
    const selectedOption = options.find(o => getOptionKey(o) === selectedValue);

    return (
      <div className="relative" ref={containerRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 pl-12 rounded-2xl bg-orange-50 border-none font-bold text-xs focus:ring-2 focus:ring-orange-200 outline-none text-orange-600 transition-all hover:bg-orange-100/50 text-left h-14"
        >
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="absolute left-4" style={{ color: iconColor || '#f97316' }} />}
            <span className="truncate">{selectedOption ? renderOption(selectedOption) : label}</span>
          </div>
          <ChevronDown size={14} className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 mt-2 z-[3000] bg-white rounded-2xl shadow-2xl border border-orange-50 p-2 max-h-60 overflow-y-auto scrollbar-hide"
            >
              {options.map((opt) => {
                const optId = getOptionKey(opt);
                const isSelected = optId === selectedValue;
                return (
                  <button
                    key={optId}
                    type="button"
                    onClick={() => {
                      onChange(opt);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left p-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-between group mb-1 ${isSelected ? 'bg-orange-500 text-white shadow-lg' : 'hover:bg-orange-50 text-slate-800'}`}
                  >
                    <span className="truncate">{renderOption(opt)}</span>
                    {isSelected && <Check size={14} />}
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[2500] flex items-end animate-fade-in">
      <div className="bg-white w-full rounded-t-[3.5rem] p-8 max-h-[95vh] overflow-y-auto scrollbar-hide flex flex-col shadow-2xl animate-slide-up">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-black text-slate-800">New Entry</h2>
          <button onClick={onClose} className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shadow-soft">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 pb-10">
          <div className="space-y-2">
            <div className="relative">
              <input
                type="text"
                placeholder="What service/item?"
                value={caption}
                onChange={e => setCaption(e.target.value)}
                className="w-full text-2xl font-black placeholder:text-slate-200 outline-none border-none focus:placeholder:opacity-0 transition-all pr-12"
                required
              />
              <button type="button" onClick={() => autoCategorize(caption)} className={`absolute right-0 top-1/2 -translate-y-1/2 p-2 ${isCategorizing ? 'animate-pulse' : 'text-orange-400'}`}>
                {isCategorizing ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-5xl font-black text-slate-300">{currency}</span>
              <input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} className="w-full text-6xl font-black outline-none placeholder:text-slate-100 transition-all" required />
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Member & Type</label>
            <div className="grid grid-cols-2 gap-4">
              <CustomDropdown
                label="Paid By"
                value={users.find(u => u.id === paidBy) || users[0]} // Ensure a User object is passed
                options={users}
                onChange={(user) => setPaidBy(user.id)}
                icon={UserIcon}
                renderOption={(u) => `${u.emoji} ${u.name}`}
                getOptionKey={(u) => u.id}
              />

              <CustomDropdown
                label="Category"
                value={category}
                options={Object.values(Category)}
                onChange={setCategory}
                icon={Tag}
                renderOption={(cat) => (
                  <span className="flex items-center gap-2" style={{ color: CATEGORY_COLORS[cat] }}>
                    {CATEGORY_ICONS[cat]} {cat}
                  </span>
                )}
                iconColor={CATEGORY_COLORS[category]}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between ml-1">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Participants</label>
              <span className="text-[9px] font-black text-orange-500 bg-orange-50 px-2 py-1 rounded-full">{participants.length} Active</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {users.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => toggleParticipant(u.id)}
                  className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${participants.includes(u.id) ? 'bg-orange-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400 opacity-60'}`}
                >
                  {u.emoji} {u.name}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Split Strategy</label>
            <CustomDropdown
              label="Select Strategy"
              value={splitType}
              options={['EQUAL', 'EXACT', 'SHARES']}
              onChange={setSplitType}
              icon={Loader2}
              renderOption={(type) => (
                <div className="flex items-center justify-between w-full text-left">
                  <span>{type}</span>
                  <span className="text-[8px] opacity-60 font-medium lowercase">
                    {type === 'EQUAL' && 'Split evenly'}
                    {type === 'EXACT' && 'Specific amounts'}
                    {type === 'SHARES' && 'Proportional shares'}
                  </span>
                </div>
              )}
            />
          </div>

          {splitType !== 'EQUAL' && (
            <div className="space-y-3 p-4 bg-slate-50 rounded-[2rem] animate-fade-in border border-slate-100">
              {splits.filter(s => participants.includes(s.userId)).map(s => (
                <div key={s.userId} className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-500 uppercase">{users.find(u => u.id === s.userId)?.name}</span>
                  <div className="flex items-center gap-2">
                    {splitType === 'EXACT' && <span className="text-xs font-black text-slate-300">{currency}</span>}
                    <input
                      type="number"
                      value={splits.find(sp => sp.userId === s.userId)?.value || ''}
                      onChange={(e) => updateSplitValue(s.userId, e.target.value)}
                      className="w-20 bg-white p-2 rounded-xl text-right font-black text-xs outline-none focus:ring-1 focus:ring-orange-200"
                      placeholder="0"
                    />
                    {splitType === 'SHARES' && <span className="text-[10px] font-black text-slate-300">Parts</span>}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <button type="button" onClick={() => fileInputRef.current?.click()} className={`flex flex-col items-center justify-center gap-2 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${invoiceData ? 'bg-orange-600 text-white shadow-xl shadow-orange-100' : 'bg-orange-50 text-orange-400'}`}>
              <ImageIcon size={24} />
              {fileName ? fileName : 'Attach Receipt'}
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleFileUpload} />
            </button>
            <button
              type="button"
              onClick={captureLocation}
              disabled={isCapturingLocation}
              className={`flex flex-col items-center justify-center gap-2 py-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest transition-all ${location ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-indigo-50 text-indigo-400'}`}
            >
              {isCapturingLocation ? <Loader2 size={24} className="animate-spin" /> : <MapPin size={24} />}
              {location ? 'Location Captured' : 'Tag Location'}
            </button>
          </div>

          {location && (
            <div className="p-4 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center gap-4 animate-fade-in">
              <div className="w-12 h-12 rounded-2xl bg-white shadow-soft flex items-center justify-center text-indigo-500">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pin Dropped</p>
                <p className="text-sm font-bold text-indigo-900">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</p>
              </div>
              <button type="button" onClick={() => setLocation(undefined)} className="p-2 text-indigo-300 hover:text-rose-500 transition-colors">
                <X size={18} />
              </button>
            </div>
          )}

          {invoiceData && (
            <div className="p-4 bg-orange-50 rounded-[2rem] border border-orange-100 flex items-center gap-4 animate-fade-in">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white shadow-soft flex items-center justify-center">
                {invoiceData.startsWith('data:image') ? (
                  <img src={invoiceData} alt="Thumbnail" className="w-full h-full object-cover" />
                ) : (
                  <FileText className="text-orange-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-orange-400">File Captured</p>
                <p className="text-xs font-bold text-slate-800 truncate">{fileName}</p>
              </div>
              <button type="button" onClick={() => { setInvoiceData(undefined); setFileName(undefined); }} className="p-2 text-rose-500"><X size={18} /></button>
            </div>
          )}

          <div className="bg-slate-900 rounded-[2.5rem] p-6 flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center">
                {isPrivate ? <Lock size={20} className="text-amber-400" /> : <Unlock size={20} className="text-orange-400" />}
              </div>
              <div>
                <p className="text-white font-black text-sm">Ghost Mode</p>
                <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest">Personal Entry</p>
              </div>
            </div>
            <button type="button" onClick={() => setIsPrivate(!isPrivate)} className={`w-14 h-7 rounded-full relative transition-all duration-300 ${isPrivate ? 'bg-orange-500' : 'bg-white/10'}`}>
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-300 shadow-lg ${isPrivate ? 'left-8' : 'left-1'}`}></div>
            </button>
          </div>

          <button type="submit" className="w-full orange-gradient text-white py-6 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-orange-100 active:scale-95 transition-all">
            Lock Transaction
          </button>
        </form>
      </div>
    </div>
  );
};
