import React, { useState } from 'react';
import { Cloud, X, Info, Download } from 'lucide-react';
import Home from './components/Home';
import Sender from './components/Sender';
import Receiver from './components/Receiver';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');

  const handleReset = () => {
    setMode('HOME');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-green-500/30">
      {/* Navbar */}
      <header className="px-6 py-5 flex justify-between items-center glass sticky top-0 z-50">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleReset}
        >
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 group-hover:bg-green-500 transition-all duration-300">
            <Cloud className="text-black w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white uppercase italic">Q-Beam</span>
        </div>

        {mode !== 'HOME' && (
          <button 
            onClick={handleReset}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full p-6 flex flex-col justify-center">
        {mode === 'HOME' && <Home onSelectMode={setMode} />}
        {mode === 'SENDER' && (
          <Sender />
        )}
        {mode === 'RECEIVER' && (
          <Receiver />
        )}
      </main>

      {/* Status Footer */}
      <footer className="p-4 bg-zinc-900/40 border-t border-zinc-800 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <span className="font-medium tracking-wide">CLOUD-READY</span>
        </div>
        <div className="h-3 w-[1px] bg-zinc-800" />
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3 text-green-500" />
          <span className="uppercase">Secure Cloud Relay</span>
        </div>
      </footer>
    </div>
  );
};

export default App;