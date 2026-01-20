import React, { useState } from 'react';
import { Lock, Unlock, ArrowRight, ShieldCheck } from 'lucide-react';

interface Props {
    mode: 'SETUP' | 'ENTER';
    onComplete: (pin: string) => void;
    onCancel?: () => void;
    validPins?: string[]; // New: support multiple valid PINs
}

export const PinAuthentication: React.FC<Props> = ({ mode, onComplete, onCancel, validPins }) => {
    const [pin, setPin] = useState('');
    const [error, setError] = useState(false);

    const handleKeyPress = (num: string) => {
        if (pin.length < 4) {
            setPin(prev => prev + num);
            setError(false);
        }
    };

    const handleBackspace = () => {
        setPin(prev => prev.slice(0, -1));
    };

    React.useEffect(() => {
        if (pin.length === 4) {
            handleSubmit();
        }
    }, [pin]);

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (pin.length !== 4) return;

        if (mode === 'ENTER') {
            if (!validPins || validPins.includes(pin)) {
                onComplete(pin);
            } else {
                setError(true);
                setPin('');
                // Pulse feedback
                if (navigator.vibrate) navigator.vibrate(200);
            }
        } else {
            onComplete(pin);
        }
    };

    return (
        <div className="fixed inset-0 z-[2000] bg-white animate-fade-in flex flex-col p-8 bg-slate-50">
            <div className="flex-1 flex flex-col items-center justify-center">
                <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 ${error ? 'bg-rose-50 text-rose-500 animate-shake' : 'bg-orange-50 text-orange-500'}`}>
                    {mode === 'SETUP' ? <ShieldCheck size={48} /> : (pin.length === 4 ? <Unlock size={48} /> : <Lock size={48} />)}
                </div>

                <h2 className="text-2xl font-black text-slate-800 mb-2">
                    {mode === 'SETUP' ? 'Set Your Vault PIN' : 'Enter Vault PIN'}
                </h2>
                <p className="text-slate-400 font-bold text-sm mb-12 text-center max-w-[250px]">
                    {mode === 'SETUP' ? 'Secure your expenses with a 4-digit code.' : 'Enter your 4-digit security code to access this vault.'}
                </p>

                <div className="flex gap-4 mb-12">
                    {[1, 2, 3, 4].map(idx => (
                        <div
                            key={idx}
                            className={`w-12 h-16 rounded-2xl border-4 flex items-center justify-center transition-all ${pin.length >= idx
                                ? 'border-orange-500 bg-orange-500'
                                : error ? 'border-rose-100 bg-white' : 'border-slate-100 bg-white'
                                }`}
                        >
                            {pin.length >= idx && <div className="w-3 h-3 bg-white rounded-full"></div>}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-3 gap-6 w-full max-w-[280px]">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button
                            key={num}
                            onClick={() => handleKeyPress(num.toString())}
                            className="w-full aspect-square bg-white rounded-2xl shadow-soft text-2xl font-black text-slate-600 active:scale-95 transition-all hover:bg-slate-50 border border-slate-100/50"
                        >
                            {num}
                        </button>
                    ))}
                    <div />
                    <button
                        onClick={() => handleKeyPress('0')}
                        className="w-full aspect-square bg-white rounded-2xl shadow-soft text-2xl font-black text-slate-600 active:scale-95 transition-all hover:bg-slate-50 border border-slate-100/50"
                    >
                        0
                    </button>
                    <button
                        onClick={handleBackspace}
                        className="w-full aspect-square bg-white rounded-2xl shadow-soft text-lg font-black text-slate-400 active:scale-95 transition-all hover:bg-slate-50 border border-slate-100/50"
                    >
                        Del
                    </button>
                </div>
            </div>

            <div className="flex gap-4 mt-8">
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="flex-1 py-5 rounded-[2rem] font-bold text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        Cancel
                    </button>
                )}
                <button
                    onClick={handleSubmit}
                    disabled={pin.length < 4}
                    className={`flex-1 orange-gradient text-white py-5 rounded-[2rem] font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${pin.length < 4 ? 'opacity-50 scale-95' : 'hover:scale-105 active:scale-95'}`}
                >
                    {mode === 'SETUP' ? 'Create PIN' : 'Verify'} <ArrowRight size={18} />
                </button>
            </div>
        </div>
    );
};
