
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
// Added Wifi to the imports from lucide-react
import { Camera, CheckCircle, Download, Loader2, AlertCircle, File as FileIcon, Wifi } from 'lucide-react';
import Peer, { DataConnection } from 'peerjs';
import { QRData, SharedFileMetadata } from '../types';

interface ReceiverProps {
  myPeerId: string;
  peer: Peer;
}

const Receiver: React.FC<ReceiverProps> = ({ myPeerId, peer }) => {
  const [scanResult, setScanResult] = useState<QRData | null>(null);
  const [status, setStatus] = useState<'IDLE' | 'CONNECTING' | 'RECEIVING' | 'COMPLETE' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [receivedFile, setReceivedFile] = useState<{ url: string; meta: SharedFileMetadata } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

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
    let meta: SharedFileMetadata | null = null;

    conn.on('open', () => setStatus('RECEIVING'));

    conn.on('data', (data: any) => {
      if (data.type === 'META') {
        meta = data.payload;
      } else if (data.type === 'FILE' && meta) {
        const blob = new Blob([data.payload], { type: meta.type });
        const url = URL.createObjectURL(blob);
        setReceivedFile({ url, meta });
        setStatus('COMPLETE');
        conn.close();
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
            <p className="text-zinc-500 text-sm font-bold mt-2 uppercase tracking-widest">Receiving Bits via P2P Mesh</p>
          </div>
        </div>
      )}

      {status === 'COMPLETE' && receivedFile && (
        <div className="glass p-10 rounded-[3rem] flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 border-green-500">
          <div className="w-24 h-24 bg-green-500 text-black rounded-full flex items-center justify-center shadow-2xl shadow-green-500/20">
            <CheckCircle className="w-12 h-12" />
          </div>
          <div className="space-y-4 w-full">
            <h3 className="text-3xl font-black text-white italic uppercase">Intercepted</h3>
            <div className="flex flex-col items-center gap-2 p-6 bg-black rounded-[2rem] border border-zinc-800 w-full">
              <FileIcon className="w-10 h-10 text-green-500 mb-2" />
              <p className="text-lg font-bold text-white italic line-clamp-1">{receivedFile.meta.name}</p>
              <div className="flex gap-2">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-900 px-3 py-1 rounded-full">{formatSize(receivedFile.meta.size)}</span>
                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest bg-green-500/10 px-3 py-1 rounded-full">{receivedFile.meta.type.split('/')[1]?.toUpperCase() || 'DATA'}</span>
              </div>
            </div>
          </div>
          <a
            href={receivedFile.url}
            download={receivedFile.meta.name}
            className="w-full bg-white hover:bg-zinc-200 text-black font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all uppercase italic tracking-widest"
          >
            Save to Device <Download className="w-6 h-6" />
          </a>
          <button 
            onClick={() => setStatus('IDLE')}
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
