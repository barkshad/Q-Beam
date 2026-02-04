
import React from 'react';
import { Upload, Download, Zap, ShieldCheck, Globe } from 'lucide-react';
import { AppMode } from '../types';

interface HomeProps {
  onSelectMode: (mode: AppMode) => void;
}

const Home: React.FC<HomeProps> = ({ onSelectMode }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="text-center mb-12 space-y-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-white leading-tight">
          Beam Files <br />
          <span className="gradient-text">Across Devices.</span>
        </h1>
        <p className="text-slate-400 text-lg max-w-xs mx-auto">
          Direct P2P transfer or instant cloud preview. Secure, fast, and effortless.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 w-full max-w-sm">
        <button
          onClick={() => onSelectMode('SENDER')}
          className="group relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-cyan-500/50 p-6 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:shadow-cyan-500/10 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-cyan-500/20 rounded-2xl flex items-center justify-center text-cyan-400">
              <Upload className="w-6 h-6" />
            </div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-500 bg-cyan-500/10 px-2 py-1 rounded-full">Primary</div>
          </div>
          <h3 className="text-xl font-bold text-white group-hover:translate-x-1 transition-transform">Send Files</h3>
          <p className="text-slate-500 text-sm mt-1">Create a secure QR stream for any file.</p>
        </button>

        <button
          onClick={() => onSelectMode('RECEIVER')}
          className="group relative overflow-hidden bg-slate-900 border border-slate-800 hover:border-blue-500/50 p-6 rounded-3xl transition-all duration-500 hover:shadow-2xl hover:shadow-blue-500/10 text-left"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-2xl flex items-center justify-center text-blue-400">
              <Download className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-white group-hover:translate-x-1 transition-transform">Receive</h3>
          <p className="text-slate-500 text-sm mt-1">Scan QR to connect and download instantly.</p>
        </button>
      </div>

      <div className="mt-16 grid grid-cols-3 gap-8 w-full">
        <div className="flex flex-col items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Instant</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">Secure</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Globe className="w-5 h-5 text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-500 uppercase">WebRTC</span>
        </div>
      </div>
    </div>
  );
};

export default Home;
