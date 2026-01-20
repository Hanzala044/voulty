
import React, { useState, useRef } from 'react';
import { ArrowLeft, FileText, Download, Calendar, Tag, User as UserIcon, Plus, X, Image as ImageIcon, Share2, Clock, Eye, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GroupState, Expense, VaultDocument } from '../types';
import { CATEGORY_COLORS, CATEGORY_ICONS } from '../constants';

interface Props {
    group: GroupState;
    onBack: () => void;
    onAddDocument: (doc: Omit<VaultDocument, 'id' | 'timestamp'>) => void;
}

export const Documentation: React.FC<Props> = ({ group, onBack, onAddDocument }) => {
    const [activeTab, setActiveTab] = useState<'financial' | 'general'>('financial');
    const [isUploadOpen, setIsUploadOpen] = useState(false);
    const [viewingDoc, setViewingDoc] = useState<VaultDocument | Expense | null>(null);
    const [isSharing, setIsSharing] = useState(false);

    const [newDoc, setNewDoc] = useState({
        title: '',
        category: 'General',
        fileData: '',
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setNewDoc({ ...newDoc, fileData: event.target?.result as string });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmitDoc = () => {
        if (!newDoc.title || !newDoc.fileData) {
            alert('Please provide a title and a file.');
            return;
        }
        onAddDocument({
            title: newDoc.title,
            category: newDoc.category,
            fileData: newDoc.fileData,
            date: newDoc.date,
            time: newDoc.time,
            uploaderId: group.currentUserId!
        });
        setNewDoc({
            title: '',
            category: 'General',
            fileData: '',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
        });
        setIsUploadOpen(false);
    };

    const shareAsPDF = () => {
        setIsSharing(true);
        setTimeout(() => {
            window.print();
            setIsSharing(false);
        }, 500);
    };

    return (
        <div className={`fixed inset-0 z-[2000] bg-slate-50 flex flex-col animate-fade-in overflow-hidden ${isSharing ? 'print-mode' : ''}`}>
            {/* Header */}
            <div className="bg-white px-6 pt-12 pb-2 flex flex-col border-b border-slate-100 shadow-sm relative z-10 no-print">
                <div className="flex items-center justify-between mb-4">
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onBack}
                        className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 active:scale-95 transition-all"
                    >
                        <ArrowLeft size={20} />
                    </motion.button>
                    <div className="text-center">
                        <h2 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1">Vault <span className="text-orange-500 italic">Docs</span></h2>
                        <div className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-full text-[8px] font-black text-slate-400 uppercase tracking-widest">
                            <Sparkles size={8} className="text-orange-500" /> {group.groupCode}
                        </div>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={shareAsPDF}
                        className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 active:scale-95 transition-all"
                    >
                        <Share2 size={20} />
                    </motion.button>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 px-2">
                    {['financial', 'general'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`flex-1 pb-3 text-[10px] font-black uppercase tracking-widest transition-all relative ${activeTab === tab ? 'text-orange-500' : 'text-slate-400'}`}
                        >
                            {tab === 'financial' ? 'Financial Records' : 'Vault Documents'}
                            {activeTab === tab && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-8 space-y-6 scrollbar-hide pb-24 print:px-0">
                <div className="hidden print:block mb-8 text-center border-b pb-8">
                    <h1 className="text-4xl font-black uppercase italic tracking-tighter mb-2">Vaulty Report</h1>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.3em] text-[10px]">{group.groupCode} • Generated on {new Date().toLocaleDateString()}</p>
                </div>

                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: activeTab === 'financial' ? -20 : 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: activeTab === 'financial' ? 20 : -20 }}
                        className="space-y-4"
                    >
                        {activeTab === 'financial' ? (
                            group.expenses.length > 0 ? (
                                group.expenses.map((exp, idx) => (
                                    <motion.div
                                        key={exp.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        onClick={() => (exp.invoiceData || exp.paymentProof) && setViewingDoc(exp)}
                                        className={`bg-white rounded-[2.5rem] border border-slate-100 shadow-soft overflow-hidden group hover:border-orange-200 transition-all cursor-pointer no-print active:scale-[0.98]`}
                                    >
                                        <div className="p-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className="w-14 h-14 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner no-print"
                                                        style={{
                                                            backgroundColor: CATEGORY_COLORS[exp.category as keyof typeof CATEGORY_COLORS] + '15',
                                                            color: CATEGORY_COLORS[exp.category as keyof typeof CATEGORY_COLORS]
                                                        }}
                                                    >
                                                        {CATEGORY_ICONS[exp.category as keyof typeof CATEGORY_ICONS]}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-black text-slate-800 mb-0.5">{exp.caption}</h3>
                                                        <div className="flex items-center gap-2">
                                                            <span className="px-2 py-0.5 bg-slate-100 rounded-md text-[8px] font-black text-slate-500 uppercase tracking-wider">{exp.category}</span>
                                                            {exp.isPaid && <span className="px-2 py-0.5 bg-emerald-100 rounded-md text-[8px] font-black text-emerald-600 uppercase tracking-wider">Verified</span>}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-black text-slate-800 leading-tight">{group.currency}{exp.amount.toLocaleString()}</p>
                                                    <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 text-right">Value</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3 mt-4 pt-4 border-t border-slate-50">
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <Calendar size={12} className="text-orange-500/50" />
                                                    <div>
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">Date</p>
                                                        <p className="text-[10px] font-bold text-slate-700">{exp.date}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-500">
                                                    <UserIcon size={12} className="text-indigo-500/50" />
                                                    <div>
                                                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-widest leading-none mb-0.5">By</p>
                                                        <p className="text-[10px] font-bold text-slate-700">{group.users.find(u => u.id === exp.paidBy)?.name || 'Member'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-50 px-6 py-2.5 flex items-center justify-between group-hover:bg-orange-50 transition-colors no-print">
                                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">DOC ID: {exp.id.slice(-6).toUpperCase()}</span>
                                            <div className="flex gap-2 items-center">
                                                {(exp.invoiceData || exp.paymentProof) && (
                                                    <div className="flex gap-1 mr-2 border-r border-slate-200 pr-2">
                                                        {exp.invoiceData && <FileText size={10} className="text-orange-400" />}
                                                        {exp.paymentProof && <Tag size={10} className="text-emerald-400" />}
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                                    View <Eye size={10} className="text-orange-500" />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center opacity-40 no-print">
                                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                        <FileText size={32} className="text-slate-300" />
                                    </div>
                                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No Financial Records</p>
                                </div>
                            )
                        ) : (
                            /* General Documents List */
                            <div className="space-y-4">
                                {(group.documents || []).length > 0 ? (
                                    group.documents.map((doc, idx) => (
                                        <motion.div
                                            key={doc.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: idx * 0.05 }}
                                            onClick={() => setViewingDoc(doc)}
                                            className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-soft flex items-center justify-between group hover:border-orange-200 transition-all cursor-pointer active:scale-[0.98]"
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 no-print group-hover:bg-indigo-500 group-hover:text-white transition-all duration-300">
                                                    <FileText size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black text-slate-800 mb-1">{doc.title}</h4>
                                                    <div className="flex items-center gap-2">
                                                        <span className="bg-slate-100 px-2 py-0.5 rounded text-[8px] font-black text-slate-400 uppercase tracking-widest">{doc.category}</span>
                                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                                        <span className="text-[9px] font-bold text-slate-400">{doc.date} • <span className="text-orange-500 font-black">{doc.time}</span></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 no-print opacity-0 group-hover:opacity-100 transition-opacity">
                                                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-orange-500 transition-colors">
                                                    <Eye size={18} />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 text-center opacity-40 no-print">
                                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                                            <FileText size={32} className="text-slate-300" />
                                        </div>
                                        <p className="text-xs font-black text-slate-500 uppercase tracking-widest">No Vault Documents</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Floating Action Button for Pure Documents */}
            <AnimatePresence>
                {activeTab === 'general' && (
                    <motion.button
                        initial={{ scale: 0, rotate: -90 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 90 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsUploadOpen(true)}
                        className="fixed bottom-10 right-8 w-16 h-16 orange-gradient rounded-full flex items-center justify-center text-white shadow-2xl hover:shadow-orange-200 transition-all z-[2100] no-print"
                    >
                        <Plus size={32} />
                    </motion.button>
                )}
            </AnimatePresence>

            {/* Upload Modal */}
            <AnimatePresence>
                {isUploadOpen && (
                    <div className="fixed inset-0 z-[3000] no-print">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsUploadOpen(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[3.5rem] p-8 space-y-6 max-h-[90vh] overflow-y-auto scrollbar-hide shadow-premium"
                        >
                            <div className="flex justify-between items-center mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                                        <Plus size={24} />
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-800 tracking-tight italic">New Document</h2>
                                </div>
                                <button onClick={() => setIsUploadOpen(false)} className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-300 hover:text-slate-800 transition-colors"><X /></button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Document Title</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newDoc.title}
                                        onChange={(e) => setNewDoc({ ...newDoc, title: e.target.value })}
                                        placeholder="e.g. Hotel Booking, Itinerary"
                                        className="w-full h-16 bg-slate-50 rounded-2xl px-6 font-bold text-slate-800 outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Date</label>
                                        <div className="relative group">
                                            <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                            <input
                                                type="date"
                                                value={newDoc.date}
                                                onChange={(e) => setNewDoc({ ...newDoc, date: e.target.value })}
                                                className="w-full h-16 bg-slate-50 rounded-2xl pl-14 pr-4 font-bold text-slate-800 outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Time</label>
                                        <div className="relative group">
                                            <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors" />
                                            <input
                                                type="time"
                                                value={newDoc.time}
                                                onChange={(e) => setNewDoc({ ...newDoc, time: e.target.value })}
                                                className="w-full h-16 bg-slate-50 rounded-2xl pl-14 pr-4 font-bold text-slate-800 outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Category</label>
                                    <div className="relative group">
                                        <Tag size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                        <select
                                            value={newDoc.category}
                                            onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value })}
                                            className="w-full h-16 bg-slate-50 rounded-2xl pl-14 pr-6 font-bold text-slate-800 outline-none border border-transparent focus:border-orange-500 focus:bg-white transition-all shadow-inner appearance-none"
                                        >
                                            <option>General</option>
                                            <option>Accommodation</option>
                                            <option>Transport</option>
                                            <option>Activity</option>
                                            <option>Insurance</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block ml-2">Upload Source (PDF/Image)</label>
                                    <motion.button
                                        whileHover={{ scale: 1.01 }}
                                        whileTap={{ scale: 0.99 }}
                                        onClick={() => fileInputRef.current?.click()}
                                        className={`w-full h-32 rounded-[2.5rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all ${newDoc.fileData ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-slate-50 border-slate-200 text-slate-400'}`}
                                    >
                                        {newDoc.fileData ? <Eye size={32} /> : <ImageIcon size={32} />}
                                        <span className="text-[10px] font-black uppercase tracking-widest">{newDoc.fileData ? 'File Captured' : 'Select Attachment'}</span>
                                    </motion.button>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={handleFileUpload}
                                        accept="image/*,.pdf"
                                    />
                                </div>
                            </div>

                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleSubmitDoc}
                                className="w-full orange-gradient text-white py-6 rounded-[2.5rem] font-black text-lg shadow-xl shadow-orange-100 flex items-center justify-center gap-2"
                            >
                                <Plus size={24} /> Add to Vault
                            </motion.button>
                            <div className="h-8" />
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Document Viewer Modal (Expanded View) */}
            <AnimatePresence>
                {viewingDoc && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[4000] bg-slate-900/95 backdrop-blur-xl flex flex-col no-print"
                    >
                        <div className="p-8 pb-4 flex items-center justify-between text-white shrink-0">
                            <div className="flex items-center gap-5">
                                <motion.button
                                    whileHover={{ scale: 1.1 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setViewingDoc(null)}
                                    className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10"
                                >
                                    <ArrowLeft size={24} />
                                </motion.button>
                                <div>
                                    <h2 className="text-xl font-black truncate max-w-[180px] tracking-tight">{('title' in viewingDoc ? viewingDoc.title : viewingDoc.caption)}</h2>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{viewingDoc.date} {('time' in viewingDoc ? `• ${viewingDoc.time}` : '')}</p>
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                    const link = document.createElement('a');
                                    const data = ('fileData' in viewingDoc ? viewingDoc.fileData : (viewingDoc.invoiceData || viewingDoc.paymentProof)) || '';
                                    link.href = data;
                                    link.download = (('title' in viewingDoc ? viewingDoc.title : viewingDoc.caption) || 'document').replace(/\s+/g, '_').toLowerCase();
                                    link.click();
                                }}
                                className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 text-orange-500"
                            >
                                <Download size={24} />
                            </motion.button>
                        </div>

                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="flex-1 bg-white/5 m-6 mt-2 rounded-[3rem] overflow-hidden flex items-center justify-center relative border border-white/10 shadow-2xl"
                        >
                            {(() => {
                                const fileData = 'fileData' in viewingDoc ? viewingDoc.fileData : (viewingDoc.invoiceData || viewingDoc.paymentProof);
                                if (!fileData) return <div className="text-white opacity-10 flex flex-col items-center gap-4"><FileText size={80} /><p className="font-black uppercase tracking-widest">No Content</p></div>;

                                if (fileData.startsWith('data:image')) {
                                    return <img src={fileData} alt="Preview" className="max-w-full max-h-full object-contain animate-fade-in" />;
                                } else if (fileData.includes('pdf')) {
                                    return (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-white overflow-hidden">
                                            <div className="flex flex-col items-center gap-3 animate-pulse">
                                                <FileText size={80} className="text-orange-500" />
                                                <p className="font-black uppercase tracking-widest text-xs">Decrypting PDF Content...</p>
                                            </div>
                                            <iframe
                                                src={fileData + '#toolbar=0&navpanes=0&scrollbar=0'}
                                                className="w-full h-full absolute inset-0 bg-white border-0"
                                                title="PDF Preview"
                                                style={{ colorScheme: 'light' }}
                                            />
                                            {/* Overlay to prevent some interactions if needed, but iframe is better for scroll */}
                                        </div>
                                    );
                                }
                                return <div className="text-white opacity-10"><FileText size={80} /></div>;
                            })()}
                        </motion.div>

                        <div className="p-8 pt-0 flex justify-center no-print">
                            <p className="text-[8px] font-black text-white/30 uppercase tracking-[0.5em]">Vaulty Secure Viewer • 256-bit AES</p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
        @media print {
            .no-print { display: none !important; }
            .print-mode { background: white !important; width: 100% !important; height: auto !important; position: relative !important; }
            .print-mode * { color: black !important; border-color: #eee !important; box-shadow: none !important; }
            .bg-white { background: white !important; }
            .flex-1 { overflow: visible !important; }
        }
        
        .shadow-premium {
            box-shadow: 0 50px 100px -20px rgba(0,0,0,0.1), 0 30px 60px -30px rgba(0,0,0,0.15);
        }
        
        iframe::-webkit-scrollbar {
            display: none;
        }
      `}</style>
        </div>
    );
};
