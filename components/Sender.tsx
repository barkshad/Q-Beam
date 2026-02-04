
import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { File as FileIcon, ArrowRight, Sparkles, Loader2, Wifi, Cloud } from 'lucide-react';
import Peer from 'peerjs';
import { TransferType, SharedFileMetadata, QRData } from '../types';
import { analyzeFileTransfer } from '../services/gemini';

interface SenderProps {
  myPeerId: string;
  peer: Peer;
}

const Sender: React.FC<SenderProps> = ({ myPeerId, peer }) => {
  const [file, setFile] = useState<File | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [transferMode, setTransferMode] = useState<TransferType>(TransferType.P2P);
  const [aiTip, setAiTip] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setIsAnalyzing(true);
      const tip = await analyzeFileTransfer(selected.name, selected.size, selected.type);
      setAiTip(tip || '');
      setIsAnalyzing(false);
    }
  };

  const generateShare = () => {
    if (!file) return;

    peer.on('connection', (conn) => {
      setIsConnected(true);
      conn.on('open', () => {
        const meta: SharedFileMetadata = {
          name: file.name,
          size: file.size,
          type: file.type,
        };
        conn.send({ type: 'META', payload: meta });

        const reader = new FileReader();
        reader.onload = (e) => {
          const buffer = e.target?.result;
          if (buffer) {
            conn.send({ type: 'FILE', payload: buffer });
            setTransferProgress(100);
          }
        };
        reader.readAsArrayBuffer(file);
      });
      conn.on('error', () => setIsConnected(false));
    });

    const qrData: QRData = {
      hostId: myPeerId,
      transferType: transferMode,
      meta: [{ name: file.name, size: file.size, type: file.type }],
    };

    setQrPayload(JSON.stringify(qrData));
    setStep(2);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full flex flex-col gap-6 animate-in zoom-in-95 duration-300">
      {step === 1 ? (
        <>
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-white italic uppercase">Select</h2>
            <p className="text-zinc-500 text-sm font-medium">Prepare your data for transmission.</p>
          </div>

          <div className="relative group">
            <input type="file" onChange={handleFileChange} className="hidden" id="file-input" />
            <label 
              htmlFor="file-input"
              className={`flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2.5rem] cursor-pointer transition-all duration-300 ${file ? 'border-green-500 bg-green-500/5' : 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700'}`}
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${file ? 'bg-green-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                <FileIcon className="w-10 h-10" />
              </div>
              <p className="text-lg font-bold text-white text-center px-4 overflow-hidden text-ellipsis w-full italic">
                {file ? file.name : 'Choose local file'}
              </p>
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">
                {file ? formatSize(file.size) : 'Max 2GB recommended'}
              </p>
            </label>
          </div>

          {file && (
            <div className="space-y-5 animate-in fade-in slide-in-from-top-4 duration-500">
              {/* AI Analysis */}
              <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex gap-4 items-center">
                <div className="bg-green-500/10 p-3 rounded-2xl text-green-500">
                  {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1">Beam AI</p>
                  <p className="text-sm text-zinc-300 font-medium leading-relaxed italic">
                    {isAnalyzing ? "Scanning..." : `"${aiTip}"`}
                  </p>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTransferMode(TransferType.P2P)}
                  className={`p-5 rounded-3xl border text-left transition-all ${transferMode === TransferType.P2P ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/50'}`}
                >
                  <Wifi className="w-6 h-6 text-green-500 mb-2" />
                  <div className="text-sm font-bold text-white uppercase italic">Direct</div>
                  <div className="text-[10px] text-zinc-500 font-black">Unlimited</div>
                </button>
                <button 
                  onClick={() => setTransferMode(TransferType.CLOUD)}
                  className={`p-5 rounded-3xl border text-left transition-all ${transferMode === TransferType.CLOUD ? 'border-white bg-white/5' : 'border-zinc-800 bg-zinc-900/50'}`}
                >
                  <Cloud className="w-6 h-6 text-white mb-2" />
                  <div className="text-sm font-bold text-white uppercase italic">Cloud</div>
                  <div className="text-[10px] text-zinc-500 font-black">Fast Preview</div>
                </button>
              </div>

              <button
                onClick={generateShare}
                className="w-full bg-white hover:bg-zinc-200 text-black font-black py-5 rounded-[2rem] flex items-center justify-center gap-2 shadow-xl shadow-white/5 active:scale-[0.98] transition-all uppercase italic tracking-wider"
              >
                Launch Beam <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-10 py-6">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-white italic uppercase">Ready</h2>
            <p className="text-zinc-500 text-sm font-medium">Recipient must scan this code.</p>
          </div>

          <div className="relative p-8 bg-white rounded-[3rem] shadow-2xl shadow-green-500/20">
            <QRCodeSVG value={qrPayload} size={220} level="M" />
            {isConnected && (
              <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center rounded-[3rem] animate-in fade-in">
                <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-5">
                  <Loader2 className="w-10 h-10 text-green-500 animate-spin" />
                </div>
                <p className="text-white font-black italic uppercase tracking-widest">Streaming...</p>
                <div className="w-2/3 h-1.5 bg-zinc-800 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${transferProgress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className={`flex items-center gap-3 px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest border ${isConnected ? 'bg-green-500 text-black border-transparent' : 'bg-zinc-900 text-zinc-300 border-zinc-800'}`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-black animate-pulse' : 'bg-green-500 animate-pulse'}`} />
            {isConnected ? 'Sync Active' : 'Waiting for link...'}
          </div>

          <button onClick={() => setStep(1)} className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest underline underline-offset-4">
            Terminate Session
          </button>
        </div>
      )}
    </div>
  );
};

export default Sender;
