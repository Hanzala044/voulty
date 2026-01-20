
import React, { useState } from 'react';
import { Lock, ArrowLeft, LogOut } from 'lucide-react';

interface Props {
    groupCode: string;
    onUnlock: (code: string, name: string) => void;
    onLogout: () => void;
}

export const UnlockScreen: React.FC<Props> = ({ groupCode, onUnlock, onLogout }) => {
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !code.trim()) {
            setError('Please fill in all fields');
            return;
        }
        onUnlock(code.toUpperCase(), name);
    };

    const maskedCode = groupCode.substring(0, 2) + '****';

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8 animate-fade-in">
            <div className="w-full max-w-md">
                <div className="text-center mb-12">
                    <div className="w-24 h-24 mx-auto mb-6 orange-gradient rounded-[2rem] flex items-center justify-center shadow-2xl">
                        <Lock size={48} className="text-white" />
                    </div>
                    <h1 className="text-3xl font-black text-slate-800 mb-2">Session Locked</h1>
                    <p className="text-slate-400 font-bold text-sm">
                        Vault Code: <span className="font-mono text-orange-500">{maskedCode}</span>
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-2xl animate-fade-in">
                        <p className="text-rose-600 text-sm font-bold text-center">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Group Code
                        </label>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => {
                                setCode(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter vault code"
                            maxLength={6}
                            className="w-full p-5 rounded-2xl border-2 border-orange-100 focus:border-orange-400 focus:outline-none text-xl font-mono text-center tracking-widest uppercase bg-white shadow-soft transition-all"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                            Your Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="Enter your name"
                            className="w-full p-5 rounded-2xl border-2 border-orange-100 focus:border-orange-400 focus:outline-none text-lg font-bold bg-white shadow-soft transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full orange-gradient text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Lock size={20} />
                        Unlock Session
                    </button>

                    <button
                        type="button"
                        onClick={onLogout}
                        className="w-full bg-slate-100 text-slate-600 py-5 rounded-[2rem] font-black text-sm shadow-soft hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} />
                        Logout Instead
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-400 font-medium">
                        Enter your credentials to unlock this vault session
                    </p>
                </div>
            </div>
        </div>
    );
};
