import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle, Download, Loader2, AlertCircle, File as FileIcon, Wifi, Cloud } from 'lucide-react';
import Peer, { DataConnection } from 'peerjs';
import { QRData, SharedFileMetadata, TransferType } from '../types';

interface ReceiverProps {
  myPeerId: string;
  peer: Peer;
}

interface ReceivedFile {
  url: string;
  meta: SharedFileMetadata;
}

const Receiver: React.FC<ReceiverProps> = ({ myPeerId, peer }) => {
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'RECEIVING' | 'COMPLETE' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const pendingMeta = useRef<Map<number, SharedFileMetadata>>(new Map());

  useEffect(() => {
    if (status === 'IDLE') {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 20, qrbox: { width: 280, height: 280 } },
        false
      );
      scanner.render(onScanSuccess, () => {});
      scannerRef.current = scanner;
    }
    return () => {
      if (scannerRef.current) scannerRef.current.clear().catch(() => {});
    };
  }, [status]);

  const onScanSuccess = (decodedText: string) => {
    try {
      const data: QRData = JSON.parse(decodedText);
      if (scannerRef.current) scannerRef.current.clear();
      
      if (data.transferType === TransferType.CLOUD) {
        setStatus('COMPLETE');
        const files: ReceivedFile[] = data.meta.map(m => ({ url: m.cloudUrl || '', meta: m }));
        setReceivedFiles(files);
      } else {
        setStatus('CONNECTING');
        const conn = peer.connect(data.hostId);
        conn.on('open', () => setStatus('RECEIVING'));
        conn.on('data', (payload: any) => {
          if (payload.type === 'BATCH_START') {
            setBatchTotal(payload.payload.count);
          } else if (payload.type === 'META') {
            pendingMeta.current.set(payload.payload.index, payload.payload);
          } else if (payload.type === 'FILE') {
            const { index, data: fileData } = payload.payload;
            const meta = pendingMeta.current.get(index);
            if (meta) {
              const blob = new Blob([fileData], { type: meta.type });
              const url = URL.createObjectURL(blob);
              setReceivedFiles(prev => {
                const newList = [...prev, { url, meta }];
                if (newList.length === (batchTotal || 1)) setStatus('COMPLETE');
                return newList;
              });
            }
          }
        });
        conn.on('error', () => {
          setStatus('ERROR');
          setErrorMessage("Beam interrupted.");
        });
      }
    } catch (e) {
      console.error("Invalid QR", e);
    }
  };

  const formatSize = (bytes: number) => {
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white italic uppercase">Intercept</h2>
        <p className="text-zinc-500 text-sm font-medium">Scan to begin receiving.</p>
      </div>

      {status === 'IDLE' && (
        <div className="relative group overflow-hidden rounded-[2.5rem] border-4 border-zinc-900 bg-black shadow-2xl">
          <div id="qr-reader" className="w-full" />
          <div className="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="bg-black/80 backdrop-blur px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-3">
              <Camera className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Ready to Scan</span>
            </div>
          </div>
        </div>
      )}

      {(status === 'CONNECTING' || status === 'RECEIVING') && (
        <div className="p-16 glass rounded-[3rem] flex flex-col items-center text-center space-y-8 border-green-500/20">
          <div className="relative">
            <div className="w-24 h-24 border-[4px] border-zinc-800 rounded-full flex items-center justify-center">
               <div className="w-16 h-16 border-[4px] border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
               <Wifi className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-black text-white italic uppercase tracking-wider">
              {status === 'CONNECTING' ? 'Handshake' : 'Streaming'}
            </h3>
            <p className="text-zinc-500 text-[10px] font-black mt-2 uppercase tracking-widest">
              Segment {receivedFiles.length + 1} / {batchTotal || '...'}
            </p>
          </div>
        </div>
      )}

      {status === 'COMPLETE' && (
        <div className="glass p-8 rounded-[3rem] flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 border-green-500">
          <div className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center shadow-xl shadow-green-500/20">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <div className="w-full space-y-4">
            <h3 className="text-2xl font-black text-white italic uppercase">Batch Received</h3>
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {receivedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-left">
                  <FileIcon className="w-8 h-8 text-green-500 flex-shrink-0" />
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-white italic truncate">{file.meta.name}</p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{formatSize(file.meta.size)}</p>
                  </div>
                  <a
                    href={file.url}
                    download={file.meta.name}
                    className="p-3 bg-white text-black rounded-xl hover:bg-zinc-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
          
          <button 
            onClick={() => {
              setReceivedFiles([]);
              setBatchTotal(0);
              pendingMeta.current.clear();
              setStatus('IDLE');
            }}
            className="text-zinc-500 hover:text-white text-[9px] font-black uppercase tracking-[0.3em]"
          >
            Clear and Reset
          </button>
        </div>
      )}

      {status === 'ERROR' && (
        <div className="p-12 glass rounded-[3rem] flex flex-col items-center text-center space-y-6 border-rose-500/30">
          <AlertCircle className="w-16 h-16 text-rose-500" />
          <h3 className="text-2xl font-black text-white italic uppercase">Lost</h3>
          <p className="text-zinc-500 text-sm font-medium">{errorMessage}</p>
          <button onClick={() => setStatus('IDLE')} className="w-full bg-white text-black font-black py-4 rounded-[2rem] uppercase italic">Try Again</button>
        </div>
      )}
    </div>
  );
};

export default Receiver;