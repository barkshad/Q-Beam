import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { File as FileIcon, Sparkles, Loader2, Wifi, Cloud, Trash2, Plus, Share2 } from 'lucide-react';
import Peer from 'peerjs';
import { TransferType, SharedFileMetadata, QRData } from '../types';
import { analyzeFileTransfer } from '../services/gemini';

interface SenderProps {
  myPeerId: string;
  peer: Peer;
}

const Sender: React.FC<SenderProps> = ({ myPeerId, peer }) => {
  const [files, setFiles] = useState<File[]>([]);
  const [transferMode, setTransferMode] = useState<TransferType>(TransferType.P2P);
  const [aiTip, setAiTip] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [qrPayload, setQrPayload] = useState<string>('');
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [isConnected, setIsConnected] = useState(false);
  const [isUploadingToCloud, setIsUploadingToCloud] = useState(false);

  const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/ds2mbrzcn/auto/upload";
  const UPLOAD_PRESET = "real_unsigned";

  // Auto-generate QR for P2P when files or mode changes
  useEffect(() => {
    if (files.length > 0 && transferMode === TransferType.P2P) {
      const qrData: QRData = {
        hostId: myPeerId,
        transferType: TransferType.P2P,
        meta: files.map(f => ({ name: f.name, size: f.size, type: f.type })),
      };
      setQrPayload(JSON.stringify(qrData));
      
      // Setup P2P Listener
      const handleConnection = (conn: any) => {
        setIsConnected(true);
        conn.on('open', () => {
          conn.send({ type: 'BATCH_START', payload: { count: files.length } });
          files.forEach((file, index) => {
            const meta: SharedFileMetadata = { name: file.name, size: file.size, type: file.type };
            const reader = new FileReader();
            reader.onload = (e) => {
              const buffer = e.target?.result;
              if (buffer) {
                conn.send({ type: 'META', payload: { ...meta, index } });
                conn.send({ type: 'FILE', payload: { data: buffer, index } });
                setTransferProgress(Math.round(((index + 1) / files.length) * 100));
              }
            };
            reader.readAsArrayBuffer(file);
          });
        });
        conn.on('close', () => setIsConnected(false));
      };

      peer.on('connection', handleConnection);
      return () => {
        peer.off('connection', handleConnection);
      };
    } else if (transferMode === TransferType.CLOUD) {
      setQrPayload(''); // Cloud requires explicit upload action
      setIsConnected(false);
    }
  }, [files, transferMode, myPeerId, peer]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected: File[] = Array.from(e.target.files || []);
    if (selected.length > 0) {
      setFiles(prev => [...prev, ...selected]);
      setIsAnalyzing(true);
      const tip = await analyzeFileTransfer(
        selected.length > 1 ? `${selected.length} files batch` : selected[0].name,
        selected.reduce((acc, f) => acc + f.size, 0),
        selected[0].type
      );
      setAiTip(tip || '');
      setIsAnalyzing(false);
    }
  };

  const startCloudUpload = async () => {
    if (files.length === 0) return;
    setIsUploadingToCloud(true);
    setTransferProgress(0);
    try {
      const cloudUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("file", files[i]);
        formData.append("upload_preset", UPLOAD_PRESET);
        
        const response = await fetch(CLOUDINARY_URL, { method: "POST", body: formData });
        if (!response.ok) throw new Error("Cloudinary upload failed");
        const data = await response.json();
        cloudUrls.push(data.secure_url);
        setTransferProgress(Math.round(((i + 1) / files.length) * 100));
      }

      const qrData: QRData = {
        hostId: myPeerId,
        transferType: TransferType.CLOUD,
        meta: files.map((f, i) => ({ 
          name: f.name, size: f.size, type: f.type, cloudUrl: cloudUrls[i] 
        })),
      };
      setQrPayload(JSON.stringify(qrData));
    } catch (err) {
      console.error(err);
      alert("Cloud upload failed.");
    } finally {
      setIsUploadingToCloud(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    if (files.length <= 1) setQrPayload('');
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
      <div className="flex justify-between items-end">
        <div className="space-y-1">
          <h2 className="text-3xl font-black text-white italic uppercase">Beam</h2>
          <p className="text-zinc-500 text-sm font-medium">Transmit data instantly.</p>
        </div>
        {files.length > 0 && (
          <p className="text-[10px] font-black uppercase text-green-500 bg-green-500/10 px-3 py-1 rounded-full">
            {formatSize(files.reduce((acc, f) => acc + f.size, 0))}
          </p>
        )}
      </div>

      {files.length === 0 ? (
        <label className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-[2.5rem] border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 hover:border-zinc-700 cursor-pointer transition-all duration-300">
          <input type="file" onChange={handleFileChange} className="hidden" multiple />
          <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-zinc-800 text-zinc-500">
            <FileIcon className="w-10 h-10" />
          </div>
          <p className="text-lg font-bold text-white text-center px-4 italic">Choose local files</p>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">Any file, any size</p>
        </label>
      ) : (
        <div className="space-y-6">
          {/* QR Area */}
          <div className="flex flex-col items-center gap-6">
            <div className="relative p-6 bg-white rounded-[2.5rem] shadow-2xl shadow-green-500/10 transition-transform hover:scale-105 duration-300">
              {qrPayload ? (
                <QRCodeSVG value={qrPayload} size={180} level="M" />
              ) : (
                <div className="w-[180px] h-[180px] flex flex-col items-center justify-center text-black/20">
                  <Loader2 className="w-10 h-10 animate-spin mb-2" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-center">Preparing Beam...</span>
                </div>
              )}
              {(isConnected || isUploadingToCloud) && (
                <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center rounded-[2.5rem] animate-in fade-in">
                  <div className="w-14 h-14 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                    <Loader2 className="w-8 h-8 text-green-500 animate-spin" />
                  </div>
                  <p className="text-white text-[10px] font-black italic uppercase tracking-widest">{transferProgress}%</p>
                  <div className="w-24 h-1 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-green-500 transition-all duration-300" style={{ width: `${transferProgress}%` }} />
                  </div>
                </div>
              )}
            </div>

            <div className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${isConnected ? 'bg-green-500 text-black border-transparent' : 'bg-zinc-900 text-zinc-400 border-zinc-800'}`}>
              {isConnected ? 'Transmission in Progress' : qrPayload ? 'Awaiting Scan' : 'Configuring'}
            </div>
          </div>

          {/* Mode Switcher */}
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => setTransferMode(TransferType.P2P)}
              className={`p-4 rounded-2xl border text-left transition-all ${transferMode === TransferType.P2P ? 'border-green-500 bg-green-500/10' : 'border-zinc-800 bg-zinc-900/50'}`}
            >
              <Wifi className={`w-5 h-5 mb-1 ${transferMode === TransferType.P2P ? 'text-green-500' : 'text-zinc-500'}`} />
              <div className="text-xs font-bold text-white uppercase italic">Direct</div>
            </button>
            <button 
              onClick={() => setTransferMode(TransferType.CLOUD)}
              className={`p-4 rounded-2xl border text-left transition-all ${transferMode === TransferType.CLOUD ? 'border-white bg-white/5' : 'border-zinc-800 bg-zinc-900/50'}`}
            >
              <Cloud className={`w-5 h-5 mb-1 ${transferMode === TransferType.CLOUD ? 'text-white' : 'text-zinc-500'}`} />
              <div className="text-xs font-bold text-white uppercase italic">Cloud</div>
            </button>
          </div>

          {/* Action Button for Cloud */}
          {transferMode === TransferType.CLOUD && !qrPayload && (
            <button
              onClick={startCloudUpload}
              disabled={isUploadingToCloud}
              className="w-full bg-white hover:bg-zinc-200 text-black font-black py-4 rounded-[2rem] flex items-center justify-center gap-2 transition-all uppercase italic tracking-wider text-sm disabled:opacity-50"
            >
              {isUploadingToCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
              Generate Cloud Link
            </button>
          )}

          {/* File List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Batch</span>
              <label className="text-[10px] font-black text-green-500 uppercase tracking-widest cursor-pointer hover:underline flex items-center gap-1">
                <Plus className="w-3 h-3" /> Add
                <input type="file" onChange={handleFileChange} className="hidden" multiple />
              </label>
            </div>
            <div className="max-h-[180px] overflow-y-auto space-y-2 custom-scrollbar pr-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-zinc-900/40 border border-zinc-800/50 rounded-xl hover:bg-zinc-900 transition-colors">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <FileIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-white truncate italic">{f.name}</p>
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{formatSize(f.size)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFile(i)} className="p-1.5 text-zinc-600 hover:text-rose-500 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* AI Tip */}
          {aiTip && (
            <div className="bg-zinc-900/80 border border-zinc-800 p-4 rounded-2xl flex gap-3 items-center">
              <Sparkles className="w-4 h-4 text-green-500 flex-shrink-0" />
              <p className="text-[11px] text-zinc-400 font-medium italic leading-relaxed">
                {aiTip}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Sender;