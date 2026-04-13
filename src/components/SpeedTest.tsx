import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gauge, ArrowDown, ArrowUp, Zap, X, Play } from 'lucide-react';

interface SpeedTestProps {
  onComplete: (results: { download: number; upload: number; latency: number }) => void;
  onClose: () => void;
  accentColor?: string;
}

const SpeedTest: React.FC<SpeedTestProps> = ({ onComplete, onClose, accentColor = '#3B82F6' }) => {
  const [phase, setPhase] = useState<'idle' | 'latency' | 'download' | 'upload' | 'complete'>('idle');
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState({ download: 0, upload: 0, latency: 0 });
  const [currentValue, setCurrentValue] = useState(0);

  const startTest = () => {
    setPhase('latency');
    setProgress(0);
  };

  useEffect(() => {
    if (phase === 'latency') {
      const timer = setTimeout(() => {
        const latency = Math.floor(Math.random() * 40) + 10;
        setResults(prev => ({ ...prev, latency }));
        setPhase('download');
        setProgress(0);
      }, 1500);
      return () => clearTimeout(timer);
    }

    if (phase === 'download') {
      const duration = 5000;
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(elapsed / duration, 1);
        setProgress(p * 100);
        
        // Simulate fluctuating speed
        const baseSpeed = 150; // Max simulated speed
        const speed = baseSpeed * (0.8 + Math.random() * 0.4) * Math.sin(p * Math.PI);
        setCurrentValue(Math.max(0, speed));

        if (p >= 1) {
          clearInterval(interval);
          const finalDownload = Math.floor(Math.random() * 50) + 100;
          setResults(prev => ({ ...prev, download: finalDownload }));
          setPhase('upload');
          setProgress(0);
        }
      }, 50);
      return () => clearInterval(interval);
    }

    if (phase === 'upload') {
      const duration = 4000;
      const start = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - start;
        const p = Math.min(elapsed / duration, 1);
        setProgress(p * 100);
        
        const baseSpeed = 60;
        const speed = baseSpeed * (0.7 + Math.random() * 0.5) * Math.sin(p * Math.PI);
        setCurrentValue(Math.max(0, speed));

        if (p >= 1) {
          clearInterval(interval);
          const finalUpload = Math.floor(Math.random() * 20) + 40;
          setResults(prev => ({ ...prev, upload: finalUpload }));
          setPhase('complete');
        }
      }, 50);
      return () => clearInterval(interval);
    }

    if (phase === 'complete') {
      onComplete(results);
    }
  }, [phase]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      className="fixed inset-0 z-[5000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-md bg-[#0a0a0a]/90 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
        {/* Diamond Pattern Overlay */}
        <div className="absolute inset-0 bg-diamond opacity-20 pointer-events-none" />
        
        {/* Background Glow */}
        <div 
          className="absolute -top-24 -left-24 w-80 h-80 blur-[120px] rounded-full pointer-events-none transition-colors duration-700" 
          style={{ backgroundColor: `${accentColor}22` }}
        />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="flex justify-between items-center mb-10 relative z-10">
          <div className="flex items-center gap-4">
            <div 
              className="p-3 rounded-2xl border transition-all duration-500"
              style={{ 
                backgroundColor: `${accentColor}33`,
                borderColor: `${accentColor}44`
              }}
            >
              <Gauge className="h-6 w-6" style={{ color: accentColor }} />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight uppercase">Network Diagnostics</h2>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest mt-1">System_Probe_Active</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors border border-transparent hover:border-white/10"
          >
            <X className="h-6 w-6 text-gray-500 hover:text-white" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-10 relative z-10">
          {/* Main Gauge Visual */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform">
              <circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="8"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray="691"
                initial={{ strokeDashoffset: 691 }}
                animate={{ strokeDashoffset: 691 - (691 * (phase === 'idle' ? 0 : progress / 100)) }}
                style={{ 
                  color: phase === 'upload' ? '#A855F7' : accentColor,
                  filter: `drop-shadow(0 0 8px ${phase === 'upload' ? '#A855F7' : accentColor}88)`
                }}
                className="transition-all duration-300"
                strokeLinecap="round"
              />
            </svg>
            
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <AnimatePresence mode="wait">
                {phase === 'idle' ? (
                  <motion.button
                    key="start"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={startTest}
                    className="w-24 h-24 rounded-3xl flex items-center justify-center shadow-2xl transition-all active:scale-90 border"
                    style={{ 
                      backgroundColor: accentColor,
                      boxShadow: `0 20px 40px ${accentColor}66`,
                      borderColor: `${accentColor}88`
                    }}
                  >
                    <Play className="h-10 w-10 text-white ml-1" />
                  </motion.button>
                ) : (
                  <motion.div
                    key="testing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center"
                  >
                    <span className="text-6xl font-black tracking-tighter tabular-nums text-white">
                      {phase === 'complete' ? (phase === 'download' ? results.download : results.upload) : Math.floor(currentValue)}
                    </span>
                    <span className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] mt-1">Mbps</span>
                    <div className="mt-4 flex items-center gap-2 px-3 py-1 bg-white/5 rounded-full border border-white/10">
                      <div 
                        className="w-1.5 h-1.5 rounded-full animate-pulse" 
                        style={{ backgroundColor: phase === 'upload' ? '#A855F7' : accentColor }}
                      />
                      <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: phase === 'upload' ? '#A855F7' : accentColor }}>
                        {phase === 'latency' ? 'Measuring_Ping' : phase === 'download' ? 'Downloading_Data' : phase === 'upload' ? 'Uploading_Data' : 'Test_Complete'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="bg-white/[0.03] border border-white/5 p-5 rounded-[2rem] flex flex-col items-center gap-1 transition-all">
              <Zap className="h-4 w-4 text-yellow-500 mb-1" />
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Latency</span>
              <span className="text-xl font-black font-mono text-white">{results.latency || '--'}<span className="text-[10px] text-gray-600 ml-1">ms</span></span>
            </div>
            <div className={`bg-white/[0.03] border border-white/5 p-5 rounded-[2rem] flex flex-col items-center gap-1 transition-all ${phase === 'download' ? 'ring-2 bg-white/5' : ''}`} style={phase === 'download' ? { ringColor: `${accentColor}88`, borderColor: `${accentColor}55` } : {}}>
              <ArrowDown className="h-4 w-4 mb-1" style={{ color: accentColor }} />
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Down</span>
              <span className="text-xl font-black font-mono text-white">{results.download || '--'}<span className="text-[10px] text-gray-600 ml-1">mbps</span></span>
            </div>
            <div className={`bg-white/[0.03] border border-white/5 p-5 rounded-[2rem] flex flex-col items-center gap-1 transition-all ${phase === 'upload' ? 'ring-2 ring-purple-500/50 bg-purple-500/10 border-purple-500/30' : ''}`}>
              <ArrowUp className="h-4 w-4 text-purple-500 mb-1" />
              <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Up</span>
              <span className="text-xl font-black font-mono text-white">{results.upload || '--'}<span className="text-[10px] text-gray-600 ml-1">mbps</span></span>
            </div>
          </div>

          {phase === 'complete' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onClose}
              className="w-full py-5 text-white font-black uppercase tracking-widest rounded-2xl transition-all active:scale-[0.95] shadow-xl"
              style={{ 
                backgroundColor: accentColor,
                boxShadow: `0 10px 30px ${accentColor}55`
              }}
            >
              Close Diagnostics
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SpeedTest;
