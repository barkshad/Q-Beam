import React, { useState, useEffect } from 'react';
import { Zap, X, Info, Download, Share2, Inbox, Smartphone } from 'lucide-react';
import Home from './components/Home';
import Sender from './components/Sender';
import Receiver from './components/Receiver';
import { AppMode } from './types';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('HOME');
  const [showSplash, setShowSplash] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed/in standalone mode
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true) {
      setIsStandalone(true);
    }

    const timer = setTimeout(() => setShowSplash(false), 2500);
    
    const handleBeforeInstallPrompt = (e: any) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstallable(false);
      setIsStandalone(true);
      setDeferredPrompt(null);
      console.log('Q-Beam was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstallable(false);
      setIsStandalone(true);
    }
    setDeferredPrompt(null);
  };

  const handleReset = () => {
    setMode('HOME');
  };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-black z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500 px-6">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-green-500/20 animate-splash">
            <Zap className="text-black w-12 h-12 fill-black" />
          </div>
          <h1 className="mt-8 text-4xl font-black text-white italic tracking-tighter uppercase">Q-Beam</h1>
          <div className="mt-4 w-12 h-1 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 animate-[loading_2s_ease-in-out_infinite]" style={{ width: '100%' }}></div>
          </div>
        </div>
        <div className="pb-10">
          <span className="uppercase tracking-[0.2em] font-black text-[10px] text-zinc-600">build by shadrack v1.0</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-green-500/30 font-sans">
      {/* Persistent Install Suggestion Banner */}
      {isInstallable && !isStandalone && (
        <div className="bg-green-500 text-black px-4 py-3 flex items-center justify-between animate-in slide-in-from-top duration-500 sticky top-0 z-[60]">
          <div className="flex items-center gap-3">
            <Smartphone className="w-5 h-5 animate-bounce" />
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-tight leading-none">Install Q-Beam App</span>
              <span className="text-[9px] font-bold opacity-70 uppercase tracking-widest">For the best sharing experience</span>
            </div>
          </div>
          <button 
            onClick={handleInstallClick}
            className="bg-black text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all shadow-xl active:scale-95"
          >
            Install Now
          </button>
        </div>
      )}

      {/* Navbar */}
      <header className={`px-4 sm:px-6 py-4 sm:py-5 flex justify-between items-center glass sticky ${isInstallable && !isStandalone ? 'top-[52px]' : 'top-0'} z-50 transition-all duration-300`}>
        <div 
          className="flex items-center gap-3 cursor-pointer group"
          onClick={handleReset}
        >
          <div className="w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg shadow-white/5 group-hover:bg-green-500 transition-all duration-300">
            <Zap className="text-black w-5 h-5 sm:w-6 sm:h-6 fill-black" />
          </div>
          <span className="text-xl sm:text-2xl font-bold tracking-tight text-white uppercase italic">Q-Beam</span>
        </div>

        <div className="flex items-center gap-2">
          {mode !== 'HOME' && (
            <div className="flex items-center bg-zinc-900 rounded-full p-1 border border-zinc-800 mr-2">
              <button 
                onClick={() => setMode('SENDER')}
                className={`p-2 rounded-full transition-all ${mode === 'SENDER' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setMode('RECEIVER')}
                className={`p-2 rounded-full transition-all ${mode === 'RECEIVER' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                <Inbox className="w-4 h-4" />
              </button>
            </div>
          )}

          {mode !== 'HOME' && (
            <button 
              onClick={handleReset}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/60 hover:text-white"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}
        </div>
      </header>

      {/* Main Content - Fully Responsive Container */}
      <main className="flex-1 flex flex-col items-center justify-center w-full px-4 py-8 sm:px-6 lg:px-8 overflow-x-hidden">
        <div className="w-full max-w-lg mx-auto h-full flex flex-col justify-center">
          {mode === 'HOME' && <Home onSelectMode={setMode} />}
          
          <div className={mode === 'SENDER' ? 'block' : 'hidden'}><Sender /></div>
          <div className={mode === 'RECEIVER' ? 'block' : 'hidden'}><Receiver /></div>
        </div>
      </main>

      {/* Status Footer */}
      <footer className="p-4 bg-zinc-900/40 border-t border-zinc-800 text-center text-[10px] text-zinc-500 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="font-medium tracking-wide">CLOUD-READY</span>
          </div>
          <div className="h-3 w-[1px] bg-zinc-800 hidden sm:block" />
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full flex items-center justify-center ${isStandalone ? 'bg-green-500' : 'bg-zinc-700'}`}>
              <Smartphone className={`w-2 h-2 ${isStandalone ? 'text-black' : 'text-zinc-500'}`} />
            </div>
            <span className="uppercase">{isStandalone ? 'App Active' : 'Web View'}</span>
          </div>
        </div>
        <div className="h-3 w-[1px] bg-zinc-800 hidden sm:block" />
        <span className="uppercase tracking-[0.2em] font-black text-zinc-600">build by shadrack v1.0</span>
      </footer>
    </div>
  );
};

export default App;
