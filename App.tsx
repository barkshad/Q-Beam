
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
    const peer = new Peer();
    
    peer.on('open', (id) => {
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
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-green-500/30">
      {/* Navbar */}
      <header className="px-6 py-5 flex justify-between items-center glass sticky top-0 z-50">
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleReset}
        >
          <div className="w-11 h-11 bg-white rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 group-hover:bg-green-500 transition-all duration-300">
            <Wifi className="text-black w-6 h-6" />
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
      <footer className="p-4 bg-zinc-900/40 border-t border-zinc-800 text-center text-[10px] text-zinc-500 flex items-center justify-center gap-4">
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${myPeerId ? 'bg-green-500 animate-pulse' : 'bg-zinc-600'}`} />
          <span className="font-medium tracking-wide">{myPeerId ? `NODE: ${myPeerId.slice(0, 8).toUpperCase()}` : 'INITIALIZING...'}</span>
        </div>
        <div className="h-3 w-[1px] bg-zinc-800" />
        <div className="flex items-center gap-1">
          <Info className="w-3 h-3 text-green-500" />
          <span className="uppercase">P2P Secure Mesh</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
