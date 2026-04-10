import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Gauge, ArrowDown, ArrowUp, Zap, X, Play } from 'lucide-react';

interface SpeedTestProps {
  onComplete: (results: { download: number; upload: number; latency: number }) => void;
  onClose: () => void;
}

const SpeedTest: React.FC<SpeedTestProps> = ({ onComplete, onClose }) => {
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
      className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
    >
      <div className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden">
        {/* Background Glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex justify-between items-center mb-8 relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-xl">
              <Gauge className="h-6 w-6 text-blue-500" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">Network Speed Test</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <X className="h-6 w-6 text-gray-400" />
          </button>
        </div>

        <div className="flex flex-col items-center gap-8 relative z-10">
          {/* Main Gauge Visual */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90 transform">
              <circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                className="text-white/5"
              />
              <motion.circle
                cx="128"
                cy="128"
                r="110"
                stroke="currentColor"
                strokeWidth="12"
                fill="transparent"
                strokeDasharray="691"
                initial={{ strokeDashoffset: 691 }}
                animate={{ strokeDashoffset: 691 - (691 * (phase === 'idle' ? 0 : progress / 100)) }}
                className={`${phase === 'upload' ? 'text-purple-500' : 'text-blue-500'} transition-all duration-300`}
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
                    className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 hover:bg-blue-500 transition-all active:scale-95"
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
                    <span className="text-5xl font-black tracking-tighter tabular-nums">
                      {phase === 'complete' ? (phase === 'download' ? results.download : results.upload) : Math.floor(currentValue)}
                    </span>
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-widest">Mbps</span>
                    <span className="text-xs font-medium text-blue-400 mt-2 uppercase tracking-widest">
                      {phase === 'latency' ? 'Measuring Ping...' : phase === 'download' ? 'Downloading...' : phase === 'upload' ? 'Uploading...' : 'Test Complete'}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-4 w-full">
            <div className="bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-1">
              <Zap className="h-4 w-4 text-yellow-500 mb-1" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Ping</span>
              <span className="text-lg font-bold font-mono">{results.latency || '--'} <span className="text-[10px] text-gray-600">ms</span></span>
            </div>
            <div className={`bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-1 transition-all ${phase === 'download' ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}`}>
              <ArrowDown className="h-4 w-4 text-blue-500 mb-1" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Down</span>
              <span className="text-lg font-bold font-mono">{results.download || '--'} <span className="text-[10px] text-gray-600">Mbps</span></span>
            </div>
            <div className={`bg-white/5 border border-white/5 p-4 rounded-3xl flex flex-col items-center gap-1 transition-all ${phase === 'upload' ? 'ring-2 ring-purple-500/50 bg-purple-500/5' : ''}`}>
              <ArrowUp className="h-4 w-4 text-purple-500 mb-1" />
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Up</span>
              <span className="text-lg font-bold font-mono">{results.upload || '--'} <span className="text-[10px] text-gray-600">Mbps</span></span>
            </div>
          </div>

          {phase === 'complete' && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onClose}
              className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-all active:scale-[0.98]"
            >
              Done
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default SpeedTest;
