
import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle, Download, Loader2, AlertCircle, File as FileIcon } from 'lucide-react';
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
        { fps: 10, qrbox: { width: 250, height: 250 } },
        /* verbose= */ false
      );

      scanner.render(onScanSuccess, onScanFailure);
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.warn("Failed to clear scanner", e));
      }
    };
  }, [status]);

  const onScanSuccess = (decodedText: string) => {
    try {
      const data: QRData = JSON.parse(decodedText);
      setScanResult(data);
      setStatus('CONNECTING');
      if (scannerRef.current) {
        scannerRef.current.clear();
      }
      initiateConnection(data);
    } catch (e) {
      console.error("Invalid Beam QR", e);
    }
  };

  const onScanFailure = (error: any) => {
    // Silent failure for continuous scanning
  };

  const initiateConnection = (data: QRData) => {
    const conn: DataConnection = peer.connect(data.hostId);
    let meta: SharedFileMetadata | null = null;

    conn.on('open', () => {
      setStatus('RECEIVING');
      console.log('Connection to sender established');
    });

    conn.on('data', (data: any) => {
      if (data.type === 'META') {
        meta = data.payload;
        console.log('Metadata received:', meta);
      } else if (data.type === 'FILE' && meta) {
        const blob = new Blob([data.payload], { type: meta.type });
        const url = URL.createObjectURL(blob);
        setReceivedFile({ url, meta });
        setStatus('COMPLETE');
        conn.close();
      }
    });

    conn.on('error', (err) => {
      console.error("P2P Error:", err);
      setStatus('ERROR');
      setErrorMessage("Connection lost or timed out.");
    });
  };

  const formatSize = (bytes: number) => {
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-300">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold text-white">Receiver Mode</h2>
        <p className="text-slate-400 text-sm">
          {status === 'IDLE' ? 'Align the QR code within the frame.' : 'Stay on this page until download starts.'}
        </p>
      </div>

      {status === 'IDLE' && (
        <div className="relative group overflow-hidden rounded-3xl border border-slate-700 bg-black shadow-2xl shadow-blue-500/10">
          <div id="qr-reader" className="w-full overflow-hidden" />
          <div className="absolute top-4 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-white/10 flex items-center gap-2">
              <Camera className="w-4 h-4 text-blue-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">Scanning Active</span>
            </div>
          </div>
        </div>
      )}

      {(status === 'CONNECTING' || status === 'RECEIVING') && (
        <div className="p-12 glass rounded-3xl flex flex-col items-center text-center space-y-6">
          <div className="relative">
            <div className="w-24 h-24 border-4 border-blue-500/20 rounded-full flex items-center justify-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
            <div className="absolute -bottom-1 -right-1 bg-blue-500 w-8 h-8 rounded-full flex items-center justify-center border-4 border-slate-950">
              <Zap className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">
              {status === 'CONNECTING' ? 'Establishing Beam...' : 'Receiving Data...'}
            </h3>
            <p className="text-slate-400 text-sm mt-2">Connecting to sender via WebRTC mesh.</p>
          </div>
        </div>
      )}

      {status === 'COMPLETE' && receivedFile && (
        <div className="glass p-8 rounded-3xl flex flex-col items-center text-center space-y-6 animate-in zoom-in-95">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center text-green-500">
            <CheckCircle className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-white">Beam Successful</h3>
            <div className="flex flex-col items-center gap-1 p-4 bg-slate-950/50 rounded-2xl w-full border border-slate-800">
              <FileIcon className="w-8 h-8 text-blue-400 mb-2" />
              <p className="text-sm font-medium text-slate-200 line-clamp-1">{receivedFile.meta.name}</p>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">
                {formatSize(receivedFile.meta.size)} • {receivedFile.meta.type.split('/')[1] || 'FILE'}
              </p>
            </div>
          </div>
          <a
            href={receivedFile.url}
            download={receivedFile.meta.name}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 active:scale-95 transition-all"
          >
            Download File <Download className="w-5 h-5" />
          </a>
          <button 
            onClick={() => setStatus('IDLE')}
            className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest"
          >
            Receive Another
          </button>
        </div>
      )}

      {status === 'ERROR' && (
        <div className="p-8 glass rounded-3xl flex flex-col items-center text-center space-y-4">
          <AlertCircle className="w-12 h-12 text-rose-500" />
          <h3 className="text-xl font-bold text-white">Beam Interrupted</h3>
          <p className="text-slate-400 text-sm">{errorMessage}</p>
          <button 
            onClick={() => setStatus('IDLE')}
            className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-2xl"
          >
            Try Again
          </button>
        </div>
      )}
    </div>
  );
};

// Helper Icon
const Zap: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M13 10V3L4 14H11V21L20 10H13Z" />
  </svg>
);

export default Receiver;
