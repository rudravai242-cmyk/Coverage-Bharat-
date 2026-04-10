import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Search, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import { ChatMessage } from '../types';

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Greetings. I am NetScan AI, your technical intelligence assistant. How may I assist you with network diagnostics or general inquiries today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('API_KEY_MISSING');
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Gemini API history MUST start with a 'user' message.
      const history = messages
        .filter((m, i) => i > 0 || m.role === 'user')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.text }]
        }));
      
      history.push({ role: 'user', parts: [{ text: userMessage }] });

      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: history,
        config: {
          systemInstruction: `You are NetScan AI, a world-class, multi-functional AI assistant powered by advanced neural networks. You are the intelligence behind Coverage Bharat (NetScan India), the most advanced network diagnostic platform in the region.

          Core Directives:
          1. CONFIDENCE & AUTHORITY: You are a high-tech, state-of-the-art system. Your map is designed to match global standards like nPerf.
          2. NPERF DATA INTEGRATION: When a user asks for "nPerf data" or accurate information, use your Google Search tool to cross-reference global diagnostic databases (nPerf, OpenSignal, etc.) and provide precise, street-level reports.
          3. DEEP ZOOM CAPABILITY: If users mention zoom issues, inform them that the map now supports ultra-high precision zoom (up to level 20) with street-by-street signal clustering.
          4. UNRESTRICTED INTELLIGENCE: You are a general-purpose intelligence. Answer questions about science, history, coding, weather, or any general knowledge with the depth and sophistication of a top-tier AI like Gemini.
          5. PROFESSIONAL PERSONA: Maintain a sleek, professional, and highly intelligent tone. Use structured formatting (bullet points, bold text).
          6. SUPPORT & CONTACT: Provide professional guidance for Jio, Airtel, Vi, BSNL. You are the first line of support.`,
          tools: [{ googleSearch: {} }],
        },
      });

      let fullText = '';
      setMessages(prev => [...prev, { role: 'model', text: '' }]);

      for await (const chunk of stream) {
        const chunkText = chunk.text;
        if (chunkText) {
          fullText += chunkText;
          setMessages(prev => {
            const newMessages = [...prev];
            newMessages[newMessages.length - 1] = { role: 'model', text: fullText };
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage = error instanceof Error && error.message === 'API_KEY_MISSING' 
        ? 'System Error: Gemini API Key is not configured in the environment.'
        : 'A technical error has occurred. Please re-initialize the session.';
      setMessages(prev => [...prev, { role: 'model', text: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[3000]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="absolute bottom-16 right-0 w-[90vw] max-w-[420px] h-[600px] bg-[#0a0a0a] rounded-2xl shadow-2xl border border-white/10 flex flex-col overflow-hidden backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 bg-black/40 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                  <Bot className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <span className="font-bold text-sm tracking-tight text-white uppercase">NetScan AI</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-green-500" />
                    <span className="text-[9px] text-gray-500 font-mono uppercase tracking-widest">System_Online</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/5 p-2 rounded-lg transition-colors text-gray-500 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-transparent no-scrollbar">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`flex items-center gap-2 mb-1`}>
                      {msg.role === 'model' ? (
                        <>
                          <Bot className="h-3 w-3 text-blue-400" />
                          <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">NetScan_AI</span>
                        </>
                      ) : (
                        <>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">User_Node</span>
                          <User className="h-3 w-3 text-gray-500" />
                        </>
                      )}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600/10 border border-blue-500/20 text-blue-50' 
                        : 'bg-white/5 border border-white/5 text-gray-300'
                    }`}>
                      <span className="whitespace-pre-wrap">{msg.text}</span>
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Bot className="h-3 w-3 text-blue-400" />
                      <span className="text-[9px] font-black text-blue-500 uppercase tracking-[0.2em]">Processing...</span>
                    </div>
                    <div className="bg-white/5 border border-white/5 p-4 rounded-2xl flex items-center gap-3">
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-black/40 border-t border-white/5">
              <div className="relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Query technical intelligence..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-12 py-3 text-sm text-white placeholder:text-gray-600 focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all font-mono"
                />
                <button
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:text-blue-400 disabled:opacity-30 transition-all"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between text-[8px] text-gray-600 font-mono uppercase tracking-widest px-1">
                <div className="flex items-center gap-1">
                  <Search className="h-2.5 w-2.5" />
                  <span>Real-time_Search_Active</span>
                </div>
                <span>Encrypted_Session</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center border ${
          isOpen 
            ? 'bg-black border-white/10 text-white' 
            : 'bg-blue-600 border-blue-500 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
        }`}
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </button>
    </div>
  );
};

export default Chatbot;
