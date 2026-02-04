
import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { File as FileIcon, ArrowRight, Share2, Sparkles, Loader2, Wifi, Cloud } from 'lucide-react';
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

    // Set up Peer listener for incoming connection
    peer.on('connection', (conn) => {
      setIsConnected(true);
      conn.on('open', () => {
        // Step 1: Send metadata
        const meta: SharedFileMetadata = {
          name: file.name,
          size: file.size,
          type: file.type,
        };
        conn.send({ type: 'META', payload: meta });

        // Step 2: Send file as chunks (basic logic)
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

      conn.on('error', (err) => {
        console.error("Connection error:", err);
        setIsConnected(false);
      });
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
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Select File</h2>
            <p className="text-slate-400 text-sm">Large files use Direct P2P. Media can use Cloud.</p>
          </div>

          <div className="relative group">
            <input 
              type="file" 
              onChange={handleFileChange} 
              className="hidden" 
              id="file-input" 
            />
            <label 
              htmlFor="file-input"
              className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-slate-700 rounded-3xl cursor-pointer hover:bg-slate-900/50 hover:border-cyan-500/50 transition-all duration-300 bg-slate-900/20"
            >
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                <FileIcon className={`w-10 h-10 ${file ? 'text-cyan-400' : 'text-slate-500'}`} />
              </div>
              <p className="text-lg font-medium text-white text-center px-4 overflow-hidden text-ellipsis w-full">
                {file ? file.name : 'Tap to pick file'}
              </p>
              <p className="text-xs text-slate-500 mt-2">
                {file ? formatSize(file.size) : 'Documents, Images, Archives...'}
              </p>
            </label>
          </div>

          {file && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-500">
              {/* AI Analysis */}
              <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-2xl flex gap-3 items-start">
                <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                </div>
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-cyan-500 uppercase tracking-widest mb-1">Beam Analyst</p>
                  <p className="text-xs text-slate-300 leading-relaxed italic">
                    {isAnalyzing ? "Analyzing file metadata..." : `"${aiTip}"`}
                  </p>
                </div>
              </div>

              {/* Mode Selection */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setTransferMode(TransferType.P2P)}
                  className={`p-4 rounded-2xl border text-left transition-all ${transferMode === TransferType.P2P ? 'border-cyan-500 bg-cyan-500/10' : 'border-slate-800 bg-slate-900/50'}`}
                >
                  <Wifi className="w-5 h-5 text-cyan-400 mb-2" />
                  <div className="text-sm font-bold text-white">Direct P2P</div>
                  <div className="text-[10px] text-slate-500">End-to-End, any size</div>
                </button>
                <button 
                  onClick={() => setTransferMode(TransferType.CLOUD)}
                  className={`p-4 rounded-2xl border text-left transition-all ${transferMode === TransferType.CLOUD ? 'border-blue-500 bg-blue-500/10' : 'border-slate-800 bg-slate-900/50'}`}
                >
                  <Cloud className="w-5 h-5 text-blue-400 mb-2" />
                  <div className="text-sm font-bold text-white">Cloud Preview</div>
                  <div className="text-[10px] text-slate-500">Fast cache previews</div>
                </button>
              </div>

              <button
                onClick={generateShare}
                className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/20 active:scale-95 transition-all"
              >
                Generate Share Beam <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-8 py-4">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-white">Scan to Connect</h2>
            <p className="text-slate-400 text-sm">Keep this screen open until the beam finishes.</p>
          </div>

          <div className="relative p-6 bg-white rounded-3xl shadow-2xl shadow-cyan-500/20 border-4 border-slate-800">
            <QRCodeSVG 
              value={qrPayload} 
              size={240} 
              level="H"
              includeMargin={true}
              imageSettings={{
                src: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png",
                x: undefined,
                y: undefined,
                height: 40,
                width: 40,
                excavate: true,
              }}
            />
            {isConnected && (
              <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center rounded-2xl animate-in fade-in">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
                <p className="text-white font-bold">Transferring...</p>
                <p className="text-xs text-slate-400 mt-1">{transferProgress}% complete</p>
                {transferProgress === 100 && (
                  <div className="mt-4 text-green-400 flex items-center gap-2 font-bold animate-bounce">
                    Beam Finished!
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-6 py-3 rounded-full text-xs font-medium text-slate-300">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-amber-500 animate-pulse'}`} />
            {isConnected ? 'Device Connected' : 'Waiting for Receiver...'}
          </div>

          <button 
            onClick={() => { setStep(1); setIsConnected(false); }}
            className="text-slate-500 hover:text-white text-sm font-medium flex items-center gap-2"
          >
            Cancel and reset
          </button>
        </div>
      )}
    </div>
  );
};

export default Sender;
