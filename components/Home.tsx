import React from 'react';
import { Upload, Camera, Zap, ShieldCheck, Cloud } from 'lucide-react';
import { AppMode } from '../types';

interface HomeProps {
  onSelectMode: (mode: AppMode) => void;
}

const Home: React.FC<HomeProps> = ({ onSelectMode }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-5xl sm:text-6xl font-black text-white leading-tight uppercase italic overflow-hidden">
          <div className="animate-reveal delay-reveal-1">Cloud Beam.</div>
          <span className="gradient-text inline-block animate-reveal delay-reveal-2">Zero Wait.</span>
        </h1>
        <p className="text-zinc-400 text-base max-w-xs mx-auto font-medium">
          Upload instantly, share via QR, and analyze with Gemini AI.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 w-full max-w-sm">
        <button
          onClick={() => onSelectMode('SENDER')}
          className="group relative overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-green-500/50 p-7 rounded-[2rem] transition-all duration-500 hover:bg-zinc-800/80 text-left"
        >
          <div className="absolute inset-0 bg-green-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-black shadow-lg shadow-white/5">
              <Upload className="w-7 h-7" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-green-500 border border-green-500/30 px-3 py-1 rounded-full">Share</div>
          </div>
          <h3 className="text-2xl font-bold text-white group-hover:translate-x-2 transition-transform italic">Start Beam</h3>
          <p className="text-zinc-500 text-sm mt-2 font-medium">Upload files to the secure cloud.</p>
        </button>

        <button
          onClick={() => onSelectMode('RECEIVER')}
          className="group relative overflow-hidden bg-white border border-transparent p-7 rounded-[2rem] transition-all duration-500 hover:bg-zinc-100 text-left"
        >
          <div className="flex items-center justify-between mb-5">
            <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white">
              <Camera className="w-7 h-7" />
            </div>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Scanner</div>
          </div>
          <h3 className="text-2xl font-bold text-black group-hover:translate-x-2 transition-transform italic">Receive</h3>
          <p className="text-zinc-600 text-sm mt-2 font-medium">Scan QR to download beam.</p>
        </button>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-10 w-full opacity-60">
        <div className="flex flex-col items-center gap-2">
          <Zap className="w-5 h-5 text-green-500" />
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Global</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-white" />
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Secured</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Cloud className="w-5 h-5 text-green-500" />
          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Sync</span>
        </div>
      </div>
    </div>
  );
};

export default Home;