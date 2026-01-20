import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area
} from 'recharts';
import { AlertTriangle, Map as MapIcon, Calendar, DollarSign, Info, BarChart3, TrendingUp } from 'lucide-react';
import { Expense, Category } from '../types';
import { CATEGORY_COLORS } from '../constants';

interface Props {
    expenses: Expense[];
    currency: string;
}

// Simplified World Map Projection (Mercator-ish for SVG)
const project = (lat: number, lng: number, width: number, height: number) => {
    const x = (lng + 180) * (width / 360);
    const latRad = (lat * Math.PI) / 180;
    const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2));
    const y = height / 2 - (width * mercN) / (2 * Math.PI);
    return { x, y: y + 20 }; // Fine-tuned vertical offset
};

export const FullMapView: React.FC<Props> = ({ expenses, currency }) => {
    const locatedExpenses = useMemo(() =>
        expenses.filter(e => e.location && e.location.lat && e.location.lng),
        [expenses]);

    // Data for charts
    const categoryData = useMemo(() => {
        const data: Record<string, number> = {};
        expenses.forEach(e => {
            data[e.category] = (data[e.category] || 0) + e.amount;
        });
        return Object.entries(data).map(([name, value]) => ({ name, value }));
    }, [expenses]);

    const timelineData = useMemo(() => {
        const data: Record<string, number> = {};
        expenses.slice().reverse().forEach(e => {
            const date = e.date.split(',')[0]; // Simplify date
            data[date] = (data[date] || 0) + e.amount;
        });
        return Object.entries(data).map(([date, amount]) => ({ date, amount }));
    }, [expenses]);

    return (
        <div className="flex-1 overflow-y-auto space-y-8 pb-32 scrollbar-hide">
            {/* World Map Section */}
            <div className="bg-slate-900 rounded-[2.5rem] p-6 shadow-2xl relative overflow-hidden h-[300px] border border-slate-800">
                <div className="absolute top-6 left-6 z-10">
                    <h2 className="text-white font-black text-sm uppercase tracking-widest">Global Heatmap</h2>
                    <p className="text-slate-500 text-[10px] font-bold">Static World Projection</p>
                </div>

                {/* SVG World Map Background - More Detailed Projection */}
                <svg viewBox="0 0 800 400" className="w-full h-full opacity-10 fill-slate-500 scale-110">
                    <path d="M110,130 Q120,120 140,110 T180,100 Q200,95 230,110 T280,130 Q300,150 340,140 T400,125 Q450,110 500,130 T600,160 Q650,170 700,150 T760,140" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    <path d="M120,250 Q150,230 180,260 T250,280 Q300,300 350,270 T450,250 Q500,240 550,260 T650,280 Q700,300 750,270" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                    {/* Abstract continents */}
                    <path d="M100,150 Q150,100 250,120 T350,200 Q300,300 200,280 T100,150 Z" className="fill-slate-800/20" />
                    <path d="M450,140 Q550,100 650,150 T750,250 Q650,350 550,300 T450,140 Z" className="fill-slate-800/20" />
                    <path d="M400,180 Q450,160 480,200 T420,250 Q380,220 400,180 Z" className="fill-slate-800/20" />
                </svg>

                {/* Markers */}
                <div className="absolute inset-0 pointer-events-none">
                    {locatedExpenses.map((exp, idx) => {
                        const { x, y } = project(exp.location!.lat, exp.location!.lng, 800, 400);
                        return (
                            <div
                                key={exp.id}
                                className="absolute pointer-events-auto group animate-fade-in"
                                style={{ left: `${(x / 800) * 100}%`, top: `${(y / 400) * 100}%` }}
                            >
                                <div className="relative">
                                    {/* Pulse Effect */}
                                    <div
                                        className="absolute -inset-2 rounded-full opacity-20 animate-ping"
                                        style={{ backgroundColor: CATEGORY_COLORS[exp.category as Category] }}
                                    />
                                    {/* Pin */}
                                    <div
                                        className="w-3 h-3 rounded-full border-2 border-white shadow-lg cursor-pointer transform group-hover:scale-150 transition-all"
                                        style={{ backgroundColor: CATEGORY_COLORS[exp.category as Category] }}
                                    />
                                    {/* Fancy Label */}
                                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white rounded-2xl p-2 shadow-2xl border border-slate-100 opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 whitespace-nowrap z-50">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full text-white uppercase tracking-tighter" style={{ backgroundColor: CATEGORY_COLORS[exp.category as Category] }}>
                                                {exp.category}
                                            </span>
                                            <span className="text-[10px] font-black text-slate-800">{currency}{exp.amount}</span>
                                        </div>
                                        <p className="text-[9px] font-black text-slate-900 leading-none mb-1">{exp.caption}</p>
                                        <p className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">{exp.date}</p>
                                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white rotate-45 border-b border-r border-slate-100"></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Category Breakdown Chart */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Category Power</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Spending Distribution</p>
                    </div>
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-2xl flex items-center justify-center">
                        <BarChart3 size={20} />
                    </div>
                </div>

                <div className="h-64 w-full flex items-center justify-center">
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={categoryData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {categoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name as Category] || '#cbd5e1'} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                                                    <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest mb-1">{payload[0].name}</p>
                                                    <p className="text-sm font-black text-indigo-600">{currency}{payload[0].value.toLocaleString()}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-[10px] font-black text-slate-300 uppercase italic">Awaiting data...</p>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-6">
                    {categoryData.slice(0, 4).map((entry, i) => (
                        <div key={i} className="flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[entry.name as Category] }} />
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex-1">{entry.name}</span>
                            <span className="text-[10px] font-black text-slate-900">{currency}{entry.value.toLocaleString()}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Timeline Spending Chart */}
            <div className="bg-white rounded-[2.5rem] p-8 shadow-soft border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-lg font-black text-slate-800">Spending Pulse</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Daily Flow over time</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center">
                        <TrendingUp size={20} />
                    </div>
                </div>

                <div className="h-48 w-full flex items-center justify-center">
                    {timelineData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={timelineData}>
                                <defs>
                                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    fontSize={8}
                                    fontWeight={900}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8' }}
                                />
                                <YAxis
                                    fontSize={8}
                                    fontWeight={900}
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8' }}
                                />
                                <Tooltip
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                            return (
                                                <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-slate-100 animate-in fade-in zoom-in duration-200">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{payload[0].payload.date}</p>
                                                    <p className="text-sm font-black text-emerald-600">{currency}{payload[0].value.toLocaleString()}</p>
                                                </div>
                                            );
                                        }
                                        return null;
                                    }}
                                />
                                <Area type="monotone" dataKey="amount" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <p className="text-[10px] font-black text-slate-300 uppercase italic">No pulse detected...</p>
                    )}
                </div>
            </div>
        </div>
    );
};
