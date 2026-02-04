import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Camera, CheckCircle, Download, AlertCircle, File as FileIcon, Cloud, ExternalLink } from 'lucide-react';
import { QRData, SharedFileMetadata } from '../types';

const Receiver: React.FC = () => {
  const [status, setStatus] = useState<'IDLE' | 'COMPLETE' | 'ERROR'>('IDLE');
  const [errorMessage, setErrorMessage] = useState('');
  const [receivedFiles, setReceivedFiles] = useState<SharedFileMetadata[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

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
      
      setReceivedFiles(data.files);
      setStatus('COMPLETE');

      // Automatically trigger downloads for all files in the batch
      data.files.forEach((file, index) => {
        setTimeout(() => {
          const link = document.createElement('a');
          // Force download using Cloudinary's attachment flag (fl_attachment)
          const downloadUrl = file.cloudUrl.includes('/upload/') 
            ? file.cloudUrl.replace('/upload/', '/upload/fl_attachment/') 
            : file.cloudUrl;
          
          link.href = downloadUrl;
          link.download = file.name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }, index * 1000); // 1-second interval to prevent browser blocking multiple simultaneous downloads
      });
    } catch (e) {
      console.error("Invalid QR", e);
      setErrorMessage("The QR code doesn't seem to be a Q-Beam payload.");
      setStatus('ERROR');
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + ['B', 'KB', 'MB', 'GB'][i];
  };

  return (
    <div className="w-full space-y-8 animate-in fade-in duration-300">
      <div className="space-y-1">
        <h2 className="text-3xl font-black text-white italic uppercase">Intercept</h2>
        <p className="text-zinc-500 text-sm font-medium">Scan QR to reveal files.</p>
      </div>

      {status === 'IDLE' && (
        <div className="relative group overflow-hidden rounded-[2.5rem] border-4 border-zinc-900 bg-black shadow-2xl">
          <div id="qr-reader" className="w-full" />
          <div className="absolute top-6 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="bg-black/80 backdrop-blur px-5 py-2.5 rounded-full border border-white/10 flex items-center gap-3">
              <Camera className="w-4 h-4 text-green-500" />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Scanner</span>
            </div>
          </div>
        </div>
      )}

      {status === 'COMPLETE' && (
        <div className="glass p-8 rounded-[3rem] flex flex-col items-center text-center space-y-6 animate-in zoom-in-95 border-green-500/30">
          <div className="w-20 h-20 bg-green-500 text-black rounded-full flex items-center justify-center shadow-xl shadow-green-500/20">
            <CheckCircle className="w-10 h-10" />
          </div>
          
          <div className="w-full space-y-4">
            <h3 className="text-2xl font-black text-white italic uppercase">Beam Decoded</h3>
            <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">Saving files automatically...</p>
            <div className="max-h-[350px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
              {receivedFiles.map((file, i) => (
                <div key={i} className="flex items-center gap-3 p-4 bg-zinc-900/60 rounded-2xl border border-zinc-800 text-left hover:border-zinc-600 transition-colors group">
                  <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center group-hover:bg-green-500/10 transition-colors">
                    <FileIcon className="w-5 h-5 text-green-500" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="text-xs font-bold text-white italic truncate">{file.name}</p>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{formatSize(file.size)}</p>
                  </div>
                  <a
                    href={file.cloudUrl.includes('/upload/') ? file.cloudUrl.replace('/upload/', '/upload/fl_attachment/') : file.cloudUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-3 bg-white text-black rounded-xl hover:bg-green-500 hover:text-white transition-all shadow-sm"
                    title="Manual Download"
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
              setStatus('IDLE');
            }}
            className="text-zinc-500 hover:text-white text-[9px] font-black uppercase tracking-[0.3em] transition-colors"
          >
            Reset Scanner
          </button>
        </div>
      )}

      {status === 'ERROR' && (
        <div className="p-12 glass rounded-[3rem] flex flex-col items-center text-center space-y-6 border-rose-500/30">
          <AlertCircle className="w-16 h-16 text-rose-500" />
          <h3 className="text-2xl font-black text-white italic uppercase">Invalid Beam</h3>
          <p className="text-zinc-500 text-sm font-medium">{errorMessage}</p>
          <button onClick={() => setStatus('IDLE')} className="w-full bg-white text-black font-black py-4 rounded-[2rem] uppercase italic">Try Again</button>
        </div>
      )}
    </div>
  );
};

export default Receiver;