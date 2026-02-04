
import React, { useState, useEffect, useRef } from 'react';
import { Wifi, X, Info } from 'lucide-react';
import Home from './components/Home';
import Sender from './components/Sender';
import Receiver from './components/Receiver';
import { AppMode } from './types';
import Peer from 'peerjs';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [myPeerId, setMyPeerId] = useState<string>('');
  const peerInstance = useRef<Peer | null>(null);

  useEffect(() => {
    // Initialize PeerJS on mount
    const peer = new Peer();
    
    peer.on('open', (id) => {
      console.log('Peer connected with ID:', id);
      setMyPeerId(id);
    });

    peer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    peerInstance.current = peer;

    return () => {
      if (peerInstance.current) {
        peerInstance.current.destroy();
      }
    };
  }, []);

  const handleReset = () => {
    setMode('HOME');
  };

  return (
    <div className="min-h-screen text-slate-200 flex flex-col">
      {/* Navbar */}
      <header className="px-6 py-4 flex justify-between items-center glass sticky top-0 z-50">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleReset}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-110 transition-transform">
            <Wifi className="text-white w-6 h-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-white">Q-Beam</span>
        </div>

        {mode !== 'HOME' && (
          <button 
            onClick={handleReset}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-lg mx-auto w-full p-6 flex flex-col">
        {mode === 'HOME' && <Home onSelectMode={setMode} />}
        {mode === 'SENDER' && peerInstance.current && (
          <Sender myPeerId={myPeerId} peer={peerInstance.current} />
        )}
        {mode === 'RECEIVER' && peerInstance.current && (
          <Receiver myPeerId={myPeerId} peer={peerInstance.current} />
        )}
      </main>

      {/* Status Footer */}
      <footer className="p-4 bg-slate-900/40 border-t border-slate-800 text-center text-[10px] text-slate-500 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${myPeerId ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>{myPeerId ? `Network Active: ${myPeerId.slice(0, 8)}...` : 'Connecting to Mesh...'}</span>
        </div>
        <div className="h-3 w-[1px] bg-slate-800" />
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3" />
          <span>P2P Enabled</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
