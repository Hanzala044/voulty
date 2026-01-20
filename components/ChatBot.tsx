import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Bot, User as UserIcon, Loader2 } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

interface Props {
  currency: string;
  userEmoji: string;
}

export const ChatBot: React.FC<Props> = ({ currency, userEmoji }) => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', text: `Hi! I'm your Vaulty AI assistant. Ask me anything about your ${currency} budget!` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;

      if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY' || apiKey.length < 20) {
        setMessages(prev => [...prev, {
          role: 'model',
          text: `⚠️ **API Key Mismatch**: I noticed your key is either missing or too short (\`fwfreg\` is not a valid Gemini key). Please ensure your \`.env.local\` file has the long key starting with \`AIza...\`.`
        }]);
        setIsLoading(false);
        return;
      }

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        systemInstruction: `You are Vaulty AI, a premium budgeting assistant. You help users split bills and analyze spending. Current currency: ${currency}.`
      });

      const result = await model.generateContent(userMsg);
      const response = await result.response;
      const modelText = response.text() || "I'm sorry, I couldn't process that.";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "Connection error. Ensure your API key is valid and your network is active." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-[2.5rem] overflow-hidden border border-slate-100 italic shadow-inner">
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-black text-xs text-slate-800 uppercase tracking-widest leading-none">AI Insight</h3>
            <p className="text-[8px] text-slate-400 font-bold mt-1">Gemini 1.5 Flash Active</p>
          </div>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-xs ${m.role === 'user' ? 'bg-white shadow-soft' : 'bg-indigo-600 text-white'}`}>
                {m.role === 'user' ? userEmoji : <Bot size={12} />}
              </div>
              <div className={`p-3 rounded-2xl text-[11px] leading-relaxed font-bold ${m.role === 'user'
                ? 'bg-indigo-600 text-white rounded-tr-none'
                : 'bg-white text-slate-800 rounded-tl-none shadow-sm'
                }`}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
              <Loader2 size={12} className="animate-spin text-indigo-600" />
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest">Processing...</span>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-slate-100 flex gap-2 items-center">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={e => e.key === 'Enter' && handleSend()}
          placeholder="Analyze my spending..."
          className="flex-1 p-3 rounded-xl bg-slate-50 text-[11px] font-bold outline-none border border-transparent focus:border-indigo-100 transition-all"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center disabled:opacity-50 transition-all active:scale-90"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
};
