import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User, Search, Loader2, Settings, Key } from 'lucide-react';
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
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [localApiKey, setLocalApiKey] = useState(localStorage.getItem('NETSCAN_GEMINI_KEY') || '');
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
      const envToken = process.env.NETSCAN_AI_TOKEN;
      const apiKey = (envToken && envToken !== 'MY_NETSCAN_AI_TOKEN' && envToken !== 'undefined') ? envToken : localApiKey;
      
      if (!apiKey || apiKey.trim().length < 10) {
        throw new Error('API_KEY_MISSING');
      }
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Format history for the API - Ensure alternating roles and exclude error messages
      const history: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      
      messages.forEach((m, i) => {
        // Skip the initial greeting and any error messages
        if (i === 0) return;
        if (m.text.startsWith('System Error:') || m.text.startsWith('Technical Error:') || m.text.startsWith('Invalid API Key')) return;
        
        const role = m.role === 'user' ? 'user' : 'model';
        
        // Ensure alternating roles: if the last role is the same as current, skip or merge
        if (history.length > 0 && history[history.length - 1].role === role) {
          history[history.length - 1].parts[0].text += `\n${m.text}`;
        } else {
          history.push({ role, parts: [{ text: m.text }] });
        }
      });
      
      // The API expects the last message to be from the 'user' if we are sending it in 'contents'
      // Or we can just send the whole history including the new message
      const finalContents = [...history, { role: 'user' as const, parts: [{ text: userMessage }] }];
      
      // Final check: if history is not empty and the first message is 'model', shift it
      if (finalContents.length > 0 && finalContents[0].role === 'model') {
        finalContents.shift();
      }

      const stream = await ai.models.generateContentStream({
        model: "gemini-3-flash-preview",
        contents: finalContents,
        config: {
          systemInstruction: `You are NetScan AI, the authoritative intelligence behind Coverage Bharat (NetScan India). Your mission is to provide precise, data-driven insights into network coverage and internet quality across the ENTIRE Indian subcontinent.

          Operational Directives:
          1. PAN-INDIA FOCUS: You cover all 28 states and 8 union territories. From Delhi to Kanyakumari, and Mumbai to Guwahati, you provide accurate data for every corner of India.
          2. NPERF & OPEN SIGNAL PARITY: Your map and data are designed to match or exceed global standards like nPerf. Use your Google Search tool to fetch the latest reports from nPerf, OpenSignal, and TRAI to provide street-level accuracy.
          3. TECHNICAL DEPTH: Explain signal technologies (5G SA/NSA, 4G Carrier Aggregation, Fiber-to-the-home) with professional clarity.
          4. MAP FEATURES: Inform users about the deep zoom (level 20) and marker clustering that allows street-by-street signal analysis.
          5. GENERAL INTELLIGENCE: You are a top-tier AI. Answer any general question (coding, weather, science) with the same professional and high-tech tone.
          6. OPERATOR SUPPORT: Provide expert guidance for Jio, Airtel, Vi, and BSNL networks.`,
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
      let errorMessage = 'A technical error has occurred. Please re-initialize the session.';
      
      if (error instanceof Error) {
        if (error.message === 'API_KEY_MISSING') {
          errorMessage = 'System Error: AI Access Token is not set. Please enter your key in the settings icon above, or go to AI Studio "Settings" -> "Secrets" and add your NETSCAN_AI_TOKEN.';
        } else if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid') || error.message.includes('403')) {
          errorMessage = 'Invalid API Key. Please check your NETSCAN_AI_TOKEN in settings.';
        } else {
          // Show the actual error message for better debugging
          errorMessage = `Technical Error: ${error.message}`;
        }
      }
      
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
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setShowApiKeyInput(!showApiKeyInput)} 
                  className={`p-2 rounded-lg transition-colors ${showApiKeyInput ? 'bg-blue-600/20 text-blue-400' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                  title="AI Settings"
                >
                  <Key className="h-4 w-4" />
                </button>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/5 p-2 rounded-lg transition-colors text-gray-500 hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* API Key Input Overlay */}
            <AnimatePresence>
              {showApiKeyInput && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-blue-600/10 border-b border-blue-500/20 overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">AI_Access_Configuration</span>
                      <button onClick={() => setShowApiKeyInput(false)} className="text-gray-500 hover:text-white">
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type="password"
                        value={localApiKey}
                        onChange={(e) => {
                          setLocalApiKey(e.target.value);
                          localStorage.setItem('NETSCAN_GEMINI_KEY', e.target.value);
                        }}
                        placeholder="Enter your AI Access Token..."
                        className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder:text-gray-600 outline-none focus:border-blue-500/50 font-mono"
                      />
                    </div>
                    <p className="text-[9px] text-gray-500 leading-relaxed">
                      Your key is saved locally in your browser. Get one at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">aistudio.google.com</a>.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
