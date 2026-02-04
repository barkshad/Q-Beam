
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle, Download, Loader2, AlertCircle, File as FileIcon, Wifi } from 'lucide-react';
import Peer, { DataConnection } from 'peerjs';
import { QRData, SharedFileMetadata } from '../types';

interface ReceiverProps {
  myPeerId: string;
  peer: Peer;
}

interface ReceivedFile {
  url: string;
  meta: SharedFileMetadata;
}

const Receiver: React.FC<ReceiverProps> = ({ myPeerId, peer }) => {
  const [scanResult, setScanResult] = useState<QRData | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'RECEIVING' | 'COMPLETE' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [receivedFiles, setReceivedFiles] = useState<ReceivedFile[]>([]);
  const [batchTotal, setBatchTotal] = useState(0);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  // Track metadata by index before the actual file data arrives
  const pendingMeta = useRef<Map<number, SharedFileMetadata>>(new Map());

  useEffect(() => {
    if (status === 'IDLE') {
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 15, qrbox: { width: 250, height: 250 } },
        false
      );

      scanner.render(onScanSuccess, () => {});
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, [status]);

  const onScanSuccess = (decodedText: string) => {
    try {
      const data: QRData = JSON.parse(decodedText);
      setScanResult(data);
      setStatus('CONNECTING');
      if (scannerRef.current) scannerRef.current.clear();
      initiateConnection(data);
    } catch (e) {
      console.error("Invalid QR", e);
    }
  };

  const initiateConnection = (data: QRData) => {
    const conn: DataConnection = peer.connect(data.hostId);

    conn.on('open', () => setStatus('RECEIVING'));

    conn.on('data', (payload: any) => {
      if (payload.type === 'BATCH_START') {
        setBatchTotal(payload.payload.count);
      } else if (payload.type === 'META') {
        const meta = payload.payload;
        pendingMeta.current.set(meta.index, meta);
      } else if (payload.type === 'FILE') {
        const { index, data: fileData } = payload.payload;
        const meta = pendingMeta.current.get(index);
        
        if (meta) {
          const blob = new Blob([fileData], { type: meta.type });
          const url = URL.createObjectURL(blob);
          
          setReceivedFiles(prev => {
            const newList = [...prev, { url, meta }];
            if (newList.length === batchTotal && batchTotal > 0) {
              setStatus('COMPLETE');
            }
            return newList;
          });
        }
      }
    });

    conn.on('error', () => {
      setStatus('ERROR');
      setErrorMessage("Beam interrupted. Check network.");
    });
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
        <p className="text-zinc-500 text-sm font-medium">Awaiting incoming data stream.</p>
      </div>

      {status === 'IDLE' && (
        <div className="relative group overflow-hidden rounded-[2.5rem] border-4 border-zinc-900 bg-black shadow-2xl">
          <div id="qr-reader" className="w-full" />
          <div className="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="bg-black/80 backdrop-blur px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-3">
              <Camera className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Sensor Active</span>
            </div>
          </div>
          <div className="absolute inset-x-10 bottom-10 h-0.5 bg-green-500/20 overflow-hidden rounded-full">
            <div className="h-full bg-green-500 w-1/3 animate-ping" />
          </div>
        </div>
      )}

      {(status === 'CONNECTING' || status === 'RECEIVING') && (
        <div className="p-16 glass rounded-[3rem] flex flex-col items-center text-center space-y-8 border-green-500/20">
          <div className="relative">
            <div className="w-28 h-28 border-[6px] border-zinc-800 rounded-full flex items-center justify-center">
               <div className="w-20 h-20 border-[6px] border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
               <Wifi className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-white italic uppercase tracking-wider">
              {status === 'CONNECTING' ? 'Handshake' : 'Intercepting'}
            </h3>
            <p className="text-zinc-500 text-sm font-bold mt-2 uppercase tracking-widest">
              {status === 'RECEIVING' ? `Beam Progress: ${receivedFiles.length} / ${batchTotal}` : 'Receiving Bits via P2P Mesh'}
            </p>
          </div>
        </div>
      )}

      {status === 'COMPLETE' && receivedFiles.length > 0 && (
        <div className="glass p-10 rounded-[3rem] flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 border-green-500">
          <div className="w-24 h-24 bg-green-500 text-black rounded-full flex items-center justify-center shadow-2xl shadow-green-500/20">
            <CheckCircle className="w-12 h-12" />
          </div>
          
          <div className="space-y-4 w-full">
            <h3 className="text-3xl font-black text-white italic uppercase">Intercepted</h3>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">{receivedFiles.length} items recovered</p>
            
            <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
              {receivedFiles.map((file, i) => (
                <div key={i} className="flex flex-col gap-4 p-6 bg-black rounded-[2rem] border border-zinc-800 w-full text-left">
                  <div className="flex items-center gap-3">
                    <FileIcon className="w-8 h-8 text-green-500 flex-shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-sm font-bold text-white italic truncate">{file.meta.name}</p>
                      <div className="flex gap-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{formatSize(file.meta.size)}</span>
                        <span className="text-[9px] font-black text-green-500 uppercase tracking-widest">{file.meta.type.split('/')[1]?.toUpperCase() || 'DATA'}</span>
                      </div>
                    </div>
                  </div>
                  <a
                    href={file.url}
                    download={file.meta.name}
                    className="w-full bg-white hover:bg-zinc-200 text-black font-black py-3 rounded-xl flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all uppercase italic tracking-widest text-xs"
                  >
                    Save <Download className="w-4 h-4" />
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
            className="text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-[0.3em]"
          >
            Ready for Next Beam
          </button>
        </div>
      )}

      {status === 'ERROR' && (
        <div className="p-12 glass rounded-[3rem] flex flex-col items-center text-center space-y-6 border-rose-500/30">
          <AlertCircle className="w-16 h-16 text-rose-500" />
          <h3 className="text-2xl font-black text-white italic uppercase">Beam Lost</h3>
          <p className="text-zinc-500 text-sm font-medium">{errorMessage}</p>
          <button 
            onClick={() => setStatus('IDLE')}
            className="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-black py-4 rounded-[2rem] uppercase italic"
          >
            Re-initiate
          </button>
        </div>
      )}
    </div>
  );
};

export default Receiver;
